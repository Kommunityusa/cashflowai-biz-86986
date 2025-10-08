import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Running scheduled email sequence check...');

    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all email sequences
    const { data: sequences, error: seqError } = await supabase
      .from('email_sequences')
      .select('*')
      .order('created_at', { ascending: true });

    if (seqError) {
      console.error('Error fetching email sequences:', seqError);
      throw seqError;
    }

    if (!sequences || sequences.length === 0) {
      console.log('No email sequences found');
      return new Response(
        JSON.stringify({ message: 'No email sequences to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      followup: { sent: 0, skipped: 0 },
      monthly: { sent: 0, skipped: 0 },
    };

    for (const sequence of sequences) {
      const createdAt = new Date(sequence.created_at);

      // Check for 2-week follow-up email
      if (!sequence.followup_sent_at && createdAt <= twoWeeksAgo) {
        console.log(`Sending follow-up email to: ${sequence.email}`);
        
        try {
          await supabase.functions.invoke('send-email-sequence', {
            body: {
              type: 'followup',
              to: sequence.email,
              name: sequence.user_name || 'there',
            },
          });

          await supabase
            .from('email_sequences')
            .update({ followup_sent_at: now.toISOString() })
            .eq('id', sequence.id);

          results.followup.sent++;
          console.log(`Follow-up email sent to: ${sequence.email}`);
        } catch (error) {
          console.error(`Failed to send follow-up email to ${sequence.email}:`, error);
          results.followup.skipped++;
        }
      } else if (sequence.followup_sent_at) {
        results.followup.skipped++;
      }

      // Check for 1-month insights email
      if (!sequence.monthly_sent_at && createdAt <= oneMonthAgo) {
        console.log(`Sending monthly insights email to: ${sequence.email}`);
        
        try {
          await supabase.functions.invoke('send-email-sequence', {
            body: {
              type: 'monthly',
              to: sequence.email,
              name: sequence.user_name || 'there',
            },
          });

          await supabase
            .from('email_sequences')
            .update({ monthly_sent_at: now.toISOString() })
            .eq('id', sequence.id);

          results.monthly.sent++;
          console.log(`Monthly insights email sent to: ${sequence.email}`);
        } catch (error) {
          console.error(`Failed to send monthly email to ${sequence.email}:`, error);
          results.monthly.skipped++;
        }
      } else if (sequence.monthly_sent_at) {
        results.monthly.skipped++;
      }
    }

    console.log('Scheduled email check complete:', results);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Scheduled email sequence check complete',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-scheduled-emails function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailSequence {
  id: string;
  user_id: string;
  email: string;
  user_name: string;
  welcome_sent_at: string | null;
  followup_sent_at: string | null;
  tips_sent_at: string | null;
  success_sent_at: string | null;
  monthly_sent_at: string | null;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting drip campaign check...');

    // Get all email sequences
    const { data: sequences, error: sequencesError } = await supabaseClient
      .from('email_sequences')
      .select('*')
      .order('created_at', { ascending: true });

    if (sequencesError) {
      console.error('Error fetching sequences:', sequencesError);
      throw sequencesError;
    }

    console.log(`Found ${sequences?.length || 0} email sequences to check`);

    const now = new Date();
    let emailsSent = 0;

    for (const sequence of sequences || []) {
      const createdAt = new Date(sequence.created_at);
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`Checking user ${sequence.email} (${daysSinceSignup} days since signup)`);

      // Day 3: Follow-up email (if welcome was sent)
      if (daysSinceSignup >= 3 && !sequence.followup_sent_at && sequence.welcome_sent_at) {
        console.log(`Sending followup email to ${sequence.email}`);
        await sendEmail(supabaseClient, 'followup', sequence);
        await updateSequence(supabaseClient, sequence.id, 'followup_sent_at');
        emailsSent++;
      }

      // Day 7: Tips email
      if (daysSinceSignup >= 7 && !sequence.tips_sent_at) {
        console.log(`Sending tips email to ${sequence.email}`);
        await sendEmail(supabaseClient, 'tips', sequence);
        await updateSequence(supabaseClient, sequence.id, 'tips_sent_at');
        emailsSent++;
      }

      // Day 21: Success stories email
      if (daysSinceSignup >= 21 && !sequence.success_sent_at) {
        console.log(`Sending success stories email to ${sequence.email}`);
        await sendEmail(supabaseClient, 'success', sequence);
        await updateSequence(supabaseClient, sequence.id, 'success_sent_at');
        emailsSent++;
      }

      // Monthly: Insights email (send if 30+ days and either never sent or 30+ days since last monthly)
      if (daysSinceSignup >= 30) {
        const shouldSendMonthly = !sequence.monthly_sent_at || 
          (Math.floor((now.getTime() - new Date(sequence.monthly_sent_at).getTime()) / (1000 * 60 * 60 * 24)) >= 30);
        
        if (shouldSendMonthly) {
          console.log(`Sending monthly insights email to ${sequence.email}`);
          await sendEmail(supabaseClient, 'monthly', sequence);
          await updateSequence(supabaseClient, sequence.id, 'monthly_sent_at');
          emailsSent++;
        }
      }
    }

    console.log(`Drip campaign complete. Sent ${emailsSent} emails.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent,
        message: `Sent ${emailsSent} drip campaign emails`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in drip campaign:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendEmail(supabaseClient: any, type: string, sequence: EmailSequence) {
  try {
    const { error } = await supabaseClient.functions.invoke('send-email-sequence', {
      body: {
        type,
        to: sequence.email,
        name: sequence.user_name || 'there'
      }
    });

    if (error) {
      console.error(`Error sending ${type} email to ${sequence.email}:`, error);
      throw error;
    }

    console.log(`Successfully sent ${type} email to ${sequence.email}`);
  } catch (error) {
    console.error(`Failed to send ${type} email:`, error);
    throw error;
  }
}

async function updateSequence(supabaseClient: any, sequenceId: string, field: string) {
  const { error } = await supabaseClient
    .from('email_sequences')
    .update({ [field]: new Date().toISOString() })
    .eq('id', sequenceId);

  if (error) {
    console.error(`Error updating ${field} for sequence ${sequenceId}:`, error);
    throw error;
  }
}

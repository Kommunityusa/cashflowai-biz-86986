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
    
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending welcome email for user: ${userId}`);

    // Get user's email sequence record
    const { data: sequence, error: seqError } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (seqError || !sequence) {
      console.error('Email sequence not found:', seqError);
      return new Response(
        JSON.stringify({ error: 'User email sequence not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if welcome email already sent
    if (sequence.welcome_sent_at) {
      console.log('Welcome email already sent');
      return new Response(
        JSON.stringify({ message: 'Welcome email already sent', sent_at: sequence.welcome_sent_at }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send welcome email
    const { data: emailData, error: emailError } = await supabase.functions.invoke(
      'send-email-sequence',
      {
        body: {
          type: 'welcome',
          to: sequence.email,
          name: sequence.user_name || 'there',
        },
      }
    );

    if (emailError) {
      console.error('Failed to send welcome email:', emailError);
      throw emailError;
    }

    // Mark welcome email as sent
    const { error: updateError } = await supabase
      .from('email_sequences')
      .update({ welcome_sent_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update email sequence:', updateError);
    }

    console.log('Welcome email sent successfully to:', sequence.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent',
        recipient: sequence.email 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-welcome-email function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
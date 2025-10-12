import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      throw new Error("Email is required");
    }

    console.log("Processing newsletter subscription for:", email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract name from email (use first part of email as fallback)
    const userName = email.split('@')[0];

    // Add to email_sequences table for drip campaign
    const { data: sequenceData, error: sequenceError } = await supabase
      .from('email_sequences')
      .upsert({
        email,
        user_name: userName,
        user_id: null, // Newsletter subscribers don't have user_id yet
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (sequenceError) {
      console.error("Error adding to email sequences:", sequenceError);
      throw sequenceError;
    }

    console.log("Added to email sequences:", sequenceData);

    // Send welcome email immediately
    const { data: welcomeData, error: welcomeError } = await supabase.functions.invoke(
      'send-email-sequence',
      {
        body: {
          to: email,
          name: userName,
          type: 'welcome'
        }
      }
    );

    if (welcomeError) {
      console.error("Error sending welcome email:", welcomeError);
      // Don't throw - we still want to return success if they were added to sequences
    }

    console.log("Welcome email sent:", welcomeData);

    // Also add to MailerLite if available
    try {
      const mailerliteKey = Deno.env.get('MAILERLITE_API_KEY');
      if (mailerliteKey) {
        const { error: mailerliteError } = await supabase.functions.invoke(
          'mailerlite-subscribe',
          {
            body: {
              email,
              fields: {
                company: "Cash Flow AI Newsletter"
              }
            }
          }
        );

        if (mailerliteError) {
          console.error("MailerLite subscription error:", mailerliteError);
        }
      }
    } catch (e) {
      console.log("MailerLite not configured or error occurred:", e);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully subscribed to newsletter",
        data: sequenceData
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in newsletter-subscribe function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

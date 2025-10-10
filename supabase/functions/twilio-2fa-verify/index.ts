import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, code, serviceSid } = await req.json();
    
    if (!phoneNumber || !code || !serviceSid) {
      throw new Error('Phone number, code, and serviceSid are required');
    }

    console.log('Verifying code for phone:', phoneNumber);

    // Verify the code using Twilio Verify API
    const verificationCheckUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;
    
    const response = await fetch(verificationCheckUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        Code: code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio verification check error:', errorText);
      throw new Error(`Failed to verify code: ${errorText}`);
    }

    const data = await response.json();

    console.log('Verification result:', data.status);

    if (data.status === 'approved') {
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          message: 'Invalid verification code',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in twilio-2fa-verify:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

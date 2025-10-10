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
    const { phoneNumber } = await req.json();
    
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    console.log('Creating Twilio Verify service for phone:', phoneNumber);

    // Create a verification using Twilio Verify API
    const verifyUrl = `https://verify.twilio.com/v2/Services`;
    
    // First, create or get a verification service
    const servicesResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        FriendlyName: 'CashFlow AI 2FA',
      }),
    });

    if (!servicesResponse.ok) {
      const errorText = await servicesResponse.text();
      console.error('Twilio service creation error:', errorText);
      throw new Error(`Failed to create Twilio service: ${errorText}`);
    }

    const serviceData = await servicesResponse.json();
    const serviceSid = serviceData.sid;

    console.log('Twilio service created:', serviceSid);

    // Start verification
    const verificationUrl = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
    
    const verificationResponse = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        Channel: 'sms',
      }),
    });

    if (!verificationResponse.ok) {
      const errorText = await verificationResponse.text();
      console.error('Twilio verification error:', errorText);
      throw new Error(`Failed to send verification: ${errorText}`);
    }

    const verificationData = await verificationResponse.json();

    console.log('Verification sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        serviceSid,
        status: verificationData.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in twilio-2fa-enroll:', error);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CampaignRequest {
  name: string;
  subject: string;
  from_name: string;
  from_email: string;
  groups?: string[]; // Group IDs to send to
  html?: string;
  plain_text?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const campaignData: CampaignRequest = await req.json();

    if (!campaignData.name || !campaignData.subject || !campaignData.from_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, subject, from_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('MAILERLITE_API_KEY');
    if (!apiKey) {
      console.error('MAILERLITE_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating MailerLite campaign: ${campaignData.name}`);

    // MailerLite API v2 - Create campaign
    const response = await fetch('https://connect.mailerlite.com/api/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: campaignData.name,
        type: 'regular',
        emails: [{
          subject: campaignData.subject,
          from_name: campaignData.from_name,
          from: campaignData.from_email,
          content: campaignData.html || campaignData.plain_text || '',
        }],
        groups: campaignData.groups || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MailerLite API error:', response.status, data);
      return new Response(
        JSON.stringify({ error: 'Failed to create campaign', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Campaign created successfully:', data);

    return new Response(
      JSON.stringify({ success: true, campaign: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in mailerlite-campaign function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
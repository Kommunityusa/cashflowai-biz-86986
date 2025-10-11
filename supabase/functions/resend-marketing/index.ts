import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketingEmailRequest {
  action: 'subscribe' | 'unsubscribe' | 'send_campaign';
  email?: string;
  name?: string;
  audience_id?: string;
  campaign?: {
    subject: string;
    html: string;
    from_name?: string;
    audience_id: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, name, audience_id, campaign }: MarketingEmailRequest = await req.json();

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle newsletter subscription
    if (action === 'subscribe' && email) {
      console.log(`Adding subscriber to Resend: ${email}`);
      
      const { error } = await resend.contacts.create({
        email,
        firstName: name || '',
        audienceId: audience_id || Deno.env.get('RESEND_AUDIENCE_ID') || '',
      });

      if (error) {
        console.error('Resend API error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to subscribe', details: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Subscriber added successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'Subscribed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle newsletter unsubscribe
    if (action === 'unsubscribe' && email && audience_id) {
      console.log(`Removing subscriber from Resend: ${email}`);
      
      const { error } = await resend.contacts.remove({
        email,
        audienceId: audience_id,
      });

      if (error) {
        console.error('Resend API error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to unsubscribe', details: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Subscriber removed successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'Unsubscribed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle sending marketing campaign
    if (action === 'send_campaign' && campaign) {
      console.log(`Sending marketing campaign: ${campaign.subject}`);
      
      const { error } = await resend.emails.send({
        from: `${campaign.from_name || 'Cash Flow AI'} <marketing@cashflowai.biz>`,
        to: campaign.audience_id, // This should be a list of emails or audience ID
        subject: campaign.subject,
        html: campaign.html,
      });

      if (error) {
        console.error('Resend API error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to send campaign', details: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Campaign sent successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'Campaign sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or missing parameters' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in resend-marketing function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

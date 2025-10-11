import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { Resend } from 'npm:resend@4.0.0';
import { WelcomeEmail } from './_templates/welcome-email.tsx';
import { FollowUpEmail } from './_templates/followup-email.tsx';
import { MonthlyInsightsEmail } from './_templates/monthly-insights-email.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: 'welcome' | 'followup' | 'monthly';
  to: string;
  name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, name }: EmailRequest = await req.json();

    if (!type || !to || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, to, name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let html: string;
    let subject: string;

    // Render the appropriate email template
    switch (type) {
      case 'welcome':
        html = await renderAsync(
          React.createElement(WelcomeEmail, { name, email: to })
        );
        subject = 'Welcome to Cash Flow AI - Let\'s Get Started!';
        break;
      
      case 'followup':
        html = await renderAsync(
          React.createElement(FollowUpEmail, { name })
        );
        subject = 'How are things going with Cash Flow AI?';
        break;
      
      case 'monthly':
        html = await renderAsync(
          React.createElement(MonthlyInsightsEmail, { name })
        );
        subject = 'Your Monthly Bookkeeping Insights from Cash Flow AI';
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid email type. Use: welcome, followup, or monthly' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Sending ${type} email to: ${to}`);

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Cash Flow AI <hello@cashflowai.biz>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (emailError) {
      console.error('Resend API error:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: emailError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`${type} email sent successfully to ${to}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${type} email sent successfully`,
        type,
        recipient: to 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-email-sequence function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
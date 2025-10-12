import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: 'welcome' | 'followup' | 'monthly' | 'tips' | 'success';
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

    // Create simple HTML email templates
    switch (type) {
      case 'welcome':
        subject = 'Welcome to Cash Flow AI - Let\'s Get Started!';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to Cash Flow AI, ${name}!</h1>
            <p>We're excited to have you on board. Cash Flow AI makes bookkeeping simple and intelligent.</p>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Connect your bank accounts for automatic transaction imports</li>
              <li>Let AI categorize your transactions</li>
              <li>Generate tax-ready reports instantly</li>
            </ul>
            <p><a href="https://cashflowai.biz" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Get Started</a></p>
            <p>Best regards,<br>The Cash Flow AI Team</p>
          </div>
        `;
        break;
      
      case 'followup':
        subject = 'How are things going with Cash Flow AI?';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Hi ${name},</h1>
            <p>We wanted to check in and see how you're doing with Cash Flow AI.</p>
            <h2>Quick Tips:</h2>
            <ul>
              <li>Review your transaction categories for accuracy</li>
              <li>Set up budget alerts to stay on track</li>
              <li>Export reports for your accountant</li>
            </ul>
            <p>Need help? Just reply to this email.</p>
            <p>Best regards,<br>The Cash Flow AI Team</p>
          </div>
        `;
        break;
      
      case 'monthly':
        subject = 'Your Monthly Bookkeeping Insights from Cash Flow AI';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Monthly Insights for ${name}</h1>
            <p>Here are your key bookkeeping habits for this month:</p>
            <ul>
              <li>Review and categorize transactions weekly</li>
              <li>Reconcile bank accounts monthly</li>
              <li>Track expenses against budget</li>
            </ul>
            <p><a href="https://cashflowai.biz/dashboard" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a></p>
            <p>Best regards,<br>The Cash Flow AI Team</p>
          </div>
        `;
        break;
      
      case 'tips':
        subject = '5 Quick Tips to Save Time with Cash Flow AI';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">5 Time-Saving Tips, ${name}</h1>
            <ol>
              <li>Use AI categorization to save hours each month</li>
              <li>Set up recurring transaction rules</li>
              <li>Enable bank sync for automatic imports</li>
              <li>Use bulk operations for multiple transactions</li>
              <li>Export reports directly to your accountant</li>
            </ol>
            <p><a href="https://cashflowai.biz" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Saving Time</a></p>
            <p>Best regards,<br>The Cash Flow AI Team</p>
          </div>
        `;
        break;
      
      case 'success':
        subject = 'How Businesses Like Yours Are Saving Time';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Success Stories</h1>
            <p>Hi ${name},</p>
            <p>See how other businesses are using Cash Flow AI:</p>
            <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>Founder's Alley</h3>
              <p>"Saved 15 hours per month on bookkeeping"</p>
            </div>
            <p><a href="https://cashflowai.biz" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Join Them</a></p>
            <p>Best regards,<br>The Cash Flow AI Team</p>
          </div>
        `;
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid email type. Use: welcome, followup, tips, success, or monthly' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Sending ${type} email to: ${to}`);

    // Send email via Resend REST API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Cash Flow AI <hello@cashflowai.biz>',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MAILERSEND_API_KEY = Deno.env.get("MAILERSEND_API_KEY");
const MAILERSEND_API_URL = "https://api.mailersend.com/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MAILERSEND_API_KEY) {
      console.error("MailerSend API key not configured");
      return new Response(
        JSON.stringify({ error: "MailerSend API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { to, subject, html, text }: EmailRequest = await req.json();

    console.log(`Sending transactional email to ${to}`);

    // Send email via MailerSend API
    const response = await fetch(`${MAILERSEND_API_URL}/email`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MAILERSEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: "support@cashflowai.biz",
          name: "Cash Flow AI"
        },
        to: [
          {
            email: to,
            name: to.split('@')[0]
          }
        ],
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]*>/g, ''),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MailerSend API error response:", errorText);
      console.error("MailerSend API status:", response.status);
      throw new Error(`MailerSend API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        messageId: result['X-Message-Id']
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending transactional email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
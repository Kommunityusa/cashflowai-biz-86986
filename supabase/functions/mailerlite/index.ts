import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MAILERLITE_API_KEY = Deno.env.get("MAILERLITE_API_KEY");
const MAILERLITE_API_URL = "https://api.mailerlite.com/api/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriberData {
  email: string;
  name?: string;
  fields?: Record<string, any>;
  groups?: string[];
  resubscribe?: boolean;
}

interface CampaignData {
  subject: string;
  from_name: string;
  from_email: string;
  content: string;
  groups?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (!MAILERLITE_API_KEY) {
      throw new Error("MailerLite API key not configured");
    }

    // Handle different endpoints
    switch (path) {
      case "subscribe": {
        const data: SubscriberData = await req.json();
        console.log("Adding subscriber:", data.email);

        const response = await fetch(`${MAILERLITE_API_URL}/subscribers`, {
          method: "POST",
          headers: {
            "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            name: data.name,
            fields: data.fields || {},
            groups: data.groups || [],
            resubscribe: data.resubscribe !== false,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("MailerLite API error:", result);
          throw new Error(result.error?.message || "Failed to add subscriber");
        }

        console.log("Subscriber added successfully:", result);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "unsubscribe": {
        const { email } = await req.json();
        console.log("Unsubscribing:", email);

        const response = await fetch(`${MAILERLITE_API_URL}/subscribers/${email}`, {
          method: "DELETE",
          headers: {
            "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
          },
        });

        if (!response.ok && response.status !== 404) {
          const error = await response.json();
          console.error("MailerLite API error:", error);
          throw new Error(error.error?.message || "Failed to unsubscribe");
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "groups": {
        console.log("Fetching groups");

        const response = await fetch(`${MAILERLITE_API_URL}/groups`, {
          method: "GET",
          headers: {
            "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("MailerLite API error:", result);
          throw new Error(result.error?.message || "Failed to fetch groups");
        }

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "subscribers": {
        console.log("Fetching subscribers");

        const response = await fetch(`${MAILERLITE_API_URL}/subscribers`, {
          method: "GET",
          headers: {
            "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("MailerLite API error:", result);
          throw new Error(result.error?.message || "Failed to fetch subscribers");
        }

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send-campaign": {
        const data: CampaignData = await req.json();
        console.log("Creating and sending campaign:", data.subject);

        // First, create the campaign
        const createResponse = await fetch(`${MAILERLITE_API_URL}/campaigns`, {
          method: "POST",
          headers: {
            "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "regular",
            subject: data.subject,
            from: data.from_email,
            from_name: data.from_name,
            groups: data.groups || [],
          }),
        });

        const campaign = await createResponse.json();

        if (!createResponse.ok) {
          console.error("Failed to create campaign:", campaign);
          throw new Error(campaign.error?.message || "Failed to create campaign");
        }

        // Update campaign content
        const contentResponse = await fetch(
          `${MAILERLITE_API_URL}/campaigns/${campaign.id}/content`,
          {
            method: "PUT",
            headers: {
              "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              html: data.content,
              plain: data.content.replace(/<[^>]*>/g, ""), // Strip HTML for plain text
            }),
          }
        );

        if (!contentResponse.ok) {
          const error = await contentResponse.json();
          console.error("Failed to update campaign content:", error);
          throw new Error(error.error?.message || "Failed to update campaign content");
        }

        // Send the campaign
        const sendResponse = await fetch(
          `${MAILERLITE_API_URL}/campaigns/${campaign.id}/actions/send`,
          {
            method: "POST",
            headers: {
              "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
            },
          }
        );

        if (!sendResponse.ok) {
          const error = await sendResponse.json();
          console.error("Failed to send campaign:", error);
          throw new Error(error.error?.message || "Failed to send campaign");
        }

        return new Response(
          JSON.stringify({ success: true, campaignId: campaign.id }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("Error in mailerlite function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
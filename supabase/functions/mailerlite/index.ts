import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAILERLITE_API_KEY = Deno.env.get("MAILERLITE_API_KEY");
const MAILERLITE_API_URL = "https://api.mailerlite.com/api/v2";
const MAILERLITE_WEBHOOK_SECRET = Deno.env.get("MAILERLITE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
  emails?: string[]; // Add support for specific emails
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
      case "webhook": {
        // Handle MailerLite webhooks
        try {
          const body = await req.text();
          
          // Verify webhook signature if secret is configured
          if (MAILERLITE_WEBHOOK_SECRET) {
            const signature = req.headers.get('X-MailerLite-Signature');
            
            if (!signature) {
              console.error("Missing webhook signature");
              return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            
            // Create HMAC signature using Web Crypto API
            const encoder = new TextEncoder();
            const key = await globalThis.crypto.subtle.importKey(
              "raw",
              encoder.encode(MAILERLITE_WEBHOOK_SECRET),
              { name: "HMAC", hash: "SHA-256" },
              false,
              ["sign"]
            );
            
            const signatureBuffer = await globalThis.crypto.subtle.sign(
              "HMAC",
              key,
              encoder.encode(body)
            );
            
            const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
            
            if (signature !== expectedSignature) {
              console.error("Invalid webhook signature");
              return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
          
          const webhookData = JSON.parse(body);
          console.log("Received MailerLite webhook:", webhookData.type, webhookData);

          // Always return success immediately to MailerLite
          // Process the webhook asynchronously to avoid timeouts
          const response = new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });

          // Process webhook data asynchronously
          (async () => {
            try {
              const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

              // Handle different webhook events
              switch (webhookData.type) {
                case "subscriber.created":
                  console.log("New subscriber created:", webhookData.data?.subscriber?.email);
                  // Could sync with our database if needed
                  break;

                case "subscriber.updated":
                  console.log("Subscriber updated:", webhookData.data?.subscriber?.email);
                  break;

                case "subscriber.unsubscribed":
                  const unsubEmail = webhookData.data?.subscriber?.email;
                  if (unsubEmail) {
                    await supabase
                      .from("email_subscribers")
                      .update({
                        unsubscribed: true,
                        unsubscribed_at: new Date().toISOString(),
                      })
                      .eq("email", unsubEmail);
                    console.log(`Marked ${unsubEmail} as unsubscribed in database`);
                  }
                  break;

                case "subscriber.bounced":
                  const bouncedEmail = webhookData.data?.subscriber?.email;
                  if (bouncedEmail) {
                    const { data: subscriber } = await supabase
                      .from("email_subscribers")
                      .select("id")
                      .eq("email", bouncedEmail)
                      .single();

                    if (subscriber) {
                      await supabase
                        .from("email_logs")
                        .insert({
                          subscriber_id: subscriber.id,
                          email_number: 0,
                          subject: "Bounce Event",
                          status: "bounced",
                          error_message: "Email bounced",
                        });
                    }
                    console.log(`Logged bounce event for ${bouncedEmail}`);
                  }
                  break;

                case "subscriber.spam_reported":
                  const spamEmail = webhookData.data?.subscriber?.email;
                  if (spamEmail) {
                    await supabase
                      .from("email_subscribers")
                      .update({
                        unsubscribed: true,
                        unsubscribed_at: new Date().toISOString(),
                      })
                      .eq("email", spamEmail);
                    console.log(`Marked ${spamEmail} as unsubscribed due to spam complaint`);
                  }
                  break;

                case "subscriber.deleted":
                  const deletedEmail = webhookData.data?.subscriber?.email;
                  if (deletedEmail) {
                    await supabase
                      .from("email_subscribers")
                      .update({
                        unsubscribed: true,
                        unsubscribed_at: new Date().toISOString(),
                      })
                      .eq("email", deletedEmail);
                    console.log(`Marked ${deletedEmail} as deleted/unsubscribed`);
                  }
                  break;

                case "campaign.click":
                  console.log("Campaign click:", webhookData.data);
                  // Could track engagement metrics
                  break;

                case "campaign.open":
                  console.log("Campaign opened:", webhookData.data);
                  // Could track open rates
                  break;

                case "campaign.sent":
                  console.log("Campaign sent:", webhookData.data);
                  // Could update email logs
                  break;

                case "subscriber.automation_triggered":
                  console.log("Automation triggered:", webhookData.data);
                  break;

                case "subscriber.automation_completed":
                  console.log("Automation completed:", webhookData.data);
                  break;

                case "subscriber.form_submitted":
                  console.log("Form submitted:", webhookData.data);
                  break;

                case "subscriber.active":
                  console.log("Subscriber activated:", webhookData.data);
                  break;

                case "subscriber.removed_from_group":
                  console.log("Subscriber removed from group:", webhookData.data);
                  break;

                case "subscriber.added_to_group":
                  console.log("Subscriber added to group:", webhookData.data);
                  break;

                default:
                  console.log("Unknown webhook event:", webhookData.type);
              }
            } catch (error) {
              console.error("Error processing webhook:", error);
            }
          })();

          return response;
        } catch (error) {
          console.error("Error parsing webhook data:", error);
          // Still return success to avoid MailerLite disabling the webhook
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "subscribe": {
        const data: SubscriberData = await req.json();
        console.log("Adding subscriber:", data.email);

        // First add to MailerLite
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

        if (!response.ok && response.status !== 409) { // 409 means already exists, which is ok
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

        // Also update our database
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        await supabase
          .from("email_subscribers")
          .update({
            unsubscribed: true,
            unsubscribed_at: new Date().toISOString(),
          })
          .eq("email", email);

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
        let sendResponse;
        if (data.emails && data.emails.length > 0) {
          // Send to specific emails
          sendResponse = await fetch(
            `${MAILERLITE_API_URL}/campaigns/${campaign.id}/actions/send`,
            {
              method: "POST",
              headers: {
                "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                emails: data.emails,
              }),
            }
          );
        } else {
          // Send to groups
          sendResponse = await fetch(
            `${MAILERLITE_API_URL}/campaigns/${campaign.id}/actions/send`,
            {
              method: "POST",
              headers: {
                "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
              },
            }
          );
        }

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

      case "send-email": {
        // Simple email send to specific recipients
        const { to, subject, html, from_email = "support@cashflowai.biz", from_name = "Cash Flow AI" } = await req.json();
        
        console.log(`Sending email to ${to} with subject: ${subject}`);

        // Create a transactional email (if using MailerLite Classic)
        // For MailerLite Classic, we need to create a campaign and send immediately
        const createResponse = await fetch(`${MAILERLITE_API_URL}/campaigns`, {
          method: "POST",
          headers: {
            "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "regular",
            subject,
            from: from_email,
            from_name,
            groups: [], // No groups for transactional
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(`Failed to create email: ${error.error?.message || 'Unknown error'}`);
        }

        const campaign = await createResponse.json();

        // Set content
        await fetch(`${MAILERLITE_API_URL}/campaigns/${campaign.id}/content`, {
          method: "PUT",
          headers: {
            "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            html,
            plain: html.replace(/<[^>]*>/g, ""),
          }),
        });

        // Send to specific email
        const sendResponse = await fetch(
          `${MAILERLITE_API_URL}/campaigns/${campaign.id}/actions/send`,
          {
            method: "POST",
            headers: {
              "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              emails: Array.isArray(to) ? to : [to],
            }),
          }
        );

        if (!sendResponse.ok) {
          const error = await sendResponse.json();
          throw new Error(`Failed to send email: ${error.error?.message || 'Unknown error'}`);
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
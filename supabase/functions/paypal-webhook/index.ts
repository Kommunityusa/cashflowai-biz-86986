import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYPAL-WEBHOOK] ${step}${detailsStr}`);
};

async function verifyWebhookSignature(
  headers: Headers,
  body: string
): Promise<boolean> {
  try {
    const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

    if (!webhookId) {
      logStep("Webhook verification skipped - PAYPAL_WEBHOOK_ID not configured");
      return true; // Allow for initial testing
    }

    // Get PayPal access token
    const auth = btoa(`${clientId}:${clientSecret}`);
    const tokenResponse = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const { access_token } = await tokenResponse.json();

    // Verify webhook signature
    const verifyData = {
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    };

    const verifyResponse = await fetch(
      "https://api-m.paypal.com/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyData),
      }
    );

    const verifyResult = await verifyResponse.json();
    logStep("Webhook verification result", { status: verifyResult.verification_status });
    
    return verifyResult.verification_status === "SUCCESS";
  } catch (error) {
    logStep("Webhook verification error", { error: error.message });
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const body = await req.text();
    const event = JSON.parse(body);

    logStep("Event type", { type: event.event_type });

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(req.headers, body);
    if (!isValid) {
      logStep("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { headers: corsHeaders, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different webhook events
    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const subscriptionId = event.resource.id;
        const email = event.resource.subscriber.email_address;

        logStep("Subscription activated", { subscriptionId, email });

        // Find user by email and update their subscription
        const { data: user } = await supabaseClient
          .from("profiles")
          .select("user_id")
          .eq("user_id", (await supabaseClient.auth.admin.getUserByEmail(email)).data.user?.id)
          .single();

        if (user) {
          await supabaseClient
            .from("profiles")
            .update({
              paypal_subscription_id: subscriptionId,
              subscription_plan: "pro",
            })
            .eq("user_id", user.user_id);

          logStep("Subscription updated in database");
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        const subscriptionId = event.resource.id;

        logStep("Subscription ended", { subscriptionId, reason: event.event_type });

        // Clear subscription from all users with this subscription ID
        await supabaseClient
          .from("profiles")
          .update({
            paypal_subscription_id: null,
            subscription_plan: null,
          })
          .eq("paypal_subscription_id", subscriptionId);

        logStep("Subscription cleared from database");
        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        const saleId = event.resource.id;
        const amount = event.resource.amount.total;

        logStep("Payment completed", { saleId, amount });
        // You can add payment logging here if needed
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.event_type });
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

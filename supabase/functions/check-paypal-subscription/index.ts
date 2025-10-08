import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-PAYPAL-SUBSCRIPTION] ${step}${detailsStr}`);
};

async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const auth = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("PayPal credentials not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("User not authenticated");
    }
    logStep("User authenticated", { userId: user.id });

    // Get user's PayPal subscription ID from profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("paypal_subscription_id, subscription_plan")
      .eq("user_id", user.id)
      .single();

    if (!profile?.paypal_subscription_id) {
      logStep("No PayPal subscription found");
      return new Response(
        JSON.stringify({ subscribed: false }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    logStep("Found subscription ID", { subscriptionId: profile.paypal_subscription_id });

    const accessToken = await getPayPalAccessToken(clientId, clientSecret);
    
    const subscriptionResponse = await fetch(
      `https://api-m.paypal.com/v1/billing/subscriptions/${profile.paypal_subscription_id}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const subscription = await subscriptionResponse.json();
    
    if (!subscriptionResponse.ok) {
      logStep("PayPal API error", subscription);
      // If subscription not found, clear it from profile
      if (subscriptionResponse.status === 404) {
        await supabaseClient
          .from("profiles")
          .update({ paypal_subscription_id: null, subscription_plan: null })
          .eq("user_id", user.id);
      }
      throw new Error("Failed to fetch subscription details");
    }

    logStep("Subscription details retrieved", { status: subscription.status });

    const isActive = subscription.status === "ACTIVE";
    let subscriptionEnd = null;

    if (isActive && subscription.billing_info?.next_billing_time) {
      subscriptionEnd = subscription.billing_info.next_billing_time;
    }

    // Update profile with current subscription status
    if (!isActive) {
      await supabaseClient
        .from("profiles")
        .update({ paypal_subscription_id: null, subscription_plan: null })
        .eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify({
        subscribed: isActive,
        subscription_plan: isActive ? profile.subscription_plan : null,
        subscription_end: subscriptionEnd,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

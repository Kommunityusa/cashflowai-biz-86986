import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getErrorMessage } from '../_shared/error-handler.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("STRIPE_SECRET_KEY not configured, returning free plan");
      return new Response(
        JSON.stringify({ 
          subscribed: false, 
          plan: "free",
          inTrial: false,
          trialDaysRemaining: null,
          subscription_end: null
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      return new Response(
        JSON.stringify({ 
          subscribed: false, 
          plan: "free",
          inTrial: false,
          trialDaysRemaining: null,
          subscription_end: null
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(
        JSON.stringify({ 
          subscribed: false, 
          plan: "free",
          inTrial: false,
          trialDaysRemaining: null,
          subscription_end: null
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Check for both active and trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    // Find active or trialing subscription
    const activeSubscription = subscriptions.data.find(
      (sub: any) => sub.status === "active" || sub.status === "trialing"
    );

    if (!activeSubscription) {
      logStep("No active or trial subscription found");
      return new Response(
        JSON.stringify({ 
          subscribed: false, 
          plan: "free",
          inTrial: false,
          trialDaysRemaining: null,
          subscription_end: null
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const inTrial = activeSubscription.status === "trialing";
    const trialEnd = activeSubscription.trial_end;
    let trialDaysRemaining = null;
    
    if (inTrial && trialEnd) {
      const now = Math.floor(Date.now() / 1000);
      const daysRemaining = Math.ceil((trialEnd - now) / (60 * 60 * 24));
      trialDaysRemaining = Math.max(0, daysRemaining);
      logStep("Trial subscription", { 
        trialEnd: new Date(trialEnd * 1000).toISOString(),
        daysRemaining: trialDaysRemaining 
      });
    }

    const subscriptionEnd = new Date(activeSubscription.current_period_end * 1000).toISOString();
    
    logStep("Subscription details", { 
      status: activeSubscription.status,
      inTrial,
      trialDaysRemaining
    });

    return new Response(
      JSON.stringify({
        subscribed: true,
        plan: "pro",
        inTrial,
        trialDaysRemaining,
        subscription_end: subscriptionEnd,
        status: activeSubscription.status,
        cancelAtPeriodEnd: activeSubscription.cancel_at_period_end
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[CHECK-SUBSCRIPTION] Error:", error);
    // Return free plan on error to prevent blocking the UI
    return new Response(
      JSON.stringify({ 
        subscribed: false, 
        plan: "free",
        inTrial: false,
        trialDaysRemaining: null,
        subscription_end: null,
        error: getErrorMessage(error)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
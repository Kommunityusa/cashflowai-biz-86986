import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-TRIAL-CHECKOUT] ${step}${detailsStr}`);
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
    
    // Parse request body to get email and plan
    const { email, plan } = await req.json();
    
    // Check if user is authenticated (optional)
    const authHeader = req.headers.get("Authorization");
    let userEmail = email;
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      if (data.user) {
        userEmail = data.user.email;
        userId = data.user.id;
        logStep("Authenticated user", { userId, email: userEmail });
      }
    }
    
    if (!userEmail) throw new Error("Email is required");
    logStep("Processing checkout for", { email: userEmail, plan });

    // Determine trial period and price based on plan
    let trialPeriodDays = 14; // Default to Professional plan
    let priceId = "price_1SBQWPLKh5GKHicanc3VOXq3"; // Will need to be updated with actual price IDs
    
    switch(plan) {
      case "Starter":
        trialPeriodDays = 7;
        // You'll need to create this price in Stripe for $10/month
        priceId = "price_1SBQWPLKh5GKHicanc3VOXq3"; // Update with actual Starter price ID
        break;
      case "Professional":
        trialPeriodDays = 14;
        // You'll need to create this price in Stripe for $15/month
        priceId = "price_1SBQWPLKh5GKHicanc3VOXq3"; // Update with actual Professional price ID
        break;
      case "Business":
        trialPeriodDays = 30;
        // You'll need to create this price in Stripe for $25/month
        priceId = "price_1SBQWPLKh5GKHicanc3VOXq3"; // Update with actual Business price ID
        break;
      default:
        trialPeriodDays = 14;
    }

    logStep("Selected plan details", { plan, trialPeriodDays, priceId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({ 
      email: userEmail, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
      
      // Check if they already have an active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        logStep("Customer already has active subscription");
        return new Response(
          JSON.stringify({ 
            error: "You already have an active subscription",
            hasSubscription: true 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Check for trialing subscriptions too
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      
      if (trialingSubscriptions.data.length > 0) {
        logStep("Customer already has trial subscription");
        return new Response(
          JSON.stringify({ 
            error: "You already have an active trial",
            hasTrial: true 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    }

    // Create checkout session with dynamic trial period
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: trialPeriodDays,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'create_invoice' // Will charge automatically after trial
          }
        },
        metadata: {
          email: userEmail,
          trial: 'true',
          plan: plan || 'Professional'
        }
      },
      payment_method_collection: 'always', // Always collect payment method
      success_url: `${req.headers.get("origin")}/auth?trial=started&checkout_email=${encodeURIComponent(userEmail)}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        email: userEmail,
        userId: userId || 'pending',
        trial: 'true',
        plan: plan || 'Professional'
      }
    });

    logStep("Checkout session created", { 
      sessionId: session.id,
      trial: true,
      trialDays: trialPeriodDays,
      plan: plan || 'Professional'
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CREATE-CHECKOUT] Function started");

    // Parse request body for email
    let email: string | undefined;
    try {
      const body = await req.json();
      email = body?.email;
      console.log("[CREATE-CHECKOUT] Request email:", email);
    } catch (e) {
      console.log("[CREATE-CHECKOUT] Failed to parse body:", e);
    }

    if (!email) {
      console.log("[CREATE-CHECKOUT] No email provided");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[CREATE-CHECKOUT] STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer exists
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[CREATE-CHECKOUT] Found existing customer:", customerId);
    }

    // Create checkout session
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price: "price_1SFoOqLKh5GKHicapLodcllu",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/#pricing`,
    });

    console.log("[CREATE-CHECKOUT] Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[CREATE-CHECKOUT] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

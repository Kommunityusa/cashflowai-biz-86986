import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("[CREATE-CHECKOUT] Function started");

    // Parse request body for email
    let requestEmail: string | undefined;
    try {
      const body = await req.json();
      requestEmail = body?.email;
      console.log("[CREATE-CHECKOUT] Request body:", { email: requestEmail });
    } catch (e) {
      console.log("[CREATE-CHECKOUT] Failed to parse body:", e);
    }

    // Only try to get user if there's a proper JWT (not just anon key)
    const authHeader = req.headers.get("Authorization");
    let userEmail: string | undefined;
    
    // Check if we have a real user token (not just anon key)
    if (authHeader && authHeader.startsWith("Bearer ey") && !authHeader.includes("anon")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data, error } = await supabaseClient.auth.getUser(token);
        if (!error && data.user?.email) {
          userEmail = data.user.email;
          console.log("[CREATE-CHECKOUT] Authenticated user:", userEmail);
        }
      } catch (e) {
        console.log("[CREATE-CHECKOUT] Auth check failed:", e);
      }
    }

    // Use email from authenticated user first, then request body
    const email = userEmail || requestEmail;
    console.log("[CREATE-CHECKOUT] Final email to use:", email);

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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer record exists for this email
    let customerId;
    
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log("[CREATE-CHECKOUT] Found existing customer:", customerId);
      } else {
        console.log("[CREATE-CHECKOUT] No existing customer found");
      }
    }

    // Create a subscription checkout session for Pro plan
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email, // Let Stripe collect email if not provided
      line_items: [
        {
          price: "price_1SFoOqLKh5GKHicapLodcllu", // Pro plan $10/month
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard?checkout=success`,
      cancel_url: `${req.headers.get("origin")}/#pricing`,
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
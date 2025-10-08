import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("[CREATE-CHECKOUT] Function invoked - Method:", req.method);
  console.log("[CREATE-CHECKOUT] Headers:", Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("[CREATE-CHECKOUT] Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CREATE-CHECKOUT] Processing POST request");
    const body = await req.json();
    console.log("[CREATE-CHECKOUT] Request body:", JSON.stringify(body));
    
    const { email } = body;
    
    if (!email) {
      console.error("[CREATE-CHECKOUT] ERROR: No email provided");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CREATE-CHECKOUT] Email received:", email);
    console.log("[CREATE-CHECKOUT] Initializing Stripe");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[CREATE-CHECKOUT] ERROR: STRIPE_SECRET_KEY not found in environment");
      return new Response(
        JSON.stringify({ error: "Stripe configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });
    console.log("[CREATE-CHECKOUT] Stripe initialized successfully");

    console.log("[CREATE-CHECKOUT] Checking for existing customer");
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;
    console.log("[CREATE-CHECKOUT] Customer lookup result:", customerId ? `Found: ${customerId}` : "New customer");

    const origin = req.headers.get("origin") || "https://a90fd7c7-fc96-477a-a4ff-dcdac4fd96d9.lovableproject.com";
    console.log("[CREATE-CHECKOUT] Origin URL:", origin);
    
    const successUrl = `${origin}/setup-account?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}`;
    const cancelUrl = `${origin}/#pricing`;
    
    console.log("[CREATE-CHECKOUT] Creating Stripe checkout session");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: "price_1SFoOqLKh5GKHicapLodcllu", quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log("[CREATE-CHECKOUT] SUCCESS: Session created:", session.id);
    console.log("[CREATE-CHECKOUT] Checkout URL:", session.url);
    
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CREATE-CHECKOUT] FATAL ERROR:", error);
    console.error("[CREATE-CHECKOUT] Error details:", error instanceof Error ? error.stack : "Unknown error");
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Check edge function logs for more information"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

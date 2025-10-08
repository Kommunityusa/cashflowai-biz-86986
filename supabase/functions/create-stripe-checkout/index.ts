import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('[STRIPE-CHECKOUT] Creating checkout session for user:', user.id);

    // Get or create Stripe customer
    let customerId;
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      // Create Stripe customer
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: user.email!,
          'metadata[user_id]': user.id,
        }),
      });

      const customer = await customerResponse.json();
      
      if (!customerResponse.ok) {
        console.error('[STRIPE-CHECKOUT] Customer creation error:', customer);
        throw new Error(customer.error?.message || 'Failed to create customer');
      }
      
      customerId = customer.id;

      // Save customer ID
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Create checkout session
    const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        'line_items[0][price]': 'price_1SFpYLLKh5GKHica9aMgQV6E', // $10/month Cash Flow AI Pro
        'line_items[0][quantity]': '1',
        mode: 'subscription',
        success_url: `${req.headers.get('origin')}/dashboard?stripe_success=true`,
        cancel_url: `${req.headers.get('origin')}/checkout?canceled=true`,
        'metadata[user_id]': user.id,
      }),
    });

    const session = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      console.error('[STRIPE-CHECKOUT] Error:', session);
      throw new Error(session.error?.message || 'Failed to create checkout session');
    }

    console.log('[STRIPE-CHECKOUT] Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[STRIPE-CHECKOUT] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

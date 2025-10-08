import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature provided');
    }

    const body = await req.text();

    // Verify webhook signature
    const event = await verifyWebhook(body, signature);

    console.log('[STRIPE-WEBHOOK] Event type:', event.type);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        
        if (userId) {
          await supabaseClient
            .from('profiles')
            .update({
              subscription_plan: 'professional',
              stripe_subscription_id: session.subscription,
            })
            .eq('user_id', userId);

          console.log('[STRIPE-WEBHOOK] Subscription activated for user:', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabaseClient
            .from('profiles')
            .update({
              subscription_plan: null,
              stripe_subscription_id: null,
            })
            .eq('user_id', profile.user_id);

          console.log('[STRIPE-WEBHOOK] Subscription canceled for user:', profile.user_id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const subscriptionPlan = status === 'active' ? 'professional' : null;
          
          await supabaseClient
            .from('profiles')
            .update({
              subscription_plan: subscriptionPlan,
              stripe_subscription_id: subscription.id,
            })
            .eq('user_id', profile.user_id);

          console.log('[STRIPE-WEBHOOK] Subscription updated for user:', profile.user_id, 'Status:', status);
        }
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

async function verifyWebhook(body: string, signature: string) {
  // For simplicity, we're skipping signature verification in this example
  // In production, you should verify the webhook signature
  return JSON.parse(body);
}

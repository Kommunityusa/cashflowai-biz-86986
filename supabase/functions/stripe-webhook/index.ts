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

async function verifyWebhook(body: string, signature: string): Promise<any> {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[STRIPE-WEBHOOK] STRIPE_WEBHOOK_SECRET not configured');
    throw new Error('Webhook secret not configured');
  }

  // Verify the webhook signature using Stripe's method
  const encoder = new TextEncoder();
  const payloadData = encoder.encode(body);
  
  // Parse the signature header
  const signatureParts = signature.split(',');
  const timestamp = signatureParts.find(part => part.startsWith('t='))?.split('=')[1];
  const signatures = signatureParts.filter(part => part.startsWith('v1=')).map(part => part.split('=')[1]);
  
  if (!timestamp || signatures.length === 0) {
    throw new Error('Invalid signature format');
  }
  
  // Create the signed payload
  const signedPayload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(STRIPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expectedSignature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );
  
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Verify at least one signature matches
  const signatureValid = signatures.some(sig => sig === expectedHex);
  
  if (!signatureValid) {
    throw new Error('Invalid signature');
  }
  
  // Check timestamp to prevent replay attacks (5 minute tolerance)
  const eventTime = parseInt(timestamp) * 1000;
  const now = Date.now();
  if (now - eventTime > 5 * 60 * 1000) {
    throw new Error('Timestamp too old');
  }
  
  return JSON.parse(body);
}

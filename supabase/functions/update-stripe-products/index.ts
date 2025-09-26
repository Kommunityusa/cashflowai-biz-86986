import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[UPDATE-STRIPE-PRODUCTS] Starting product name update');
    
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2025-08-27.basil",
    });

    // Update the two products found
    const updates = [
      {
        id: 'prod_T7fsdgIBj6teMr',
        oldName: 'BizFlow Pro - 15 Day Trial',
        newName: 'Cash Flow AI Pro - 15 Day Trial',
        description: 'Full access to all Cash Flow AI features with 15-day free trial. Credit card required. Auto-charges after trial ends.'
      },
      {
        id: 'prod_T6YOhVZ5tPppqr',
        oldName: 'BizFlow Pro',
        newName: 'Cash Flow AI Pro',
        description: 'Full access to all Cash Flow AI features including AI insights, unlimited transactions, and premium support'
      }
    ];

    const results = [];
    
    for (const update of updates) {
      try {
        console.log(`[UPDATE-STRIPE-PRODUCTS] Updating product ${update.id} from "${update.oldName}" to "${update.newName}"`);
        
        const product = await stripe.products.update(update.id, {
          name: update.newName,
          description: update.description
        });
        
        console.log(`[UPDATE-STRIPE-PRODUCTS] Successfully updated product ${update.id}`);
        results.push({
          id: product.id,
          name: product.name,
          status: 'success'
        });
      } catch (error: any) {
        console.error(`[UPDATE-STRIPE-PRODUCTS] Failed to update product ${update.id}:`, error);
        results.push({
          id: update.id,
          name: update.oldName,
          status: 'failed',
          error: error?.message || 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Product update completed',
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('[UPDATE-STRIPE-PRODUCTS] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
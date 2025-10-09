import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === 'amaury@kommunity.app');
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all Plaid transactions for this user
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .not('plaid_transaction_id', 'is', null);

    if (txError) throw txError;

    console.log(`[FIX-TYPES] Found ${transactions?.length || 0} Plaid transactions`);

    const fixes: any[] = [];
    const analysis: any[] = [];

    for (const tx of transactions || []) {
      try {
        const plaidCategory = typeof tx.plaid_category === 'string' 
          ? JSON.parse(tx.plaid_category) 
          : tx.plaid_category;

        const primary = plaidCategory?.primary || '';
        const detailed = plaidCategory?.detailed || '';
        
        // Determine what the type SHOULD be based on Plaid's categorization
        let correctType: 'income' | 'expense' = 'expense';
        
        // INCOME indicators from Plaid
        if (primary === 'INCOME' || 
            primary === 'TRANSFER_IN' ||
            detailed.includes('INCOME') ||
            detailed.includes('TRANSFER_IN') ||
            detailed.includes('DEPOSIT')) {
          correctType = 'income';
        }
        
        // EXPENSE indicators from Plaid
        if (primary === 'TRANSFER_OUT' ||
            primary === 'GENERAL_SERVICES' ||
            primary === 'FOOD_AND_DRINK' ||
            primary === 'TRAVEL' ||
            primary === 'RENT_AND_UTILITIES' ||
            detailed.includes('TRANSFER_OUT') ||
            detailed.includes('PAYMENT')) {
          correctType = 'expense';
        }

        analysis.push({
          id: tx.id,
          description: tx.description,
          amount: tx.amount,
          current_type: tx.type,
          plaid_primary: primary,
          plaid_detailed: detailed,
          should_be: correctType,
          needs_fix: tx.type !== correctType
        });

        // If type is incorrect, fix it
        if (tx.type !== correctType) {
          console.log(`[FIX-TYPES] Fixing ${tx.description}: ${tx.type} → ${correctType}`);
          
          const { error: updateError } = await supabase
            .from('transactions')
            .update({ 
              type: correctType,
              category_id: null, // Clear category so it can be re-categorized
              needs_review: true
            })
            .eq('id', tx.id);

          if (updateError) {
            console.error(`[FIX-TYPES] Error updating ${tx.id}:`, updateError);
          } else {
            fixes.push({
              id: tx.id,
              description: tx.description,
              from: tx.type,
              to: correctType
            });
          }
        }
      } catch (e) {
        console.error(`[FIX-TYPES] Error processing transaction ${tx.id}:`, e);
      }
    }

    console.log(`[FIX-TYPES] Fixed ${fixes.length} transactions`);

    return new Response(
      JSON.stringify({ 
        success: true,
        total_transactions: transactions?.length || 0,
        fixes_made: fixes.length,
        fixes,
        analysis: analysis.filter(a => a.needs_fix),
        message: `Analyzed ${transactions?.length || 0} transactions. Fixed ${fixes.length} misclassifications.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[FIX-TYPES] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
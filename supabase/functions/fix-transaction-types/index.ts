import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail } = await req.json().catch(() => ({ userEmail: null }));

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('[FIX-TRANSACTION-TYPES] Starting transaction type fix...');

    // Get user ID if email provided
    let userId = null;
    if (userEmail) {
      const { data: user } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('user_id', (
          await supabaseClient.auth.admin.listUsers()
        ).data.users.find(u => u.email === userEmail)?.id || '')
        .single();
      
      if (user) {
        userId = user.user_id;
        console.log(`[FIX-TRANSACTION-TYPES] Targeting user: ${userEmail} (${userId})`);
      }
    }

    // Get all transactions (filtered by user if specified)
    let query = supabaseClient
      .from('transactions')
      .select('id, description, amount, type, plaid_category, user_id')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw error;
    }

    console.log(`[FIX-TRANSACTION-TYPES] Found ${transactions?.length || 0} transactions to check`);

    let fixed = 0;
    const updates = [];

    for (const txn of transactions || []) {
      const desc = (txn.description || '').toLowerCase();
      const plaidCat = JSON.stringify(txn.plaid_category || {}).toLowerCase();
      
      // Determine correct type based on transaction patterns
      let correctType = null;

      // INCOME INDICATORS (money coming IN to account)
      const incomePatterns = [
        /deposit/i,
        /payroll/i,
        /salary/i,
        /income/i,
        /refund/i,
        /credit/i,
        /cashback/i,
        /reimbursement/i,
        /payment.*received/i,
        /check.*deposit/i,
        /transfer.*in/i,
        /transfer.*from/i,
      ];

      // EXPENSE INDICATORS (money going OUT of account)
      const expensePatterns = [
        /payment/i,
        /purchase/i,
        /withdrawal/i,
        /autopay/i,
        /debit/i,
        /bill.*pay/i,
        /transfer.*to/i,
        /transfer.*between/i,
        /inst.*xfer/i, // Instant transfer OUT
        /epay/i,
      ];

      // Check income patterns
      if (incomePatterns.some(pattern => pattern.test(desc) || pattern.test(plaidCat))) {
        correctType = 'income';
      }
      // Check expense patterns (these override income patterns if both match)
      else if (expensePatterns.some(pattern => pattern.test(desc) || pattern.test(plaidCat))) {
        correctType = 'expense';
      }

      // Special case: If description contains both "credit" and "payment", it's usually an expense
      if (desc.includes('credit') && desc.includes('payment')) {
        correctType = 'expense';
      }

      // Special case: Transfers between own accounts are typically expenses from the source account
      if (desc.includes('transfer between') || desc.includes('transfer to')) {
        correctType = 'expense';
      }

      // If we determined a correct type and it differs from current type, update it
      if (correctType && correctType !== txn.type) {
        updates.push({
          id: txn.id,
          type: correctType,
        });
        fixed++;
        console.log(`[FIX-TRANSACTION-TYPES] Will fix: "${txn.description}" from ${txn.type} to ${correctType}`);
      }
    }

    // Batch update all fixes
    if (updates.length > 0) {
      for (const update of updates) {
        await supabaseClient
          .from('transactions')
          .update({ type: update.type })
          .eq('id', update.id);
      }
    }

    console.log(`[FIX-TRANSACTION-TYPES] Fixed ${fixed} transactions`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: transactions?.length || 0,
        fixed 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[FIX-TRANSACTION-TYPES] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
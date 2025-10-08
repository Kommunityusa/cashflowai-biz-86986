import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
const plaidSecret = Deno.env.get('PLAID_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PLAID_ENV = 'https://production.plaid.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[PLAID-BACKFILL] Starting historical data backfill for all accounts');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get all active bank accounts with Plaid connections
    const { data: accounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('is_active', true)
      .not('plaid_access_token', 'is', null);

    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
    }

    console.log(`[PLAID-BACKFILL] Found ${accounts?.length || 0} accounts to backfill`);

    let totalSynced = 0;
    let totalTransactions = 0;
    let totalErrors = 0;
    const results = [];

    for (const account of accounts || []) {
      try {
        console.log(`[PLAID-BACKFILL] Processing account ${account.id} (${account.bank_name})`);
        
        // Fetch last 12 months of transactions
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);
        
        const transactionsResponse = await fetch(`${PLAID_ENV}/transactions/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: plaidClientId,
            secret: plaidSecret,
            access_token: account.plaid_access_token,
            start_date: startDate.toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
          }),
        });

        const transactionsData = await transactionsResponse.json();
        
        if (transactionsData.error_code) {
          console.error(`[PLAID-BACKFILL] Error for account ${account.id}:`, transactionsData.error_message);
          totalErrors++;
          results.push({
            account_id: account.id,
            bank_name: account.bank_name,
            status: 'error',
            error: transactionsData.error_message
          });
          continue;
        }

        let newTransactions = 0;
        
        // Process transactions
        for (const transaction of transactionsData.transactions || []) {
          // Check if transaction already exists
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('plaid_transaction_id', transaction.transaction_id)
            .maybeSingle();

          if (!existing) {
            const transactionType = transaction.amount > 0 ? 'expense' : 'income';
            
            // Find matching category
            const { data: categories } = await supabase
              .from('categories')
              .select('id')
              .eq('user_id', account.user_id)
              .eq('type', transactionType)
              .ilike('name', `%${transaction.category?.[0] || 'Other'}%`)
              .limit(1);

            await supabase.from('transactions').insert({
              user_id: account.user_id,
              bank_account_id: account.id,
              plaid_transaction_id: transaction.transaction_id,
              description: transaction.name,
              vendor_name: transaction.merchant_name,
              amount: Math.abs(transaction.amount),
              type: transactionType,
              transaction_date: transaction.date,
              plaid_category: transaction.category,
              category_id: categories?.[0]?.id || null,
              status: 'completed',
              needs_review: true,
            });
            
            newTransactions++;
          }
        }

        // Update account sync timestamp
        await supabase
          .from('bank_accounts')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', account.id);

        totalSynced++;
        totalTransactions += newTransactions;
        
        results.push({
          account_id: account.id,
          bank_name: account.bank_name,
          status: 'success',
          new_transactions: newTransactions,
          total_fetched: transactionsData.transactions?.length || 0
        });
        
        console.log(`[PLAID-BACKFILL] Account ${account.id}: ${newTransactions} new transactions imported`);
        
      } catch (error) {
        console.error(`[PLAID-BACKFILL] Error processing account ${account.id}:`, error);
        totalErrors++;
        results.push({
          account_id: account.id,
          bank_name: account.bank_name,
          status: 'error',
          error: error.message
        });
      }
    }

    const summary = {
      total_accounts: accounts?.length || 0,
      successful: totalSynced,
      errors: totalErrors,
      total_new_transactions: totalTransactions,
    };

    console.log('[PLAID-BACKFILL] Backfill complete:', summary);

    // Log to audit
    await supabase.from('audit_logs').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      action: 'plaid_historical_backfill',
      entity_type: 'system',
      details: { summary, results }
    });

    return new Response(
      JSON.stringify({ success: true, summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('[PLAID-BACKFILL] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

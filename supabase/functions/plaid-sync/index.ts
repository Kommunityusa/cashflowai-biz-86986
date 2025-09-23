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

// Using Production environment
const PLAID_ENV = 'https://production.plaid.com';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[PLAID-SYNC] Starting scheduled sync');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get all active bank accounts that need syncing
    const { data: accounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('is_active', true)
      .not('plaid_access_token', 'is', null)
      .or(`last_synced_at.is.null,last_synced_at.lt.${new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()}`); // Sync if not synced in last 6 hours

    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
    }

    console.log(`[PLAID-SYNC] Found ${accounts?.length || 0} accounts to sync`);

    let totalSynced = 0;
    let totalErrors = 0;

    for (const account of accounts || []) {
      try {
        console.log(`[PLAID-SYNC] Syncing account ${account.id} for user ${account.user_id}`);
        
        // Get updated account balance
        const balanceResponse = await fetch(`${PLAID_ENV}/accounts/balance/get`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: plaidClientId,
            secret: plaidSecret,
            access_token: account.plaid_access_token,
          }),
        });

        const balanceData = await balanceResponse.json();
        
        if (balanceData.error_code) {
          console.error(`[PLAID-SYNC] Balance error for account ${account.id}:`, balanceData);
          
          // Mark account as having an error
          await supabase
            .from('bank_accounts')
            .update({
              is_active: false,
              notes: `Sync error: ${balanceData.error_message}`,
            })
            .eq('id', account.id);
          
          totalErrors++;
          continue;
        }

        // Update balance
        const plaidAccount = balanceData.accounts.find((a: any) => 
          a.account_id === account.plaid_account_id
        );
        
        if (plaidAccount) {
          await supabase
            .from('bank_accounts')
            .update({
              current_balance: plaidAccount.balances.current,
              last_synced_at: new Date().toISOString(),
            })
            .eq('id', account.id);
        }

        // Sync recent transactions
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Get last 7 days of transactions
        
        const transactionsResponse = await fetch(`${PLAID_ENV}/transactions/get`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: plaidClientId,
            secret: plaidSecret,
            access_token: account.plaid_access_token,
            start_date: startDate.toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
          }),
        });

        const transactionsData = await transactionsResponse.json();
        
        if (!transactionsData.error_code) {
          // Process new transactions
          for (const transaction of transactionsData.transactions || []) {
            // Check if transaction already exists
            const { data: existing } = await supabase
              .from('transactions')
              .select('id')
              .eq('plaid_transaction_id', transaction.transaction_id)
              .maybeSingle();

            if (!existing) {
              // Find matching category
              const { data: categories } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', account.user_id)
                .eq('type', transaction.amount > 0 ? 'expense' : 'income')
                .ilike('name', `%${transaction.category?.[0] || 'Other'}%`)
                .limit(1);

              await supabase.from('transactions').insert({
                user_id: account.user_id,
                bank_account_id: account.id,
                plaid_transaction_id: transaction.transaction_id,
                description: transaction.name,
                vendor_name: transaction.merchant_name,
                amount: Math.abs(transaction.amount),
                type: transaction.amount > 0 ? 'expense' : 'income',
                transaction_date: transaction.date,
                plaid_category: transaction.category,
                category_id: categories?.[0]?.id || null,
                status: 'completed',
              });
            }
          }
        }

        totalSynced++;
        console.log(`[PLAID-SYNC] Successfully synced account ${account.id}`);
        
      } catch (error) {
        console.error(`[PLAID-SYNC] Error syncing account ${account.id}:`, error);
        totalErrors++;
      }
    }

    // Log sync results
    console.log(`[PLAID-SYNC] Sync completed. Synced: ${totalSynced}, Errors: ${totalErrors}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        accountsSynced: totalSynced,
        errors: totalErrors,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[PLAID-SYNC] Error in scheduled sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
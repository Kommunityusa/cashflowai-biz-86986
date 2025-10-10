import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'production';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!PLAID_CLIENT_ID || !PLAID_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const PLAID_API_URL = PLAID_ENV === 'production' 
      ? 'https://production.plaid.com' 
      : PLAID_ENV === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com';

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle empty body
    let dateRange = 730; // Default to 2 years
    try {
      const body = await req.json();
      dateRange = body.dateRange || 730;
    } catch {
      // Empty body, use default
    }
    const daysBack = dateRange;

    console.log('[Plaid Backfill] Starting historical transaction backfill for user:', user.id);

    // Get all active bank accounts with Plaid connections
    const { data: accounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('id, account_name, bank_name, plaid_item_id, plaid_account_id')
      .eq('user_id', user.id)
      .not('plaid_item_id', 'is', null)
      .not('plaid_account_id', 'is', null);

    if (accountsError || !accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'No active bank accounts found',
          transactions_imported: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Plaid Backfill] Found', accounts.length, 'accounts to backfill');

    let totalImported = 0;
    const errors = [];

    // Calculate date range based on user selection
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('[Plaid Backfill] Date range:', startDateStr, 'to', endDateStr, `(${daysBack} days)`);

    // Get user categories for auto-categorization
    const { data: userCategories } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', user.id);

    for (const account of accounts) {
      try {
        console.log('[Plaid Backfill] Processing account:', account.account_name);

        // Get access token (encrypted or plain)
        const { data: tokenData, error: tokenError } = await supabase
          .from('plaid_access_tokens')
          .select('access_token, access_token_encrypted')
          .eq('item_id', account.plaid_item_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (tokenError || (!tokenData?.access_token && !tokenData?.access_token_encrypted)) {
          console.error('[Plaid Backfill] No access token found for account:', account.id);
          errors.push({
            account_id: account.id,
            account_name: account.account_name,
            error: 'Access token not found - please reconnect your bank account'
          });
          continue;
        }

        // Decrypt token if encrypted
        let accessToken = tokenData.access_token;
        if (!accessToken && tokenData.access_token_encrypted) {
          const { data: decryptedData, error: decryptError } = await supabase.functions.invoke('token-storage', {
            body: {
              action: 'decrypt_access_token',
              data: { item_id: account.plaid_item_id }
            }
          });

          if (decryptError || !decryptedData?.access_token) {
            console.error('[Plaid Backfill] Failed to decrypt token for account:', account.id);
            errors.push({
              account_id: account.id,
              account_name: account.account_name,
              error: 'Failed to decrypt access token'
            });
            continue;
          }

          accessToken = decryptedData.access_token;
        }

        // Fetch historical transactions using /transactions/get
        let offset = 0;
        let hasMore = true;
        let accountTransactions = 0;
        const newTransactions: any[] = [];

        while (hasMore) {
          const response = await fetch(`${PLAID_API_URL}/transactions/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: PLAID_CLIENT_ID,
              secret: PLAID_SECRET,
              access_token: accessToken,
              start_date: startDateStr,
              end_date: endDateStr,
              options: {
                count: 500,
                offset: offset,
                include_personal_finance_category: true,
                account_ids: [account.plaid_account_id], // Filter by specific account
              }
            })
          });

          const data = await response.json();

          if (data.error_code) {
            console.error('[Plaid Backfill] Plaid API error:', data);
            errors.push({
              account_id: account.id,
              account_name: account.account_name,
              error: data.error_message
            });
            break;
          }

          const transactions = data.transactions || [];
          console.log('[Plaid Backfill] Fetched', transactions.length, 'transactions for', account.account_name, '(offset:', offset, ')');

          if (transactions.length > 0) {
            // All transactions are already for this account due to account_ids filter
            const accountTxns = transactions;

            if (accountTxns.length > 0) {
              // Check for existing transactions to avoid duplicates
              const plaidIds = accountTxns.map((t: any) => t.transaction_id);
              const { data: existingTxns } = await supabase
                .from('transactions')
                .select('plaid_transaction_id')
                .in('plaid_transaction_id', plaidIds);
              
              const existingIds = new Set(existingTxns?.map(t => t.plaid_transaction_id) || []);
              
              // Filter out transactions that already exist
              const newTxns = accountTxns.filter((t: any) => !existingIds.has(t.transaction_id));
              
              console.log('[Plaid Backfill] Found', newTxns.length, 'new transactions out of', accountTxns.length, 'total');
              
              if (newTxns.length > 0) {
                // Transform and insert only new transactions
                const txnsToInsert = newTxns.map((transaction: any) => {
                  const txType = transaction.amount > 0 ? 'expense' : 'income';

                  return {
                    user_id: user.id,
                    bank_account_id: account.id,
                    plaid_transaction_id: transaction.transaction_id,
                    description: transaction.name || transaction.merchant_name || 'Unknown',
                    vendor_name: transaction.merchant_name,
                    amount: Math.abs(transaction.amount),
                    type: txType,
                    transaction_date: transaction.date,
                    plaid_category: transaction.personal_finance_category || transaction.category,
                    category_id: null, // Will be set by AI
                    status: 'completed',
                    notes: transaction.payment_channel ? `Payment via ${transaction.payment_channel}` : null,
                  };
                });

                // Insert in batches
                const BATCH_SIZE = 100;
                for (let i = 0; i < txnsToInsert.length; i += BATCH_SIZE) {
                  const batch = txnsToInsert.slice(i, i + BATCH_SIZE);
                  const { data: inserted, error: insertError } = await supabase
                    .from('transactions')
                    .insert(batch)
                    .select();

                  if (insertError) {
                    console.error('[Plaid Backfill] Insert error:', insertError);
                    throw insertError;
                  }
                  
                  // Track new transactions for AI categorization
                  if (inserted) {
                    for (const tx of inserted) {
                      newTransactions.push({
                        id: tx.id,
                        description: tx.description,
                        vendor_name: tx.vendor_name,
                        amount: tx.amount,
                        transaction_date: tx.transaction_date,
                      });
                    }
                  }
                }

                accountTransactions += txnsToInsert.length;
                totalImported += txnsToInsert.length;
              }
            }
          }

          // Check if there are more transactions
          hasMore = transactions.length === 500;
          offset += 500;

          // Safety limit to prevent infinite loops
          if (offset > 10000) {
            console.warn('[Plaid Backfill] Reached offset limit for account:', account.account_name);
            break;
          }
        }
        
        // Auto-categorize new transactions with AI
        if (newTransactions.length > 0) {
          try {
            await supabase.functions.invoke('ai-categorize-transactions', {
              body: { transactions: newTransactions }
            });
            console.log(`[Plaid Backfill] Auto-categorized ${newTransactions.length} transactions for ${account.account_name}`);
          } catch (aiError) {
            console.error('[Plaid Backfill] AI categorization failed:', aiError);
          }
        }

        console.log('[Plaid Backfill] Imported', accountTransactions, 'transactions for', account.account_name);

      } catch (error) {
        console.error('[Plaid Backfill] Error processing account:', account.account_name, error);
        errors.push({
          account_id: account.id,
          account_name: account.account_name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('[Plaid Backfill] Backfill complete. Total imported:', totalImported);

    return new Response(
      JSON.stringify({
        success: true,
        transactions_imported: totalImported,
        accounts_processed: accounts.length,
        errors: errors.length > 0 ? errors : undefined,
        date_range: { start: startDateStr, end: endDateStr }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Plaid Backfill] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

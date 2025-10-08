import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
const plaidSecret = Deno.env.get('PLAID_SECRET');
const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PLAID_ENV = plaidEnv === 'production' 
  ? 'https://production.plaid.com' 
  : plaidEnv === 'development'
  ? 'https://development.plaid.com'
  : 'https://sandbox.plaid.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[PLAID-BACKFILL] ============ SYNC START ============');
    console.log('[PLAID-BACKFILL] Using Plaid environment:', plaidEnv, '→', PLAID_ENV);
    
    // Validate Plaid credentials
    if (!plaidClientId || !plaidSecret) {
      console.error('[PLAID-BACKFILL] Missing Plaid credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Plaid credentials not configured',
          details: 'PLAID_CLIENT_ID or PLAID_SECRET is missing'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[PLAID-BACKFILL] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Authenticate user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[PLAID-BACKFILL] Authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid user authentication',
          details: userError?.message || 'User not found'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PLAID-BACKFILL] Authenticated user:', user.id);

    // Get active Plaid-connected bank accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('plaid_item_id', 'is', null);

    if (accountsError) {
      console.error('[PLAID-BACKFILL] Failed to fetch accounts:', accountsError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch bank accounts',
          details: accountsError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PLAID-BACKFILL] Found ${accounts?.length || 0} Plaid accounts`);
    
    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No Plaid-connected bank accounts found',
          summary: {
            total_accounts: 0,
            successful: 0,
            errors: 0,
            total_new_transactions: 0,
            user_id: user.id
          },
          results: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let totalSuccessful = 0;
    let totalNewTransactions = 0;
    let totalErrors = 0;
    const results = [];

    // Group accounts by item_id to avoid duplicate API calls
    const itemMap = new Map();
    for (const account of accounts) {
      if (!itemMap.has(account.plaid_item_id)) {
        itemMap.set(account.plaid_item_id, {
          access_token: account.plaid_access_token,
          access_token_encrypted: account.plaid_access_token_encrypted,
          accounts: []
        });
      }
      itemMap.get(account.plaid_item_id).accounts.push(account);
    }

    console.log(`[PLAID-BACKFILL] Processing ${itemMap.size} unique Plaid items`);

    // Process each Plaid item
    for (const [itemId, itemData] of itemMap) {
      try {
        console.log(`[PLAID-BACKFILL] ---- Processing item ${itemId} ----`);
        
        // Get access token (decrypt if needed)
        let accessToken = itemData.access_token;
        
        if (!accessToken && itemData.access_token_encrypted) {
          console.log('[PLAID-BACKFILL] Decrypting access token...');
          const decryptResponse = await supabase.functions.invoke('token-storage', {
            body: {
              action: 'decrypt_access_token',
              data: { item_id: itemId }
            }
          });
          
          if (decryptResponse.error || !decryptResponse.data?.access_token) {
            throw new Error(`Failed to decrypt token: ${decryptResponse.error?.message || 'Unknown error'}`);
          }
          
          accessToken = decryptResponse.data.access_token;
          console.log('[PLAID-BACKFILL] Token decrypted successfully');
        }
        
        if (!accessToken) {
          throw new Error('No access token available');
        }

        // Calculate date range: last 12 full months (365 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 365);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log(`[PLAID-BACKFILL] Date range: ${startDateStr} to ${endDateStr} (365 days)`);

        // Fetch all transactions with pagination
        let allTransactions = [];
        let offset = 0;
        const countPerRequest = 500; // Maximum allowed by Plaid
        let hasMore = true;
        
        while (hasMore) {
          console.log(`[PLAID-BACKFILL] Fetching batch: offset=${offset}, count=${countPerRequest}`);
          
          const response = await fetch(`${PLAID_ENV}/transactions/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: plaidClientId,
              secret: plaidSecret,
              access_token: accessToken,
              start_date: startDateStr,
              end_date: endDateStr,
              options: {
                count: countPerRequest,
                offset: offset,
                include_personal_finance_category: true,
              },
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[PLAID-BACKFILL] HTTP error:', response.status, errorText);
            throw new Error(`Plaid API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          
          if (data.error_code) {
            console.error('[PLAID-BACKFILL] Plaid error:', data.error_code, data.error_message);
            throw new Error(`${data.error_code}: ${data.error_message}`);
          }

          const batchTransactions = data.transactions || [];
          allTransactions = allTransactions.concat(batchTransactions);
          
          console.log(`[PLAID-BACKFILL] Fetched ${batchTransactions.length} transactions (total: ${allTransactions.length}/${data.total_transactions})`);
          
          // Check if there are more transactions
          offset += countPerRequest;
          hasMore = offset < data.total_transactions;
        }

        console.log(`[PLAID-BACKFILL] Total transactions fetched: ${allTransactions.length}`);

        // Process transactions for each account
        for (const account of itemData.accounts) {
          let accountNewTransactions = 0;
          
          // Filter transactions for this specific account
          const accountTransactions = allTransactions.filter(
            t => t.account_id === account.plaid_account_id
          );
          
          console.log(`[PLAID-BACKFILL] Processing ${accountTransactions.length} transactions for account ${account.account_name}`);

          for (const transaction of accountTransactions) {
            try {
              // Check if transaction exists
              const { data: existing } = await supabase
                .from('transactions')
                .select('id')
                .eq('plaid_transaction_id', transaction.transaction_id)
                .maybeSingle();

              if (existing) {
                continue; // Skip existing transactions
              }

              // Determine transaction type
              // Plaid convention: positive = expense (money out), negative = income (money in)
              const transactionType = transaction.amount > 0 ? 'expense' : 'income';
              const absoluteAmount = Math.abs(transaction.amount);

              // Try to find matching category
              const categoryName = transaction.personal_finance_category?.detailed || 
                                   transaction.category?.[0] || 
                                   'Other';
              
              const { data: categories } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', user.id)
                .eq('type', transactionType)
                .ilike('name', `%${categoryName}%`)
                .limit(1);

              // Extract payment channel info
              let notes = `Payment via ${transaction.payment_channel || 'unknown'}`;
              if (transaction.merchant_name) {
                notes = `${transaction.merchant_name}; ${notes}`;
              }

              // Insert transaction
              const { error: insertError } = await supabase.from('transactions').insert({
                user_id: user.id,
                bank_account_id: account.id,
                plaid_transaction_id: transaction.transaction_id,
                description: transaction.name,
                vendor_name: transaction.merchant_name || null,
                amount: absoluteAmount,
                type: transactionType,
                transaction_date: transaction.date,
                plaid_category: {
                  primary: transaction.personal_finance_category?.primary || transaction.category?.[0],
                  detailed: transaction.personal_finance_category?.detailed || transaction.category?.[1],
                  confidence_level: transaction.personal_finance_category?.confidence_level || 'LOW'
                },
                category_id: categories?.[0]?.id || null,
                status: 'completed',
                notes: notes,
                needs_review: false,
              });

              if (insertError) {
                console.error('[PLAID-BACKFILL] Failed to insert transaction:', insertError.message);
              } else {
                accountNewTransactions++;
              }
            } catch (txError) {
              console.error('[PLAID-BACKFILL] Error processing transaction:', txError);
            }
          }

          // Update account sync timestamp
          await supabase
            .from('bank_accounts')
            .update({ last_synced_at: new Date().toISOString() })
            .eq('id', account.id);

          totalNewTransactions += accountNewTransactions;
          totalSuccessful++;
          
          results.push({
            account_id: account.id,
            account_name: account.account_name,
            bank_name: account.bank_name,
            status: 'success',
            new_transactions: accountNewTransactions,
            total_available: accountTransactions.length
          });
          
          console.log(`[PLAID-BACKFILL] Account ${account.account_name}: ${accountNewTransactions} new transactions imported`);
        }
        
      } catch (itemError) {
        console.error(`[PLAID-BACKFILL] Error processing item ${itemId}:`, itemError);
        totalErrors++;
        
        // Mark all accounts in this item as errored
        for (const account of itemData.accounts) {
          results.push({
            account_id: account.id,
            account_name: account.account_name,
            bank_name: account.bank_name,
            status: 'error',
            error: itemError instanceof Error ? itemError.message : 'Unknown error'
          });
        }
      }
    }

    const summary = {
      total_accounts: accounts.length,
      successful: totalSuccessful,
      errors: totalErrors,
      total_new_transactions: totalNewTransactions,
      user_id: user.id,
      date_range: '365 days (12 full months)'
    };

    console.log('[PLAID-BACKFILL] ============ SYNC COMPLETE ============');
    console.log('[PLAID-BACKFILL] Summary:', JSON.stringify(summary, null, 2));

    // Log to audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'plaid_sync_transactions',
      entity_type: 'bank_accounts',
      details: { summary, results }
    });

    return new Response(
      JSON.stringify({ success: true, summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('[PLAID-BACKFILL] ============ FATAL ERROR ============');
    console.error('[PLAID-BACKFILL] Error:', error);
    console.error('[PLAID-BACKFILL] Stack:', error instanceof Error ? error.stack : 'N/A');
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

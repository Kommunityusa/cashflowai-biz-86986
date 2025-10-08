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
    console.log('[PLAID-BACKFILL] Starting historical data backfill');
    console.log('[PLAID-BACKFILL] Using Plaid environment:', PLAID_ENV);
    
    // Validate required environment variables
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
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[PLAID-BACKFILL] No authorization header provided');
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
      console.error('[PLAID-BACKFILL] User authentication failed:', userError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid user authentication',
          details: userError?.message || 'User not found'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PLAID-BACKFILL] User ${user.id} starting backfill`);

    // Get active bank accounts for THIS USER with Plaid connections
    const { data: accounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('plaid_item_id', 'is', null);

    if (accountsError) {
      console.error('[PLAID-BACKFILL] Failed to fetch accounts:', accountsError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch bank accounts',
          details: accountsError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PLAID-BACKFILL] Found ${accounts?.length || 0} accounts to backfill`);
    
    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No active bank accounts found to backfill',
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

    let totalSynced = 0;
    let totalTransactions = 0;
    let totalErrors = 0;
    const results = [];

    for (const account of accounts || []) {
      try {
        console.log(`[PLAID-BACKFILL] Processing account ${account.id} (${account.bank_name})`);
        
        // Decrypt access token
        let accessToken = account.plaid_access_token;
        
        if (!accessToken && account.plaid_access_token_encrypted) {
          console.log(`[PLAID-BACKFILL] Decrypting access token for item ${account.plaid_item_id}`);
          const decryptResponse = await supabase.functions.invoke('token-storage', {
            body: {
              action: 'decrypt_access_token',
              data: { item_id: account.plaid_item_id }
            }
          });
          
          if (decryptResponse.error || !decryptResponse.data?.access_token) {
            console.error(`[PLAID-BACKFILL] Failed to decrypt token for account ${account.id}:`, decryptResponse.error);
            throw new Error(`Failed to decrypt access token: ${decryptResponse.error?.message || 'Unknown error'}`);
          }
          
          accessToken = decryptResponse.data.access_token;
          console.log(`[PLAID-BACKFILL] Successfully decrypted access token`);
        }
        
        if (!accessToken) {
          console.error(`[PLAID-BACKFILL] No access token available for account ${account.id}`);
          throw new Error('No access token available');
        }
        
        // Fetch last 12 FULL months of transactions (365 days to ensure complete coverage)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 365); // 365 days = 12 full months
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = new Date().toISOString().split('T')[0];
        
        console.log(`[PLAID-BACKFILL] Fetching transactions from ${startDateStr} to ${endDateStr} (12 months)`);
        
        let allTransactions = [];
        let offset = 0;
        const count = 500; // Maximum allowed by Plaid per request
        let totalAvailable = 0;
        let totalFetched = 0;
        
        // Paginate through all transactions
        do {
          console.log(`[PLAID-BACKFILL] Fetching transactions offset=${offset}, count=${count}`);
          
          const transactionsResponse = await fetch(`${PLAID_ENV}/transactions/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: plaidClientId,
              secret: plaidSecret,
              access_token: accessToken,
              start_date: startDateStr,
              end_date: endDateStr,
              options: {
                count: count,
                offset: offset,
              },
            }),
          });

          if (!transactionsResponse.ok) {
            const errorText = await transactionsResponse.text();
            console.error(`[PLAID-BACKFILL] HTTP error for account ${account.id}:`, transactionsResponse.status, errorText);
            totalErrors++;
            results.push({
              account_id: account.id,
              bank_name: account.bank_name,
              status: 'error',
              error: `HTTP ${transactionsResponse.status}: ${errorText}`
            });
            break;
          }

          const transactionsData = await transactionsResponse.json();
          
          if (transactionsData.error_code) {
            console.error(`[PLAID-BACKFILL] Plaid error for account ${account.id}:`, {
              error_code: transactionsData.error_code,
              error_message: transactionsData.error_message,
              error_type: transactionsData.error_type,
              request_id: transactionsData.request_id
            });
            totalErrors++;
            results.push({
              account_id: account.id,
              bank_name: account.bank_name,
              status: 'error',
              error: `${transactionsData.error_code}: ${transactionsData.error_message}`,
              error_code: transactionsData.error_code,
              request_id: transactionsData.request_id
            });
            break;
          }

          // Accumulate transactions
          if (transactionsData.transactions) {
            allTransactions = allTransactions.concat(transactionsData.transactions);
            totalFetched += transactionsData.transactions.length;
          }
          
          totalAvailable = transactionsData.total_transactions || 0;
          offset += count;
          
          console.log(`[PLAID-BACKFILL] Fetched ${transactionsData.transactions?.length || 0} transactions, total: ${allTransactions.length}/${totalAvailable}`);
          
          // Continue if there are more transactions to fetch
        } while (offset < totalAvailable);

        // If there was an error, skip processing
        if (results.some(r => r.account_id === account.id && r.status === 'error')) {
          continue;
        }

        let newTransactions = 0;
        
        // Process all fetched transactions
        for (const transaction of allTransactions) {
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
          total_fetched: totalFetched
        });
        
        console.log(`[PLAID-BACKFILL] Account ${account.id}: ${newTransactions} new transactions imported`);
        
      } catch (error) {
        console.error(`[PLAID-BACKFILL] Error processing account ${account.id}:`, error);
        totalErrors++;
        results.push({
          account_id: account.id,
          bank_name: account.bank_name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          error_stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    const summary = {
      total_accounts: accounts?.length || 0,
      successful: totalSynced,
      errors: totalErrors,
      total_new_transactions: totalTransactions,
      user_id: user.id,
    };

    console.log('[PLAID-BACKFILL] Backfill complete:', summary);

    // Log to audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'plaid_historical_backfill',
      entity_type: 'bank_accounts',
      details: { summary, results }
    });

    return new Response(
      JSON.stringify({ success: true, summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('[PLAID-BACKFILL] Fatal error:', error);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== PLAID-BACKFILL REQUEST RECEIVED ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
    const plaidSecret = Deno.env.get('PLAID_SECRET');
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('[BACKFILL] Environment check:', {
      hasPlaidClientId: !!plaidClientId,
      hasPlaidSecret: !!plaidSecret,
      plaidEnv,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!plaidClientId || !plaidSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error('[BACKFILL] Missing required environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error',
          details: 'Missing required environment variables'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PLAID_API_URL = plaidEnv === 'production' 
      ? 'https://production.plaid.com' 
      : plaidEnv === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com';

    console.log('[BACKFILL] Plaid API URL:', PLAID_API_URL);
    
    // Get authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[BACKFILL] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[BACKFILL] Authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          details: userError?.message
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[BACKFILL] Authenticated user:', user.id);

    // Get Plaid-connected bank accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('plaid_item_id', 'is', null);

    if (accountsError) {
      console.error('[BACKFILL] Database error:', accountsError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Database error',
          details: accountsError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[BACKFILL] Found ${accounts?.length || 0} accounts`);
    
    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No Plaid accounts found',
          summary: {
            total_accounts: 0,
            successful: 0,
            errors: 0,
            total_new_transactions: 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date range (365 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`[BACKFILL] Date range: ${startDateStr} to ${endDateStr}`);

    let totalNew = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    const results = [];

    // Process each account
    for (const account of accounts) {
      try {
        console.log(`[BACKFILL] Processing ${account.account_name}`);
        
        let accessToken = account.plaid_access_token;
        
        // Handle encrypted tokens
        if (!accessToken && account.plaid_access_token_encrypted) {
          console.log('[BACKFILL] Decrypting token...');
          const { data: decryptData, error: decryptError } = await supabase.functions.invoke('token-storage', {
            body: { action: 'decrypt_access_token', data: { item_id: account.plaid_item_id } }
          });
          
          if (decryptError || !decryptData?.access_token) {
            throw new Error('Failed to decrypt token');
          }
          accessToken = decryptData.access_token;
        }
        
        if (!accessToken) {
          throw new Error('No access token');
        }

        // Fetch transactions from Plaid
        console.log('[BACKFILL] Calling Plaid API...');
        const response = await fetch(`${PLAID_API_URL}/transactions/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: plaidClientId,
            secret: plaidSecret,
            access_token: accessToken,
            start_date: startDateStr,
            end_date: endDateStr,
            options: { count: 500, offset: 0 }
          }),
        });

        if (!response.ok) {
          throw new Error(`Plaid API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error_code) {
          throw new Error(`${data.error_code}: ${data.error_message}`);
        }

        console.log(`[BACKFILL] Received ${data.transactions?.length || 0} transactions`);

        let newCount = 0;
        
        // Import transactions
        for (const txn of data.transactions || []) {
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('plaid_transaction_id', txn.transaction_id)
            .maybeSingle();

          if (!existing) {
            const type = txn.amount > 0 ? 'expense' : 'income';
            
            await supabase.from('transactions').insert({
              user_id: user.id,
              bank_account_id: account.id,
              plaid_transaction_id: txn.transaction_id,
              description: txn.name,
              vendor_name: txn.merchant_name || null,
              amount: Math.abs(txn.amount),
              type: type,
              transaction_date: txn.date,
              status: 'completed',
              notes: `Payment via ${txn.payment_channel || 'unknown'}`,
            });
            
            newCount++;
          }
        }

        // Update sync timestamp
        await supabase
          .from('bank_accounts')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', account.id);

        totalNew += newCount;
        totalSuccess++;
        
        results.push({
          account_id: account.id,
          account_name: account.account_name,
          status: 'success',
          new_transactions: newCount
        });
        
        console.log(`[BACKFILL] ${account.account_name}: ${newCount} new transactions`);
        
      } catch (error) {
        console.error(`[BACKFILL] Error for ${account.account_name}:`, error);
        totalErrors++;
        results.push({
          account_id: account.id,
          account_name: account.account_name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const summary = {
      total_accounts: accounts.length,
      successful: totalSuccess,
      errors: totalErrors,
      total_new_transactions: totalNew
    };

    console.log('[BACKFILL] Complete:', summary);

    // Log to audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'plaid_sync_transactions',
      entity_type: 'bank_accounts',
      details: { summary, results }
    });

    return new Response(
      JSON.stringify({ success: true, summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[BACKFILL] FATAL ERROR:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

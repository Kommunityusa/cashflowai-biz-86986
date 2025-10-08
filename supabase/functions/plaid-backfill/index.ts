import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== PLAID-BACKFILL START ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight - returning');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('\n[Step 1] Checking environment variables...');
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
    const plaidSecret = Deno.env.get('PLAID_SECRET');
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasPlaidClientId: !!plaidClientId,
      hasPlaidSecret: !!plaidSecret,
      plaidEnv,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!plaidClientId || !plaidSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const PLAID_API_URL = plaidEnv === 'production' 
      ? 'https://production.plaid.com' 
      : plaidEnv === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com';

    console.log('Plaid URL:', PLAID_API_URL);
    
    console.log('\n[Step 2] Checking authorization...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    console.log('Auth header present');
    
    console.log('\n[Step 3] Initializing Supabase...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    console.log('Supabase client created');

    console.log('\n[Step 4] Authenticating user...');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    if (!user) {
      throw new Error('No user found');
    }

    console.log('User authenticated:', user.id);

    console.log('\n[Step 5] Fetching bank accounts...');
    const { data: accounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('id, account_name, plaid_item_id, plaid_access_token, plaid_access_token_encrypted')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('plaid_item_id', 'is', null);

    if (accountsError) {
      console.error('DB error:', accountsError);
      throw new Error(`Database error: ${accountsError.message}`);
    }

    console.log(`Found ${accounts?.length || 0} accounts`);
    
    if (!accounts || accounts.length === 0) {
      console.log('No accounts to sync');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No Plaid accounts found',
          transactionsSynced: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('\n[Step 6] Setting up date range...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`Date range: ${startDateStr} to ${endDateStr}`);

    let totalNew = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    console.log('\n[Step 7] Processing accounts...');
    for (const account of accounts) {
      try {
        console.log(`\n--- Account: ${account.account_name} ---`);
        
        let accessToken = account.plaid_access_token;
        
        if (!accessToken) {
          console.log('No plain access token, checking encrypted...');
          if (!account.plaid_access_token_encrypted) {
            throw new Error('No access token available');
          }
          // For now, skip encrypted tokens to avoid nested function calls
          console.log('Encrypted token found, skipping for now');
          totalErrors++;
          continue;
        }

        console.log('Calling Plaid API...');
        const plaidResp = await fetch(`${PLAID_API_URL}/transactions/get`, {
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

        if (!plaidResp.ok) {
          throw new Error(`Plaid HTTP ${plaidResp.status}`);
        }

        const plaidData = await plaidResp.json();
        
        if (plaidData.error_code) {
          throw new Error(`${plaidData.error_code}: ${plaidData.error_message}`);
        }

        const txnCount = plaidData.transactions?.length || 0;
        console.log(`Received ${txnCount} transactions`);

        let newCount = 0;
        
        for (const txn of plaidData.transactions || []) {
          try {
            const { data: existing } = await supabase
              .from('transactions')
              .select('id')
              .eq('plaid_transaction_id', txn.transaction_id)
              .maybeSingle();

            if (existing) continue;

            const type = txn.amount > 0 ? 'expense' : 'income';
            
            const { error: insertError } = await supabase.from('transactions').insert({
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

            if (insertError) {
              console.error(`Insert error for ${txn.transaction_id}:`, insertError.message);
            } else {
              newCount++;
            }
          } catch (txnError: any) {
            console.error(`Transaction error:`, txnError.message);
          }
        }

        await supabase
          .from('bank_accounts')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', account.id);

        totalNew += newCount;
        totalSuccess++;
        
        console.log(`✓ ${account.account_name}: ${newCount} new transactions`);
        
      } catch (accountError: any) {
        console.error(`✗ ${account.account_name}: ${accountError.message}`);
        totalErrors++;
      }
    }

    const summary = {
      totalAccounts: accounts.length,
      successful: totalSuccess,
      errors: totalErrors,
      transactionsSynced: totalNew
    };

    console.log('\n=== COMPLETE ===');
    console.log('Summary:', summary);

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'plaid_backfill',
      entity_type: 'bank_accounts',
      details: summary
    });

    return new Response(
      JSON.stringify({ success: true, ...summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('\n=== FATAL ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Sync failed',
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

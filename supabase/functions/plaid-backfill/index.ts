import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
};

serve(async (req) => {
  console.log('Function called:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Returning CORS headers');
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Immediate response test
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'alive', method: 'GET' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  console.log('POST request started');

  try {
    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Env check:', {
      hasPlaid: !!PLAID_CLIENT_ID,
      hasSecret: !!PLAID_SECRET,
      env: PLAID_ENV,
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_KEY
    });

    if (!PLAID_CLIENT_ID || !PLAID_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing credentials' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const PLAID_API = PLAID_ENV === 'production' 
      ? 'https://production.plaid.com' 
      : PLAID_ENV === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No auth header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('Creating Supabase client');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log('Getting user');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Auth failed', details: authError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log('User:', user.id);

    console.log('Fetching accounts');
    const { data: accounts, error: accError } = await supabase
      .from('bank_accounts')
      .select('id, account_name, plaid_item_id, plaid_access_token')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('plaid_item_id', 'is', null)
      .not('plaid_access_token', 'is', null);

    if (accError) {
      console.error('DB error:', accError);
      return new Response(
        JSON.stringify({ error: 'DB error', details: accError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Accounts:', accounts?.length || 0);

    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No Plaid accounts found',
          transactionsSynced: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 365);
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    console.log('Date range:', startDate, 'to', endDate);

    let total = 0;

    for (const acc of accounts) {
      try {
        console.log('Account:', acc.account_name);
        
        const plaidResp = await fetch(`${PLAID_API}/transactions/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: PLAID_CLIENT_ID,
            secret: PLAID_SECRET,
            access_token: acc.plaid_access_token,
            start_date: startDate,
            end_date: endDate,
            options: { count: 500 }
          }),
        });

        if (!plaidResp.ok) {
          console.error('Plaid error:', plaidResp.status);
          continue;
        }

        const plaidData = await plaidResp.json();
        
        if (plaidData.error_code) {
          console.error('Plaid error:', plaidData.error_message);
          continue;
        }

        console.log('Transactions:', plaidData.transactions?.length || 0);

        let added = 0;
        for (const txn of plaidData.transactions || []) {
          const { data: exists } = await supabase
            .from('transactions')
            .select('id')
            .eq('plaid_transaction_id', txn.transaction_id)
            .maybeSingle();

          if (!exists) {
            const { error: insertError } = await supabase.from('transactions').insert({
              user_id: user.id,
              bank_account_id: acc.id,
              plaid_transaction_id: txn.transaction_id,
              description: txn.name,
              vendor_name: txn.merchant_name || null,
              amount: Math.abs(txn.amount),
              type: txn.amount > 0 ? 'expense' : 'income',
              transaction_date: txn.date,
              status: 'completed',
            });

            if (!insertError) added++;
          }
        }

        await supabase
          .from('bank_accounts')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', acc.id);

        total += added;
        console.log('Added:', added);
      } catch (err: any) {
        console.error('Account error:', err.message);
      }
    }

    console.log('Complete:', total);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionsSynced: total,
        accountsProcessed: accounts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('FATAL:', error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

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
    console.log('START: plaid-backfill');
    
    // Get credentials
    const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
    const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
    const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      throw new Error('Missing Plaid credentials');
    }

    const PLAID_API = PLAID_ENV === 'production' 
      ? 'https://production.plaid.com' 
      : PLAID_ENV === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com';

    console.log('Plaid env:', PLAID_ENV);
    
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No auth');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) throw new Error('Auth failed');
    console.log('User:', user.id);

    // Get accounts
    const { data: accounts, error: accError } = await supabase
      .from('bank_accounts')
      .select('id, account_name, plaid_item_id, plaid_access_token')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('plaid_item_id', 'is', null)
      .not('plaid_access_token', 'is', null);

    if (accError) throw accError;
    if (!accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No accounts', transactionsSynced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Accounts:', accounts.length);

    // Date range
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 365);
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    console.log('Range:', startDate, 'to', endDate);

    let total = 0;
    let errors = 0;

    for (const acc of accounts) {
      try {
        console.log('Processing:', acc.account_name);
        
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

        if (!plaidResp.ok) throw new Error(`Plaid ${plaidResp.status}`);
        const plaidData = await plaidResp.json();
        
        if (plaidData.error_code) throw new Error(plaidData.error_message);

        console.log('Txns:', plaidData.transactions?.length || 0);

        let added = 0;
        for (const txn of plaidData.transactions || []) {
          const { data: exists } = await supabase
            .from('transactions')
            .select('id')
            .eq('plaid_transaction_id', txn.transaction_id)
            .maybeSingle();

          if (!exists) {
            await supabase.from('transactions').insert({
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
            added++;
          }
        }

        await supabase
          .from('bank_accounts')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', acc.id);

        total += added;
        console.log('Added:', added, 'for', acc.account_name);
      } catch (err: any) {
        console.error('Account error:', err.message);
        errors++;
      }
    }

    console.log('COMPLETE:', total, 'transactions');

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionsSynced: total,
        accountsProcessed: accounts.length - errors,
        errors 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('FATAL:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

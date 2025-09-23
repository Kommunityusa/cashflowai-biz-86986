import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
const plaidSecret = Deno.env.get('PLAID_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Using Production environment
const PLAID_ENV = 'https://production.plaid.com';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user');
    }

    console.log(`Plaid action: ${action}`);

    // Check if Plaid credentials are configured
    if (!plaidClientId || !plaidSecret) {
      console.error('Plaid credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Plaid integration is not configured. Please add PLAID_CLIENT_ID and PLAID_SECRET to your Supabase Edge Function secrets.' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    switch (action) {
      case 'create_link_token': {
        console.log('Creating link token for user:', user.id);
        
        // Get the webhook URL for this environment
        const webhookUrl = `${supabaseUrl}/functions/v1/plaid-webhook`;
        console.log('Webhook URL:', webhookUrl);
        
        // Determine redirect URI for OAuth
        const origin = req.headers.get('origin') || 'https://nbrcdphgadabjndynyvy.supabase.co';
        const redirectUri = `${origin}/auth/callback`;
        console.log('OAuth Redirect URI:', redirectUri);
        
        // Create a link token for Plaid Link initialization
        const requestBody: any = {
          client_id: plaidClientId,
          secret: plaidSecret,
          user: {
            client_user_id: user.id,
          },
          client_name: 'BizFlow',
          products: ['transactions', 'accounts'],
          country_codes: ['US'],
          language: 'en',
          webhook: webhookUrl, // Register webhook URL
          redirect_uri: redirectUri, // OAuth redirect URI
          transactions: {
            days_requested: 730, // Request 2 years of transaction history
          },
        };
        
        // Add optional parameters for update mode
        const { mode, accessToken } = params || {};
        if (mode === 'update' && accessToken) {
          requestBody.access_token = accessToken;
        }
        
        const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';
        const PLAID_ENV = plaidEnv === 'production' ? 'https://production.plaid.com' : 
                          plaidEnv === 'development' ? 'https://development.plaid.com' : 
                          'https://sandbox.plaid.com';
        
        const response = await fetch(`${PLAID_ENV}/link/token/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        
        if (data.error_code) {
          console.error('Plaid error:', data);
          throw new Error(data.error_message || 'Failed to create link token');
        }

        console.log('Link token created successfully');
        return new Response(
          JSON.stringify({ 
            link_token: data.link_token,
            redirect_uri: redirectUri,
            environment: PLAID_ENV.includes('sandbox') ? 'sandbox' : 'production'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'exchange_public_token': {
        // Exchange public token for access token
        const { public_token, metadata } = params;
        
        const response = await fetch(`${PLAID_ENV}/item/public_token/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: plaidClientId,
            secret: plaidSecret,
            public_token: public_token,
          }),
        });

        const data = await response.json();
        
        if (data.error_code) {
          console.error('Plaid error:', data);
          throw new Error(data.error_message || 'Failed to exchange token');
        }

        // Get account details
        const accountsResponse = await fetch(`${PLAID_ENV}/accounts/get`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: plaidClientId,
            secret: plaidSecret,
            access_token: data.access_token,
          }),
        });

        const accountsData = await accountsResponse.json();
        
        if (accountsData.error_code) {
          console.error('Plaid accounts error:', accountsData);
          throw new Error(accountsData.error_message || 'Failed to get accounts');
        }

        // Save accounts to database
        for (const account of accountsData.accounts) {
          await supabase.from('bank_accounts').upsert({
            user_id: user.id,
            plaid_access_token: data.access_token,
            plaid_item_id: data.item_id,
            plaid_account_id: account.account_id,
            account_name: account.name,
            bank_name: metadata?.institution?.name || 'Unknown Bank',
            account_type: account.subtype || account.type,
            account_number_last4: account.mask,
            current_balance: account.balances.current,
            is_active: true,
            last_synced_at: new Date().toISOString(),
          });
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            accounts: accountsData.accounts.length 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_transactions': {
        // Sync transactions for all connected accounts
        const { data: accounts } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('user_id', user.id)
          .not('plaid_access_token', 'is', null);

        let totalSynced = 0;

        for (const account of accounts || []) {
          // Get transactions from last 30 days
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          
          const response = await fetch(`${PLAID_ENV}/transactions/get`, {
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

          const data = await response.json();
          
          if (data.error_code) {
            console.error(`Plaid sync error for account ${account.id}:`, data);
            continue;
          }

          // Update account balance
          await supabase
            .from('bank_accounts')
            .update({
              current_balance: data.accounts.find((a: any) => 
                a.account_id === account.plaid_account_id
              )?.balances.current || account.current_balance,
              last_synced_at: new Date().toISOString(),
            })
            .eq('id', account.id);

          // Save transactions
          for (const transaction of data.transactions) {
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
                .eq('user_id', user.id)
                .eq('type', transaction.amount > 0 ? 'expense' : 'income')
                .ilike('name', `%${transaction.category?.[0] || 'Other'}%`)
                .limit(1);

              await supabase.from('transactions').insert({
                user_id: user.id,
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
              
              totalSynced++;
            }
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            transactions_synced: totalSynced 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'remove_connection': {
        // Remove a bank connection
        const { account_id } = params;
        
        const { data: account } = await supabase
          .from('bank_accounts')
          .select('plaid_access_token')
          .eq('id', account_id)
          .eq('user_id', user.id)
          .single();

        if (account?.plaid_access_token) {
          // Remove from Plaid
          await fetch(`${PLAID_ENV}/item/remove`, {
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
        }

        // Mark as inactive in database
        await supabase
          .from('bank_accounts')
          .update({ is_active: false })
          .eq('id', account_id)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in plaid function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
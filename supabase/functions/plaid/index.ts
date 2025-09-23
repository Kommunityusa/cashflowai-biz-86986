// Main Plaid Integration Edge Function
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

// Get Plaid environment from env variable - defaults to production for live credentials
const plaidEnv = Deno.env.get('PLAID_ENV') || 'production';
const PLAID_ENV = plaidEnv === 'sandbox' ? 'https://sandbox.plaid.com' : 
                  plaidEnv === 'development' ? 'https://development.plaid.com' : 
                  'https://production.plaid.com';

console.log('[Plaid Function] Initialized with environment:', plaidEnv, 'URL:', PLAID_ENV);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Plaid Function] Received request:', req.method, req.url);
    
    const { action, ...params } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    console.log('[Plaid Function] Action:', action);
    
    if (!authHeader) {
      console.error('[Plaid Function] No authorization header provided');
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
      console.error('[Plaid Function] User authentication failed:', userError);
      throw new Error('Invalid user');
    }

    console.log(`[Plaid Function] Authenticated user: ${user.id}, action: ${action}`);

    // Check if Plaid credentials are configured
    if (!plaidClientId || !plaidSecret) {
      console.error('[Plaid Function] Missing Plaid credentials');
      console.error('PLAID_CLIENT_ID exists:', !!plaidClientId);
      console.error('PLAID_SECRET exists:', !!plaidSecret);
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
        console.log('[Plaid Function] Creating link token for user:', user.id);
        
        // Get the webhook URL for this environment
        const webhookUrl = `${supabaseUrl}/functions/v1/plaid-webhook`;
        console.log('[Plaid Function] Webhook URL:', webhookUrl);
        
        // Get custom options from request if provided
        const linkOptions = params?.options || {};
        console.log('[Plaid Function] Link options:', JSON.stringify(linkOptions));
        
        // Create a link token for Plaid Link initialization
        // Transactions product is required for small business bookkeeping
        const requestBody: any = {
          client_id: plaidClientId,
          secret: plaidSecret,
          user: {
            client_user_id: user.id,
          },
          client_name: 'Cash Flow AI',
          products: ['transactions'],
          country_codes: ['US'],
          language: 'en',
          webhook: webhookUrl,
        };
        
        // Only add redirect_uri for OAuth-enabled institutions
        // This is not required for most banks and causes errors if not configured in Plaid dashboard
        let oauthRedirectUri = null;
        if (params?.use_oauth) {
          const origin = req.headers.get('origin') || 'https://nbrcdphgadabjndynyvy.supabase.co';
          oauthRedirectUri = `${origin}/plaid/oauth/callback`;
          console.log('[Plaid Function] OAuth Redirect URI:', oauthRedirectUri);
          requestBody.redirect_uri = oauthRedirectUri;
        }
        
        // Add optional parameters for update mode
        const { mode, accessToken } = params || {};
        if (mode === 'update' && accessToken) {
          console.log('[Plaid Function] Update mode with existing access token');
          requestBody.access_token = accessToken;
        }
        
        console.log('[Plaid Function] Request body (without secrets):', {
          ...requestBody,
          client_id: 'REDACTED',
          secret: 'REDACTED',
        });
        
        const plaidUrl = `${PLAID_ENV}/link/token/create`;
        console.log('[Plaid Function] Calling Plaid API:', plaidUrl);
        
        const response = await fetch(plaidUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        console.log('[Plaid Function] Plaid API response status:', response.status);
        
        if (data.error_code) {
          console.error('[Plaid Function] Plaid API error:', {
            error_code: data.error_code,
            error_message: data.error_message,
            error_type: data.error_type,
            request_id: data.request_id,
            user_id: user.id,
            environment: plaidEnv,
            timestamp: new Date().toISOString(),
          });
          
          // Provide user-friendly error messages based on error code
          let userMessage = data.error_message || 'Failed to create link token';
          
          if (data.error_code === 'INVALID_FIELD') {
            userMessage = 'Bank connection configuration error. Please contact support.';
          } else if (data.error_code === 'INVALID_API_KEYS') {
            userMessage = 'Bank connection service is not properly configured. Please contact support.';
          } else if (data.error_code === 'INVALID_PRODUCT') {
            userMessage = 'The requested banking features are not available. Please contact support.';
          }
          
          // Return more detailed error information
          return new Response(
            JSON.stringify({ 
              error: userMessage,
              error_code: data.error_code,
              error_type: data.error_type,
              request_id: data.request_id,
              environment: plaidEnv,
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Log successful link token creation
        console.log('[Plaid Function] Link token created successfully:', {
          request_id: data.request_id,
          expiration: data.expiration,
          user_id: user.id,
          environment: plaidEnv,
          timestamp: new Date().toISOString(),
        });
        
        const responseData: any = { 
          link_token: data.link_token,
          request_id: data.request_id,
          environment: plaidEnv,
          expiration: data.expiration,
        };
        
        // Only include redirect_uri if OAuth was used
        if (oauthRedirectUri) {
          responseData.redirect_uri = oauthRedirectUri;
        }
        
        return new Response(
          JSON.stringify(responseData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'exchange_public_token': {
        // Exchange public token for access token
        const { public_token, metadata } = params;
        
        console.log('[Plaid] Starting token exchange:', {
          user_id: user.id,
          institution: metadata?.institution?.name,
          link_session_id: metadata?.link_session_id,
          timestamp: new Date().toISOString(),
        });
        
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
          console.error('[Plaid Error] Token exchange failed:', {
            error_code: data.error_code,
            error_message: data.error_message,
            error_type: data.error_type,
            request_id: data.request_id,
            user_id: user.id,
            institution: metadata?.institution?.name,
            link_session_id: metadata?.link_session_id,
            timestamp: new Date().toISOString(),
          });
          throw new Error(data.error_message || 'Failed to exchange token');
        }
        
        const accessToken = data.access_token;
        const itemId = data.item_id;
        
        // Log successful token exchange
        console.log('[Plaid Success] Token exchanged:', {
          request_id: data.request_id,
          item_id: itemId,
          user_id: user.id,
          institution: metadata?.institution?.name,
          accounts_count: metadata?.accounts?.length,
          link_session_id: metadata?.link_session_id,
          timestamp: new Date().toISOString(),
        });

        // Get account details
        console.log('[Plaid] Fetching account details for item:', itemId);
        
        const accountsResponse = await fetch(`${PLAID_ENV}/accounts/get`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: plaidClientId,
            secret: plaidSecret,
            access_token: accessToken,
          }),
        });

        const accountsData = await accountsResponse.json();
        
        if (accountsData.error_code) {
          console.error('[Plaid Error] Failed to fetch accounts:', {
            error_code: accountsData.error_code,
            error_message: accountsData.error_message,
            request_id: accountsData.request_id,
            item_id: itemId,
            user_id: user.id,
            timestamp: new Date().toISOString(),
          });
          throw new Error(accountsData.error_message || 'Failed to get accounts');
        }
        
        // Log successful account fetch
        const accountIds = accountsData.accounts?.map((a: any) => a.account_id);
        console.log('[Plaid Success] Accounts fetched:', {
          request_id: accountsData.request_id,
          item_id: itemId,
          accounts_count: accountsData.accounts?.length,
          account_ids: accountIds,
          user_id: user.id,
          timestamp: new Date().toISOString(),
        });

        // Save accounts to database
        console.log('[Plaid] Saving accounts to database:', {
          item_id: itemId,
          accounts_count: accountsData.accounts?.length,
          user_id: user.id,
        });
        for (const account of accountsData.accounts) {
          const { error } = await supabase.from('bank_accounts').upsert({
            user_id: user.id,
            plaid_access_token: null, // Never store plaintext in production
            plaid_item_id: itemId,
            plaid_account_id: account.account_id,
            account_name: account.name,
            bank_name: metadata?.institution?.name || 'Unknown Bank',
            account_type: account.subtype || account.type,
            account_number_last4: account.mask,
            current_balance: account.balances.current,
            is_active: true,
            encryption_enabled: true, // Mark for encryption
            last_synced_at: new Date().toISOString(),
          });
          
          if (error) {
            console.error('[Plaid Error] Failed to save account:', {
              account_id: account.account_id,
              error: error.message,
              user_id: user.id,
            });
          } else {
            console.log('[Plaid Success] Account saved:', {
              account_id: account.account_id,
              account_name: account.name,
              item_id: itemId,
            });
          }
        }
        
        // Return the access token for frontend to encrypt
        // This ensures token is encrypted before storage

        return new Response(
          JSON.stringify({ 
            success: true, 
            accounts: accountsData.accounts.length,
            item_id: itemId,
            access_token: accessToken, // Frontend will encrypt this
            request_id: accountsData.request_id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_transactions': {
        console.log('[Plaid Function] Starting transaction sync for user:', user.id);
        
        // Sync transactions for all connected accounts
        const { data: accounts } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('user_id', user.id)
          .not('plaid_access_token', 'is', null);

        let totalSynced = 0;
        let syncErrors = [];

        for (const account of accounts || []) {
          try {
            console.log('[Plaid Function] Syncing transactions for account:', {
              account_id: account.id,
              bank_name: account.bank_name,
              last_synced: account.last_synced_at,
            });
            
            // Get transactions from last 90 days for better bookkeeping coverage
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 90);
            
            // Use Plaid's transactions/sync endpoint for better performance and incremental updates
            // First try the new sync endpoint, fallback to get if not available
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
                options: {
                  count: 500, // Get more transactions for comprehensive bookkeeping
                  include_personal_finance_category: true, // Better categorization
                }
              }),
            });

            const data = await response.json();
            
            if (data.error_code) {
              console.error(`[Plaid Function] Sync error for account ${account.id}:`, {
                error_code: data.error_code,
                error_message: data.error_message,
                request_id: data.request_id,
              });
              syncErrors.push({
                account_id: account.id,
                bank_name: account.bank_name,
                error: data.error_message,
              });
              continue;
            }
            
            console.log('[Plaid Function] Retrieved transactions:', {
              account_id: account.id,
              transaction_count: data.transactions?.length || 0,
              total_transactions: data.total_transactions,
            });

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
          } catch (error) {
            console.error('[Plaid Function] Error syncing account:', {
              account_id: account.id,
              error: error.message,
            });
            syncErrors.push({
              account_id: account.id,
              bank_name: account.bank_name,
              error: error.message || 'Unknown error',
            });
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            transactions_synced: totalSynced,
            errors: syncErrors.length > 0 ? syncErrors : undefined
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
      
      case 'remove_item': {
        // Remove a Plaid Item and clean up associated data
        const { item_id, account_id } = params;
        
        console.log('[Plaid] Removing item:', {
          item_id,
          account_id,
          user_id: user.id,
          timestamp: new Date().toISOString(),
        });
        
        // Get the access token for this item
        const { data: bankAccount } = await supabase
          .from('bank_accounts')
          .select('plaid_access_token, plaid_item_id')
          .eq('id', account_id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!bankAccount || !bankAccount.plaid_access_token) {
          return new Response(
            JSON.stringify({ error: 'Bank account not found or not connected to Plaid' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Call Plaid's /item/remove endpoint
        const removeResponse = await fetch(`${PLAID_ENV}/item/remove`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: plaidClientId,
            secret: plaidSecret,
            access_token: bankAccount.plaid_access_token,
          }),
        });
        
        const removeData = await removeResponse.json();
        
        if (removeData.error_code) {
          console.error('[Plaid Error] Failed to remove item:', {
            error_code: removeData.error_code,
            error_message: removeData.error_message,
            request_id: removeData.request_id,
            item_id,
            user_id: user.id,
            timestamp: new Date().toISOString(),
          });
        } else {
          console.log('[Plaid Success] Item removed:', {
            request_id: removeData.request_id,
            item_id,
            user_id: user.id,
            timestamp: new Date().toISOString(),
          });
        }
        
        // Clean up database - soft delete the bank account
        await supabase
          .from('bank_accounts')
          .update({
            is_active: false,
            plaid_access_token: null,
            plaid_access_token_encrypted: null,
            plaid_item_id: null,
            notes: 'Account disconnected by user',
            updated_at: new Date().toISOString(),
          })
          .eq('id', account_id);
        
        // Archive associated transactions (don't delete for audit trail)
        await supabase
          .from('transactions')
          .update({
            status: 'archived',
            notes: 'Bank account disconnected',
          })
          .eq('bank_account_id', account_id);
        
        // Log the removal in audit logs
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'PLAID_ITEM_REMOVED' as any,
          entity_type: 'bank_account',
          entity_id: account_id,
          details: {
            item_id,
            request_id: removeData.request_id,
            removed_at: new Date().toISOString(),
          } as any,
        });
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Bank account disconnected successfully',
            request_id: removeData.request_id,
          }),
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
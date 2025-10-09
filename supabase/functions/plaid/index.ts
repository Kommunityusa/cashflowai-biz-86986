// Main Plaid Integration Edge Function
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { getErrorMessage } from '../_shared/error-handler.ts';

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
          const origin = req.headers.get('origin') || 'https://cashflowai.biz';
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

        // Store the access token in the new plaid_access_tokens table
        const { error: tokenError } = await supabase
          .from('plaid_access_tokens')
          .upsert({
            user_id: user.id,
            item_id: itemId,
            access_token: accessToken,
            access_token_encrypted: null, // Will be encrypted later by token-storage function
          }, {
            onConflict: 'item_id'
          });
          
        if (tokenError) {
          console.error('[Plaid Function] Failed to store access token:', tokenError);
        } else {
          console.log('[Plaid Function] Access token stored successfully for item:', itemId);
        }

        // Save accounts to database
        console.log('[Plaid] Saving accounts to database:', {
          item_id: itemId,
          accounts_count: accountsData.accounts?.length,
          user_id: user.id,
        });
        
        let newAccountsCount = 0;
        let duplicatesCount = 0;
        const accountResults = [];
        for (const account of accountsData.accounts) {
          // Check if this exact account already exists for this user
          const { data: existingAccount } = await supabase
            .from('bank_accounts')
            .select('id, account_name, is_active')
            .eq('user_id', user.id)
            .eq('plaid_account_id', account.account_id)
            .maybeSingle();
            
          if (existingAccount) {
            duplicatesCount++;
            accountResults.push({
              account_id: account.account_id,
              account_name: account.name,
              status: 'duplicate'
            });
            
            console.log('[Plaid] Account already exists, skipping:', {
              account_id: account.account_id,
              account_name: account.name,
              existing_id: existingAccount.id,
            });
            
            // Reactivate if it was deactivated
            if (!existingAccount.is_active) {
              await supabase
                .from('bank_accounts')
                .update({ 
                  is_active: true,
                  last_synced_at: new Date().toISOString(),
                })
                .eq('id', existingAccount.id);
            }
            continue;
          }
          
          // Insert new account
          const { error } = await supabase.from('bank_accounts').insert({
            user_id: user.id,
            plaid_access_token_encrypted: null, // Will be encrypted separately
            plaid_item_id: itemId,
            plaid_account_id: account.account_id,
            account_name: account.name,
            institution_name: metadata?.institution?.name || 'Unknown Bank',
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
              error: error.message,
              account_id: account.account_id,
              user_id: user.id,
            });
          } else {
            newAccountsCount++;
            accountResults.push({
              account_id: account.account_id,
              account_name: account.name,
              bank_name: metadata?.institution?.name,
              status: 'added'
            });
            console.log('[Plaid Success] Account saved:', {
              account_id: account.account_id,
              account_name: account.name,
              bank_name: metadata?.institution?.name,
            });
          }
        }
        
        // Return account connection results
        const message = duplicatesCount > 0 
          ? `Connected ${newAccountsCount} new account(s). ${duplicatesCount} account(s) were already connected.`
          : `Connected ${newAccountsCount} account(s) successfully`;

        return new Response(
          JSON.stringify({ 
            success: true, 
            accounts: newAccountsCount,
            duplicates: duplicatesCount,
            item_id: itemId,
            access_token: accessToken, // Frontend will encrypt this
            request_id: accountsData.request_id,
            message: message,
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
          .eq('is_active', true);

        if (!accounts || accounts.length === 0) {
          return new Response(
            JSON.stringify({ 
              success: false,
              message: 'No active bank accounts found',
              transactions_synced: 0
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let totalSynced = 0;
        let totalModified = 0;
        let totalRemoved = 0;
        let syncErrors = [];

        for (const account of accounts || []) {
          try {
            console.log('[Plaid Function] Processing account:', {
              account_id: account.id,
              bank_name: account.bank_name,
              plaid_item_id: account.plaid_item_id,
            });
            
            // Get the access token and cursor from the plaid_access_tokens table
            const { data: tokenData, error: tokenFetchError } = await supabase
              .from('plaid_access_tokens')
              .select('access_token, access_token_encrypted, cursor')
              .eq('item_id', account.plaid_item_id)
              .eq('user_id', user.id)
              .single();
              
            if (tokenFetchError || (!tokenData?.access_token && !tokenData?.access_token_encrypted)) {
              console.error('[Plaid Function] No access token found for item:', account.plaid_item_id);
              syncErrors.push({
                account_id: account.id,
                bank_name: account.bank_name,
                error: 'Access token not found - please reconnect your bank account',
              });
              continue;
            }
            
            // Use encrypted token if available, otherwise use plain token (for backward compatibility)
            let accessToken = tokenData.access_token;
            if (!accessToken && tokenData.access_token_encrypted) {
              // Call token-storage function to decrypt the token
              console.log('[Plaid Function] Decrypting access token for item:', account.plaid_item_id);
              const { data: decryptedData, error: decryptError } = await supabase.functions.invoke('token-storage', {
                body: {
                  action: 'decrypt_access_token',
                  data: {
                    item_id: account.plaid_item_id,
                  },
                },
              });
              
              if (decryptError || !decryptedData?.access_token) {
                console.error('[Plaid Function] Failed to decrypt access token:', decryptError);
                syncErrors.push({
                  account_id: account.id,
                  bank_name: account.bank_name,
                  error: 'Failed to decrypt access token - please reconnect your bank account',
                });
                continue;
              }
              
              accessToken = decryptedData.access_token;
              console.log('[Plaid Function] Successfully decrypted access token');
            }
            let cursor = tokenData.cursor;
            let hasMore = true;
            let accountSynced = 0;
            
            console.log('[Plaid Function] Starting sync with cursor:', cursor || 'initial');
            
            // Use transactions/sync endpoint with cursor-based pagination
            while (hasMore) {
              const syncBody: any = {
                client_id: plaidClientId,
                secret: plaidSecret,
                access_token: accessToken,
              };
              
              // Add cursor if we have one
              if (cursor) {
                syncBody.cursor = cursor;
              }
              
              const response = await fetch(`${PLAID_ENV}/transactions/sync`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(syncBody),
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
                break;
              }
              
              console.log('[Plaid Function] Sync response:', {
                added: data.added?.length || 0,
                modified: data.modified?.length || 0,
                removed: data.removed?.length || 0,
                has_more: data.has_more,
                next_cursor: data.next_cursor,
              });

              // Get all user categories once
              const { data: userCategories } = await supabase
                .from('categories')
                .select('id, name, type')
                .eq('user_id', user.id);

              // Process added transactions
              if (data.added && data.added.length > 0) {
                const newTransactions = data.added.map((transaction: any) => {
                  const txType = transaction.amount > 0 ? 'expense' : 'income';
                  const categoryName = transaction.personal_finance_category?.primary?.toLowerCase() || 
                                       transaction.category?.[0]?.toLowerCase() || 'other';
                  const matchingCategory = userCategories?.find(cat => 
                    cat.type === txType && 
                    cat.name.toLowerCase().includes(categoryName)
                  );
                  
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
                    category_id: matchingCategory?.id || null,
                    status: 'completed',
                    notes: transaction.payment_channel ? `Payment via ${transaction.payment_channel}` : null,
                  };
                });

                // Batch insert new transactions with upsert to handle duplicates
                const CHUNK_SIZE = 100;
                for (let i = 0; i < newTransactions.length; i += CHUNK_SIZE) {
                  const chunk = newTransactions.slice(i, i + CHUNK_SIZE);
                  const { error: insertError } = await supabase
                    .from('transactions')
                    .upsert(chunk, {
                      onConflict: 'plaid_transaction_id',
                      ignoreDuplicates: true
                    });
                  
                  if (insertError) {
                    console.error(`[Plaid Function] Error inserting transactions batch:`, insertError);
                    // Don't throw - log and continue to process other transactions
                  }
                }
                
                accountSynced += newTransactions.length;
                totalSynced += newTransactions.length;
              }

              // Process modified transactions
              if (data.modified && data.modified.length > 0) {
                for (const transaction of data.modified) {
                  const { error: updateError } = await supabase
                    .from('transactions')
                    .update({
                      description: transaction.name || transaction.merchant_name || 'Unknown',
                      vendor_name: transaction.merchant_name,
                      amount: Math.abs(transaction.amount),
                      type: transaction.amount > 0 ? 'expense' : 'income',
                      transaction_date: transaction.date,
                      plaid_category: transaction.personal_finance_category || transaction.category,
                    })
                    .eq('plaid_transaction_id', transaction.transaction_id);
                  
                  if (updateError) {
                    console.error(`[Plaid Function] Error updating transaction:`, updateError);
                  } else {
                    totalModified++;
                  }
                }
              }

              // Process removed transactions
              if (data.removed && data.removed.length > 0) {
                const removedIds = data.removed.map((r: any) => r.transaction_id);
                const { error: deleteError } = await supabase
                  .from('transactions')
                  .delete()
                  .in('plaid_transaction_id', removedIds);
                
                if (deleteError) {
                  console.error(`[Plaid Function] Error deleting transactions:`, deleteError);
                } else {
                  totalRemoved += data.removed.length;
                }
              }

              // Update cursor and check if there's more data
              cursor = data.next_cursor;
              hasMore = data.has_more;

              // Update the cursor in the database after each page
              await supabase
                .from('plaid_access_tokens')
                .update({ cursor: cursor })
                .eq('item_id', account.plaid_item_id)
                .eq('user_id', user.id);
            }

            // Update account balance if we have account data
            if (accountSynced > 0) {
              await supabase
                .from('bank_accounts')
                .update({
                  last_synced_at: new Date().toISOString(),
                })
                .eq('id', account.id);
            }

            console.log(`[Plaid Function] Account ${account.id} sync complete. Added: ${accountSynced}`);
            
          } catch (error) {
            console.error('[Plaid Function] Error syncing account:', {
              account_id: account.id,
              error: getErrorMessage(error),
            });
            syncErrors.push({
              account_id: account.id,
              bank_name: account.bank_name,
              error: getErrorMessage(error),
            });
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            transactions_synced: totalSynced,
            transactions_modified: totalModified,
            transactions_removed: totalRemoved,
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
          .select('plaid_item_id')
          .eq('id', account_id)
          .eq('user_id', user.id)
          .single();

        if (account?.plaid_item_id) {
          // Get access token from plaid_access_tokens table
          const { data: tokenData } = await supabase
            .from('plaid_access_tokens')
            .select('access_token')
            .eq('item_id', account.plaid_item_id)
            .eq('user_id', user.id)
            .single();
            
          if (tokenData?.access_token) {
            // Remove from Plaid
            await fetch(`${PLAID_ENV}/item/remove`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                client_id: plaidClientId,
                secret: plaidSecret,
                access_token: tokenData.access_token,
              }),
            });
          }
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
          .select('plaid_item_id')
          .eq('id', account_id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!bankAccount || !bankAccount.plaid_item_id) {
          return new Response(
            JSON.stringify({ error: 'Bank account not found or not connected to Plaid' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Get access token from plaid_access_tokens table
        const { data: tokenData } = await supabase
          .from('plaid_access_tokens')
          .select('access_token')
          .eq('item_id', bankAccount.plaid_item_id)
          .eq('user_id', user.id)
          .single();
          
        if (!tokenData?.access_token) {
          return new Response(
            JSON.stringify({ error: 'Access token not found' }),
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
            access_token: tokenData.access_token,
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
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
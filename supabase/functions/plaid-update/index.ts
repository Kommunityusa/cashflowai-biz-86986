// Plaid Update Mode Edge Function - Handles credential updates and error recovery
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { getErrorMessage as getErrorFromUnknown } from '../_shared/error-handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { action, accessToken, itemId } = body;

    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
    const plaidSecret = Deno.env.get('PLAID_SECRET');
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';
    const PLAID_ENV = plaidEnv === 'production' ? 'https://production.plaid.com' : 
                      plaidEnv === 'development' ? 'https://development.plaid.com' : 
                      'https://sandbox.plaid.com';

    if (!plaidClientId || !plaidSecret) {
      throw new Error('Plaid credentials not configured');
    }

    console.log('[UPDATE MODE] Action:', action);

    switch (action) {
      case 'create_update_token': {
        // Get the access token for the item
        const { data: bankAccount } = await supabaseClient
          .from('bank_accounts')
          .select('plaid_access_token, bank_name')
          .eq('plaid_item_id', itemId)
          .eq('user_id', user.id)
          .single();

        if (!bankAccount?.plaid_access_token) {
          throw new Error('Bank account not found or no access token');
        }

        // Create link token for update mode
        const response = await fetch(`${PLAID_ENV}/link/token/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: plaidClientId,
            secret: plaidSecret,
            user: {
              client_user_id: user.id,
            },
            client_name: 'BizFlow',
            country_codes: ['US'],
            language: 'en',
            access_token: bankAccount.plaid_access_token,
            update: {
              account_selection_enabled: false, // Don't allow account selection changes
            },
          }),
        });

        const data = await response.json();
        
        if (data.error_code) {
          console.error('[UPDATE MODE] Error creating token:', data);
          throw new Error(data.error_message || 'Failed to create update token');
        }

        // Log audit event
        await supabaseClient.from('audit_logs').insert({
          user_id: user.id,
          action: 'PLAID_UPDATE_MODE_INITIATED',
          entity_type: 'bank_account',
          entity_id: itemId,
          details: {
            bank_name: bankAccount.bank_name,
            reason: body.reason || 'user_initiated'
          }
        });

        return new Response(
          JSON.stringify({ 
            link_token: data.link_token,
            bank_name: bankAccount.bank_name
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check_duplicate': {
        // Check if this institution is already linked
        const { institutionId, institutionName } = body;
        
        const { data: existingAccounts } = await supabaseClient
          .from('bank_accounts')
          .select('id, bank_name, created_at')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .ilike('bank_name', `%${institutionName}%`);

        const isDuplicate = existingAccounts && existingAccounts.length > 0;

        return new Response(
          JSON.stringify({ 
            isDuplicate,
            existingAccounts: existingAccounts || [],
            message: isDuplicate 
              ? `You already have an account linked with ${institutionName}. Are you sure you want to add another?`
              : null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'handle_error': {
        // Handle various Plaid errors
        const { errorCode, errorType, itemId: errorItemId } = body;
        
        console.log('[ERROR HANDLER] Processing error:', errorCode, errorType);

        // Update account status based on error
        if (errorItemId) {
          const updateData: any = {};
          
          switch (errorCode) {
            case 'ITEM_LOGIN_REQUIRED':
              updateData.notes = 'Login required - please update credentials';
              break;
            case 'ITEM_LOCKED':
              updateData.notes = 'Account locked - please unlock at your bank';
              updateData.is_active = false;
              break;
            case 'ITEM_NOT_SUPPORTED':
              updateData.notes = 'Institution no longer supported';
              updateData.is_active = false;
              break;
            case 'PENDING_DISCONNECT':
              updateData.notes = 'Account will be disconnected soon - action required';
              break;
            case 'USER_PERMISSION_REVOKED':
              updateData.notes = 'Bank permission revoked - reconnection required';
              updateData.is_active = false;
              break;
            default:
              updateData.notes = `Error: ${errorCode}`;
          }

          await supabaseClient
            .from('bank_accounts')
            .update(updateData)
            .eq('plaid_item_id', errorItemId)
            .eq('user_id', user.id);

          // Log error event
          await supabaseClient.from('audit_logs').insert({
            user_id: user.id,
            action: 'PLAID_ERROR_HANDLED',
            entity_type: 'bank_account',
            entity_id: errorItemId,
            details: {
              error_code: errorCode,
              error_type: errorType,
              action_taken: updateData
            }
          });
        }

        // Determine required action
        let requiredAction = 'none';
        if (['ITEM_LOGIN_REQUIRED', 'PENDING_DISCONNECT'].includes(errorCode)) {
          requiredAction = 'update_mode';
        } else if (['USER_PERMISSION_REVOKED', 'ITEM_NOT_SUPPORTED'].includes(errorCode)) {
          requiredAction = 'relink';
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            requiredAction,
            message: getErrorMessage(errorCode)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh_accounts': {
        // Refresh account balances and check for new accounts
        if (!accessToken) {
          throw new Error('Access token required');
        }

        const response = await fetch(`${PLAID_ENV}/accounts/get`, {
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

        const data = await response.json();
        
        if (data.error_code) {
          throw new Error(data.error_message || 'Failed to refresh accounts');
        }

        // Update account balances
        for (const account of data.accounts) {
          await supabaseClient
            .from('bank_accounts')
            .update({
              current_balance: account.balances.current,
              last_synced_at: new Date().toISOString(),
            })
            .eq('plaid_account_id', account.account_id)
            .eq('user_id', user.id);
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            accounts: data.accounts.length,
            message: 'Account balances refreshed'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[UPDATE MODE] Error:', error);
    return new Response(
      JSON.stringify({ error: getErrorFromUnknown(error) }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    'ITEM_LOGIN_REQUIRED': 'Please update your bank login credentials',
    'ITEM_LOCKED': 'Your bank account is locked. Please unlock it at your bank',
    'ITEM_NOT_SUPPORTED': 'This institution is no longer supported',
    'PENDING_DISCONNECT': 'Your connection will expire soon. Please reconnect',
    'USER_PERMISSION_REVOKED': 'Bank permission was revoked. Please reconnect your account',
    'RATE_LIMIT': 'Too many requests. Please try again later',
    'ITEM_NOT_FOUND': 'Bank connection not found',
  };
  
  return messages[errorCode] || 'An error occurred with your bank connection';
}
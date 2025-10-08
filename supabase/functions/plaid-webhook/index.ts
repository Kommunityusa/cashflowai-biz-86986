import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { getErrorMessage } from '../_shared/error-handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, plaid-verification',
};

const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
const plaidSecret = Deno.env.get('PLAID_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Get Plaid environment from env variable
const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';
const PLAID_ENV = plaidEnv === 'production' ? 'https://production.plaid.com' : 
                  plaidEnv === 'development' ? 'https://development.plaid.com' : 
                  'https://sandbox.plaid.com';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Verify Plaid webhook signature for security
async function verifyPlaidWebhook(
  signatureHeader: string | null,
  body: string,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret + body);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedSignature = btoa(String.fromCharCode(...hashArray));
    return computedSignature === signatureHeader;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Enhanced sync transactions for small business bookkeeping
async function syncTransactions(accessToken: string, userId: string, accountId: string, itemId?: string) {
  console.log('[WEBHOOK] Syncing business transactions:', {
    account_id: accountId,
    item_id: itemId,
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
  
  try {
    // Get transactions from last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const response = await fetch(`${PLAID_ENV}/transactions/sync`, {
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
      console.error('[WEBHOOK Error] Plaid sync failed:', {
        error_code: data.error_code,
        error_message: data.error_message,
        request_id: data.request_id,
        account_id: accountId,
        item_id: itemId,
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
      return { error: data.error_message };
    }
    
    // Log successful sync with request ID
    console.log('[WEBHOOK Success] Transactions sync response:', {
      request_id: data.request_id,
      item_id: itemId,
      account_id: accountId,
      has_more: data.has_more,
      added_count: data.added?.length || 0,
      modified_count: data.modified?.length || 0,
      removed_count: data.removed?.length || 0,
      timestamp: new Date().toISOString(),
    });

    let totalSynced = 0;
    let taxDeductibleCount = 0;
    const newTransactions: any[] = [];

    // Process added transactions with enhanced business categorization
    for (const transaction of data.added || []) {
      // Check if transaction already exists
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('plaid_transaction_id', transaction.transaction_id)
        .maybeSingle();

      if (!existing) {
        // Enhanced business categorization
        const isIncome = transaction.amount < 0; // Plaid uses negative for money in
        const type = isIncome ? 'income' : 'expense';

        // Insert transaction - AI will categorize it
        const { data: inserted } = await supabase.from('transactions').insert({
          user_id: userId,
          bank_account_id: accountId,
          plaid_transaction_id: transaction.transaction_id,
          description: transaction.name,
          vendor_name: transaction.merchant_name || transaction.name.split(' ')[0],
          amount: Math.abs(transaction.amount),
          type: type,
          transaction_date: transaction.date,
          plaid_category: transaction.category,
          category_id: null, // Will be set by AI
          status: transaction.pending ? 'pending' : 'completed',
          notes: transaction.pending ? 'Pending - awaiting bank clearance' : null,
        }).select().single();
        
        if (inserted) {
          newTransactions.push({
            id: inserted.id,
            description: transaction.name,
            vendor_name: transaction.merchant_name,
            amount: Math.abs(transaction.amount),
            transaction_date: transaction.date,
          });
        }
        
        totalSynced++;
      }
    }
    
    // Auto-categorize new transactions with AI
    if (newTransactions.length > 0) {
      try {
        await supabase.functions.invoke('ai-categorize-transactions', {
          body: { transactions: newTransactions }
        });
        console.log(`[WEBHOOK] Auto-categorized ${newTransactions.length} transactions`);
      } catch (aiError) {
        console.error('[WEBHOOK] AI categorization failed:', aiError);
      }
    }

    // Process modified transactions with re-categorization
    for (const transaction of data.modified || []) {
      const isIncome = transaction.amount < 0;
      const type = isIncome ? 'income' : 'expense';
      
      await supabase
        .from('transactions')
        .update({
          description: transaction.name,
          vendor_name: transaction.merchant_name || transaction.name.split(' ')[0],
          amount: Math.abs(transaction.amount),
          type: type,
          transaction_date: transaction.date,
          plaid_category: transaction.category,
          status: transaction.pending ? 'pending' : 'completed',
        })
        .eq('plaid_transaction_id', transaction.transaction_id);
    }

    // Process removed transactions - archive instead of delete for audit trail
    for (const transactionId of data.removed || []) {
      await supabase
        .from('transactions')
        .update({
          status: 'cancelled',
          notes: 'Transaction cancelled by bank'
        })
        .eq('plaid_transaction_id', transactionId);
    }

    console.log('[WEBHOOK Complete] Transaction sync finished:', {
      total_synced: totalSynced,
      tax_deductible: taxDeductibleCount,
      account_id: accountId,
      item_id: itemId,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
    
    // Log audit event for significant sync
    if (totalSynced > 0) {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'PLAID_TRANSACTION_SYNC',
        entity_type: 'bank_account',
        entity_id: accountId,
        details: {
          total_synced: totalSynced,
          tax_deductible: taxDeductibleCount,
          sync_type: 'webhook',
          item_id: itemId,
          timestamp: new Date().toISOString(),
        }
      });
    }

    return { success: true, totalSynced, taxDeductibleCount };
  } catch (error) {
    console.error('[WEBHOOK Error] Transaction sync failed:', {
      error: getErrorMessage(error),
      account_id: accountId,
      item_id: itemId,
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
    return { error: getErrorMessage(error) };
  }
}

// Update account balances
async function updateAccountBalances(accessToken: string, itemId: string) {
  console.log('[WEBHOOK] Updating account balances for item:', itemId);
  
  try {
    const response = await fetch(`${PLAID_ENV}/accounts/balance/get`, {
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
      console.error('[WEBHOOK] Balance update error:', data);
      return { error: data.error_message };
    }

    // Update each account's balance
    for (const account of data.accounts) {
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: account.balances.current,
          last_synced_at: new Date().toISOString(),
        })
        .eq('plaid_account_id', account.account_id)
        .eq('plaid_item_id', itemId);
    }

    console.log(`[WEBHOOK] Updated balances for ${data.accounts.length} accounts`);
    return { success: true };
  } catch (error) {
    console.error('[WEBHOOK] Error updating balances:', error);
    return { error: getErrorMessage(error) };
  }
}

// Handle item error (e.g., credentials changed)
async function handleItemError(itemId: string, error: any) {
  console.log('[WEBHOOK] Handling item error for item:', itemId, error);
  
  // Mark all accounts for this item as requiring re-authentication
  await supabase
    .from('bank_accounts')
    .update({
      is_active: false,
      notes: `Connection error: ${error.error_message || 'Authentication required'}`,
    })
    .eq('plaid_item_id', itemId);

  // Log audit event
  const { data: accounts } = await supabase
    .from('bank_accounts')
    .select('user_id')
    .eq('plaid_item_id', itemId)
    .limit(1);

  if (accounts && accounts[0]) {
    await supabase.from('audit_logs').insert({
      user_id: accounts[0].user_id,
      action: 'BANK_CONNECTION_ERROR',
      entity_type: 'bank_account',
      entity_id: itemId,
      details: { error: error.error_message, error_code: error.error_code },
    });
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    const webhook = JSON.parse(bodyText);
    
    console.log('[WEBHOOK] Received Plaid webhook:', {
      webhook_type: webhook.webhook_type,
      webhook_code: webhook.webhook_code,
      item_id: webhook.item_id,
    });

    // Verify webhook signature (optional but recommended in production)
    // const signature = req.headers.get('plaid-verification');
    // const isValid = await verifyPlaidWebhook(signature, bodyText, plaidSecret!);
    // if (!isValid) {
    //   console.error('[WEBHOOK] Invalid webhook signature');
    //   return new Response(JSON.stringify({ error: 'Invalid signature' }), {
    //     status: 401,
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //   });
    // }

    // Get the bank account info for this item
    const { data: bankAccount } = await supabase
      .from('bank_accounts')
      .select('id, user_id, plaid_access_token')
      .eq('plaid_item_id', webhook.item_id)
      .limit(1)
      .maybeSingle();

    if (!bankAccount) {
      console.error('[WEBHOOK] No bank account found for item:', webhook.item_id);
      return new Response(
        JSON.stringify({ error: 'Bank account not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle different webhook types
    switch (webhook.webhook_type) {
      case 'TRANSACTIONS':
        switch (webhook.webhook_code) {
          case 'INITIAL_UPDATE':
          case 'DEFAULT_UPDATE':
            // New transactions available
            console.log('[WEBHOOK] Processing transaction update');
            await syncTransactions(
              bankAccount.plaid_access_token,
              bankAccount.user_id,
              bankAccount.id
            );
            break;
          
          case 'TRANSACTIONS_REMOVED':
            // Transactions were removed
            console.log('[WEBHOOK] Processing removed transactions');
            for (const transactionId of webhook.removed_transactions || []) {
              await supabase
                .from('transactions')
                .delete()
                .eq('plaid_transaction_id', transactionId);
            }
            break;
        }
        break;

      case 'ITEM':
        switch (webhook.webhook_code) {
          case 'ERROR':
            // Item has an error (e.g., credentials changed)
            console.log('[WEBHOOK] Item error detected');
            await handleItemError(webhook.item_id, webhook.error);
            break;
          
          case 'PENDING_EXPIRATION':
            // Item access token will expire soon
            console.log('[WEBHOOK] Item pending expiration');
            await supabase
              .from('bank_accounts')
              .update({
                notes: 'Access token expiring soon - re-authentication required',
              })
              .eq('plaid_item_id', webhook.item_id);
            break;
          
          case 'USER_PERMISSION_REVOKED':
            // User revoked permission
            console.log('[WEBHOOK] User permission revoked');
            await supabase
              .from('bank_accounts')
              .update({
                is_active: false,
                notes: 'User revoked permission',
              })
              .eq('plaid_item_id', webhook.item_id);
            break;

          case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
            // Webhook URL was successfully updated
            console.log('[WEBHOOK] Webhook update acknowledged');
            break;
        }
        break;

      case 'ACCOUNTS':
        switch (webhook.webhook_code) {
          case 'UPDATE':
            // Account information updated (e.g., balance changed)
            console.log('[WEBHOOK] Processing account update');
            await updateAccountBalances(
              bankAccount.plaid_access_token,
              webhook.item_id
            );
            break;
        }
        break;

      case 'HOLDINGS':
      case 'INVESTMENTS_TRANSACTIONS':
        // Handle investment updates if needed
        console.log('[WEBHOOK] Investment webhook received but not processed');
        break;

      default:
        console.log('[WEBHOOK] Unknown webhook type:', webhook.webhook_type);
    }

    // Log successful webhook processing
    await supabase.from('audit_logs').insert({
      user_id: bankAccount.user_id,
      action: 'PLAID_WEBHOOK_PROCESSED',
      entity_type: 'bank_account',
      entity_id: webhook.item_id,
      details: {
        webhook_type: webhook.webhook_type,
        webhook_code: webhook.webhook_code,
      },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
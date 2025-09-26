import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[PLAID-AUTO-SYNC] Starting automatic sync process');

    // Initialize Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Fetch all active bank accounts with Plaid connections
    const { data: bankAccounts, error: fetchError } = await supabaseAdmin
      .from('bank_accounts')
      .select('id, user_id, plaid_access_token, plaid_item_id, account_name, last_synced_at')
      .eq('is_active', true)
      .not('plaid_access_token', 'is', null);

    if (fetchError) {
      console.error('[PLAID-AUTO-SYNC] Error fetching bank accounts:', fetchError);
      throw fetchError;
    }

    console.log(`[PLAID-AUTO-SYNC] Found ${bankAccounts?.length || 0} active bank accounts to sync`);

    if (!bankAccounts || bankAccounts.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active bank accounts to sync',
        accountsProcessed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const syncResults = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each bank account
    for (const account of bankAccounts) {
      try {
        console.log(`[PLAID-AUTO-SYNC] Syncing account ${account.id} for user ${account.user_id}`);
        
        // Check if account was synced recently (within last hour) to avoid excessive API calls
        if (account.last_synced_at) {
          const lastSync = new Date(account.last_synced_at);
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (lastSync > hourAgo) {
            console.log(`[PLAID-AUTO-SYNC] Skipping account ${account.id} - synced recently at ${account.last_synced_at}`);
            syncResults.push({
              accountId: account.id,
              userId: account.user_id,
              accountName: account.account_name,
              status: 'skipped',
              message: 'Recently synced'
            });
            continue;
          }
        }

        // Call the existing plaid-sync function for this user
        const syncResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/plaid-sync`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
              'x-supabase-auth': account.user_id // Pass user context
            },
            body: JSON.stringify({
              userId: account.user_id,
              forceSync: true
            })
          }
        );

        const syncData = await syncResponse.json();

        if (syncResponse.ok) {
          successCount++;
          console.log(`[PLAID-AUTO-SYNC] Successfully synced account ${account.id}`);
          
          // Update last_synced_at timestamp
          await supabaseAdmin
            .from('bank_accounts')
            .update({ last_synced_at: new Date().toISOString() })
            .eq('id', account.id);

          syncResults.push({
            accountId: account.id,
            userId: account.user_id,
            accountName: account.account_name,
            status: 'success',
            transactionsAdded: syncData.added || 0,
            transactionsModified: syncData.modified || 0,
            transactionsRemoved: syncData.removed || 0
          });
        } else {
          errorCount++;
          console.error(`[PLAID-AUTO-SYNC] Error syncing account ${account.id}:`, syncData);
          
          syncResults.push({
            accountId: account.id,
            userId: account.user_id,
            accountName: account.account_name,
            status: 'error',
            error: syncData.error || 'Unknown error'
          });
        }

        // Add a small delay between accounts to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (accountError) {
        errorCount++;
        const errorMessage = accountError instanceof Error ? accountError.message : 'Unknown error';
        console.error(`[PLAID-AUTO-SYNC] Error processing account ${account.id}:`, errorMessage);
        
        syncResults.push({
          accountId: account.id,
          userId: account.user_id,
          accountName: account.account_name,
          status: 'error',
          error: errorMessage
        });
      }
    }

    // Log summary to audit logs
    const summary = {
      totalAccounts: bankAccounts.length,
      successCount,
      errorCount,
      skippedCount: bankAccounts.length - successCount - errorCount,
      timestamp: new Date().toISOString()
    };

    console.log('[PLAID-AUTO-SYNC] Sync complete:', summary);

    // Store sync results in audit log for monitoring
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // System user ID
        action: 'plaid_auto_sync',
        entity_type: 'system',
        details: {
          summary,
          results: syncResults
        }
      });

    return new Response(JSON.stringify({
      success: true,
      summary,
      results: syncResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PLAID-AUTO-SYNC] Fatal error:', errorMessage);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Failed to complete automatic sync process'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
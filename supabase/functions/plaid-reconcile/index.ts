import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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

    const { accountId, startDate, endDate } = await req.json();

    console.log('[RECONCILE] Starting reconciliation for account:', accountId);

    // Get all transactions for the period
    const { data: transactions, error: txError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('bank_account_id', accountId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: true });

    if (txError) throw txError;

    // Get bank account details
    const { data: bankAccount } = await supabaseClient
      .from('bank_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    // Calculate reconciliation data
    const reconciliation = {
      totalTransactions: transactions.length,
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      pendingTransactions: [],
      completedTransactions: [],
      cancelledTransactions: [],
      taxDeductibleTotal: 0,
      categorySummary: {},
      vendorSummary: {},
      discrepancies: []
    };

    // Process each transaction
    for (const tx of transactions) {
      // Categorize by status
      if (tx.status === 'pending') {
        reconciliation.pendingTransactions.push(tx);
      } else if (tx.status === 'completed') {
        reconciliation.completedTransactions.push(tx);
      } else if (tx.status === 'cancelled') {
        reconciliation.cancelledTransactions.push(tx);
      }

      // Only count completed transactions in totals
      if (tx.status === 'completed') {
        if (tx.type === 'income') {
          reconciliation.totalIncome += Number(tx.amount);
        } else {
          reconciliation.totalExpenses += Number(tx.amount);
        }

        // Track tax deductible
        if (tx.tax_deductible) {
          reconciliation.taxDeductibleTotal += Number(tx.amount);
        }

        // Category summary
        const categoryKey = tx.category_id || 'uncategorized';
        if (!reconciliation.categorySummary[categoryKey]) {
          reconciliation.categorySummary[categoryKey] = {
            count: 0,
            total: 0,
            type: tx.type
          };
        }
        reconciliation.categorySummary[categoryKey].count++;
        reconciliation.categorySummary[categoryKey].total += Number(tx.amount);

        // Vendor summary for expenses
        if (tx.type === 'expense' && tx.vendor_name) {
          if (!reconciliation.vendorSummary[tx.vendor_name]) {
            reconciliation.vendorSummary[tx.vendor_name] = {
              count: 0,
              total: 0
            };
          }
          reconciliation.vendorSummary[tx.vendor_name].count++;
          reconciliation.vendorSummary[tx.vendor_name].total += Number(tx.amount);
        }
      }
    }

    reconciliation.netCashFlow = reconciliation.totalIncome - reconciliation.totalExpenses;

    // Check for potential duplicates
    const potentialDuplicates = [];
    for (let i = 0; i < transactions.length - 1; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        if (
          transactions[i].amount === transactions[j].amount &&
          transactions[i].transaction_date === transactions[j].transaction_date &&
          transactions[i].status === 'completed' &&
          transactions[j].status === 'completed'
        ) {
          potentialDuplicates.push({
            transaction1: transactions[i].id,
            transaction2: transactions[j].id,
            amount: transactions[i].amount,
            date: transactions[i].transaction_date
          });
        }
      }
    }

    if (potentialDuplicates.length > 0) {
      reconciliation.discrepancies.push({
        type: 'potential_duplicates',
        items: potentialDuplicates
      });
    }

    // Check for uncategorized transactions
    const uncategorized = transactions.filter(tx => !tx.category_id && tx.status === 'completed');
    if (uncategorized.length > 0) {
      reconciliation.discrepancies.push({
        type: 'uncategorized_transactions',
        count: uncategorized.length,
        items: uncategorized.map(tx => tx.id)
      });
    }

    // Check bank balance vs calculated balance
    const calculatedBalance = Number(bankAccount?.current_balance || 0) + reconciliation.netCashFlow;
    
    // Log reconciliation audit
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'BANK_RECONCILIATION',
      entity_type: 'bank_account',
      entity_id: accountId,
      details: {
        period: { startDate, endDate },
        summary: {
          totalTransactions: reconciliation.totalTransactions,
          netCashFlow: reconciliation.netCashFlow,
          taxDeductible: reconciliation.taxDeductibleTotal,
          discrepancies: reconciliation.discrepancies.length
        }
      }
    });

    console.log('[RECONCILE] Reconciliation complete:', {
      transactions: reconciliation.totalTransactions,
      netCashFlow: reconciliation.netCashFlow,
      discrepancies: reconciliation.discrepancies.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        reconciliation,
        bankBalance: bankAccount?.current_balance,
        calculatedBalance,
        lastSynced: bankAccount?.last_synced_at
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('[RECONCILE] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  id: string;
  amount: number;
  transaction_date: string;
  status: string;
  vendor_name?: string;
  category_id?: string;
  [key: string]: any;
}

interface Discrepancy {
  type: string;
  items?: any[];
  count?: number;
}

interface CategorySummary {
  count: number;
  total: number;
}

interface VendorSummary {
  count: number;
  total: number;
}

interface ReconciliationReport {
  totalPending: number;
  totalCompleted: number;
  totalCancelled: number;
  discrepancies: Discrepancy[];
  categorySummary: Record<string, CategorySummary>;
  vendorSummary: Record<string, VendorSummary>;
  reconciliationScore: number;
  recommendations: string[];
  pendingTransactions: Transaction[];
  completedTransactions: Transaction[];
  cancelledTransactions: Transaction[];
}

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

    // Initialize reconciliation report
    const reconciliation: ReconciliationReport = {
      totalPending: 0,
      totalCompleted: 0,
      totalCancelled: 0,
      discrepancies: [],
      categorySummary: {},
      vendorSummary: {},
      reconciliationScore: 100,
      recommendations: [],
      pendingTransactions: [],
      completedTransactions: [],
      cancelledTransactions: [],
    };

    // Process transactions
    if (transactions && transactions.length > 0) {
      for (const tx of transactions) {
        // Count by status
        if (tx.status === 'pending') {
          reconciliation.totalPending++;
          reconciliation.pendingTransactions.push(tx);
        } else if (tx.status === 'completed') {
          reconciliation.totalCompleted++;
          reconciliation.completedTransactions.push(tx);
        } else if (tx.status === 'cancelled') {
          reconciliation.totalCancelled++;
          reconciliation.cancelledTransactions.push(tx);
        }

        // Category summary
        if (tx.category_id) {
          const { data: category } = await supabaseClient
            .from('categories')
            .select('name')
            .eq('id', tx.category_id)
            .single();
          
          const categoryKey = category?.name || 'Uncategorized';
          if (!reconciliation.categorySummary[categoryKey]) {
            reconciliation.categorySummary[categoryKey] = {
              count: 0,
              total: 0
            };
          }
          reconciliation.categorySummary[categoryKey].count++;
          reconciliation.categorySummary[categoryKey].total += Number(tx.amount);
        }

        // Vendor summary
        if (tx.vendor_name) {
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

      // Check for duplicates
      const seenTransactions = new Map();
      for (const tx of transactions) {
        const key = `${tx.amount}_${tx.transaction_date}_${tx.vendor_name}`;
        if (seenTransactions.has(key)) {
          const duplicate = seenTransactions.get(key);
          reconciliation.discrepancies.push({
            type: 'duplicate',
            items: [
              {
                transaction1: duplicate,
                transaction2: tx,
                amount: tx.amount,
                date: tx.transaction_date
              }
            ]
          });
          reconciliation.reconciliationScore -= 5;
        } else {
          seenTransactions.set(key, tx);
        }
      }

      // Check for missing categories
      const uncategorized = transactions.filter(tx => !tx.category_id);
      if (uncategorized.length > 0) {
        reconciliation.discrepancies.push({
          type: 'uncategorized',
          count: uncategorized.length,
          items: uncategorized.slice(0, 5) // Show first 5
        });
        reconciliation.reconciliationScore -= (uncategorized.length * 2);
      }

      // Generate recommendations
      if (reconciliation.totalPending > 0) {
        reconciliation.recommendations.push(
          `You have ${reconciliation.totalPending} pending transactions that need to be reviewed`
        );
      }

      if (uncategorized.length > 0) {
        reconciliation.recommendations.push(
          `${uncategorized.length} transactions are missing categories. Categorizing them will improve your financial insights`
        );
      }

      if (reconciliation.discrepancies.filter(d => d.type === 'duplicate').length > 0) {
        reconciliation.recommendations.push(
          'Potential duplicate transactions detected. Review and remove duplicates to maintain accurate records'
        );
      }

      // Ensure score doesn't go below 0
      reconciliation.reconciliationScore = Math.max(0, reconciliation.reconciliationScore);
    }

    console.log('[RECONCILE] Reconciliation complete:', {
      total: transactions?.length || 0,
      pending: reconciliation.totalPending,
      completed: reconciliation.totalCompleted,
      discrepancies: reconciliation.discrepancies.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        report: reconciliation,
        bankAccount,
        period: { startDate, endDate }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[RECONCILE] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
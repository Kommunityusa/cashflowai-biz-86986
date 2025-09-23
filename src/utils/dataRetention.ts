import { supabase } from "@/integrations/supabase/client";

export interface DataRetentionPolicy {
  transactionRetentionDays: number;
  auditLogRetentionDays: number;
  inactiveAccountRetentionDays: number;
  archivedDataRetentionYears: number;
}

const DEFAULT_POLICY: DataRetentionPolicy = {
  transactionRetentionDays: 2555, // ~7 years for tax purposes
  auditLogRetentionDays: 365,     // 1 year
  inactiveAccountRetentionDays: 90, // 3 months
  archivedDataRetentionYears: 7,   // 7 years for compliance
};

/**
 * Clean up old data based on retention policies
 */
export async function enforceDataRetention(userId: string, policy = DEFAULT_POLICY) {
  const results = {
    transactionsDeleted: 0,
    auditLogsDeleted: 0,
    accountsCleaned: 0,
    errors: [] as string[],
  };

  try {
    // 1. Clean up old archived transactions
    const transactionCutoff = new Date();
    transactionCutoff.setDate(transactionCutoff.getDate() - policy.transactionRetentionDays);
    
    const { data: oldTransactions, error: transError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'archived')
      .lt('created_at', transactionCutoff.toISOString())
      .select('id');
    
    if (transError) {
      results.errors.push(`Transaction cleanup error: ${transError.message}`);
    } else {
      results.transactionsDeleted = oldTransactions?.length || 0;
    }

    // 2. Clean up old audit logs (except critical ones)
    const auditCutoff = new Date();
    auditCutoff.setDate(auditCutoff.getDate() - policy.auditLogRetentionDays);
    
    const { data: oldAudits, error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .eq('user_id', userId)
      .not('action', 'in', '(LOGIN,PLAID_ITEM_REMOVED,DISCONNECT_BANK)')
      .lt('created_at', auditCutoff.toISOString())
      .select('id');
    
    if (auditError) {
      results.errors.push(`Audit log cleanup error: ${auditError.message}`);
    } else {
      results.auditLogsDeleted = oldAudits?.length || 0;
    }

    // 3. Clean up inactive bank accounts with no recent activity
    const inactiveCutoff = new Date();
    inactiveCutoff.setDate(inactiveCutoff.getDate() - policy.inactiveAccountRetentionDays);
    
    const { data: inactiveAccounts, error: accountError } = await supabase
      .from('bank_accounts')
      .update({
        plaid_access_token: null,
        plaid_access_token_encrypted: null,
        account_number_encrypted: null,
        routing_number_encrypted: null,
        notes: 'Data purged per retention policy',
      })
      .eq('user_id', userId)
      .eq('is_active', false)
      .lt('updated_at', inactiveCutoff.toISOString())
      .select('id');
    
    if (accountError) {
      results.errors.push(`Account cleanup error: ${accountError.message}`);
    } else {
      results.accountsCleaned = inactiveAccounts?.length || 0;
    }

    // Log retention enforcement
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'DATA_RETENTION_ENFORCED' as any,
      details: {
        policy: JSON.parse(JSON.stringify(policy)),
        results: {
          transactions_deleted: results.transactionsDeleted,
          audit_logs_deleted: results.auditLogsDeleted,
          accounts_cleaned: results.accountsCleaned,
        },
        timestamp: new Date().toISOString(),
      } as any,
    });

  } catch (error: any) {
    console.error('Data retention enforcement error:', error);
    results.errors.push(`General error: ${error.message}`);
  }

  return results;
}

/**
 * Export user data before deletion (GDPR compliance)
 */
export async function exportUserData(userId: string) {
  try {
    const [
      { data: transactions },
      { data: bankAccounts },
      { data: categories },
      { data: profile },
    ] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', userId),
      supabase.from('bank_accounts').select('*').eq('user_id', userId),
      supabase.from('categories').select('*').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('user_id', userId),
    ]);

    return {
      exportDate: new Date().toISOString(),
      userId,
      data: {
        profile,
        transactions,
        bankAccounts: bankAccounts?.map(acc => ({
          ...acc,
          // Exclude sensitive data from export
          plaid_access_token: undefined,
          plaid_access_token_encrypted: undefined,
          account_number_encrypted: undefined,
          routing_number_encrypted: undefined,
        })),
        categories,
      },
    };
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
}

/**
 * Schedule periodic data retention cleanup
 */
export function scheduleDataRetention(userId: string, intervalDays = 30) {
  // This would typically be implemented as a cron job or scheduled function
  // For now, it can be called manually or triggered by user actions
  
  const checkRetention = async () => {
    const lastCheck = localStorage.getItem(`retention_check_${userId}`);
    const lastCheckDate = lastCheck ? new Date(lastCheck) : null;
    const now = new Date();
    
    if (!lastCheckDate || 
        (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24) >= intervalDays) {
      
      await enforceDataRetention(userId);
      localStorage.setItem(`retention_check_${userId}`, now.toISOString());
    }
  };
  
  // Check on load and set up periodic check
  checkRetention();
  
  return {
    check: checkRetention,
    interval: intervalDays,
  };
}
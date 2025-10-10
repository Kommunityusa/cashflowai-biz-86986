import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 
  | 'LOGIN'
  | 'LOGIN_2FA'
  | 'LOGOUT'
  | 'GOOGLE_LOGIN'
  | 'VIEW_DASHBOARD'
  | 'VIEW_TRANSACTIONS'
  | 'CREATE_TRANSACTION'
  | 'UPDATE_TRANSACTION'
  | 'DELETE_TRANSACTION'
  | 'CONNECT_BANK'
  | 'DISCONNECT_BANK'
  | 'SYNC_TRANSACTIONS'
  | 'GENERATE_REPORT'
  | 'UPDATE_SETTINGS'
  | 'VIEW_INSIGHTS'
  | 'EXPORT_DATA'
  | 'VIEW_AUDIT_LOGS'
  | 'PLAID_LINK_TOKEN_CREATED'
  | 'PLAID_LINK_TOKEN_ERROR'
  | 'PLAID_LINK_SUCCESS'
  | 'PLAID_LINK_DUPLICATE_CANCELLED'
  | 'PLAID_TOKEN_EXCHANGED'
  | 'PLAID_TOKEN_EXCHANGE_ERROR'
  | 'PLAID_LINK_EXIT_ERROR'
  | 'PLAID_LINK_EXIT'
  | 'PLAID_BENEFITS_VIEWED'
  | 'PLAID_LINK_INITIATED'
  | 'PLAID_SYNC_COMPLETED'
  | 'AI_CATEGORIZATION_COMPLETED'
  | 'DETECT_RECURRING'
  | 'GENERATE_TAX_REPORT'
  | 'ENABLE_2FA'
  | 'DISABLE_2FA';

interface AuditLogData {
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
}

export async function logAuditEvent(data: AuditLogData) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.functions.invoke('audit', {
      body: {
        action: 'log_audit',
        data,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

export async function checkRateLimit(email: string): Promise<{ limited: boolean; message?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('audit', {
      body: {
        action: 'check_rate_limit',
        data: { email },
      },
    });

    if (error) {
      return { limited: false };
    }

    return data || { limited: false };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { limited: false };
  }
}

export async function logLoginAttempt(email: string, success: boolean, errorMessage?: string) {
  try {
    await supabase.functions.invoke('audit', {
      body: {
        action: 'log_login_attempt',
        data: { email, success, errorMessage },
      },
    });
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
}
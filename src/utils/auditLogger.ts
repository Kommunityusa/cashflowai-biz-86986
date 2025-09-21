import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
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
  | 'EXPORT_DATA';

interface AuditLogData {
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
}

export async function logAuditEvent(data: AuditLogData) {
  try {
    const response = await fetch(
      `https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/audit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'log_audit',
          data,
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to log audit event');
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

export async function checkRateLimit(email: string): Promise<{ limited: boolean; message?: string }> {
  try {
    const response = await fetch(
      `https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/audit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_rate_limit',
          data: { email },
        }),
      }
    );

    if (!response.ok) {
      return { limited: false };
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { limited: false };
  }
}

export async function logLoginAttempt(email: string, success: boolean, errorMessage?: string) {
  try {
    await fetch(
      `https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/audit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'log_login_attempt',
          data: { email, success, errorMessage },
        }),
      }
    );
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
}
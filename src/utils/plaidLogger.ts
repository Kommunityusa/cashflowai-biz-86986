import { supabase } from "@/integrations/supabase/client";

export interface PlaidLogData {
  eventType: 'link_token_created' | 'link_session_started' | 'link_success' | 'link_exit' | 
             'token_exchange' | 'accounts_fetched' | 'transactions_synced' | 'error' | 
             'webhook_received' | 'update_required' | 'item_removed';
  itemId?: string;
  requestId?: string;
  accountId?: string | string[];
  linkSessionId?: string;
  institutionId?: string;
  institutionName?: string;
  errorCode?: string;
  errorMessage?: string;
  errorType?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

/**
 * Log Plaid events with important identifiers for troubleshooting
 */
export async function logPlaidEvent(data: PlaidLogData) {
  try {
    const logEntry = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    };

    // Log to console for immediate debugging
    console.log(`[Plaid ${data.eventType}]`, logEntry);

    // Store in database for persistent logging
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: `PLAID_${data.eventType.toUpperCase()}`,
        entity_type: 'plaid_event',
        entity_id: data.itemId || data.linkSessionId,
        details: logEntry,
      });

    if (error) {
      console.error('Failed to log Plaid event to database:', error);
    }

    // For critical errors, also send to edge function for server-side logging
    if (data.eventType === 'error' && data.errorCode) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch(
          `https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/plaid-logging`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: 'log_error',
              data: logEntry,
            }),
          }
        );
      }
    }
  } catch (error) {
    console.error('Error in logPlaidEvent:', error);
  }
}

/**
 * Extract and log Plaid request IDs from response headers
 */
export function extractPlaidRequestId(response: any): string | null {
  try {
    // Plaid returns request_id in response body
    if (response?.request_id) {
      return response.request_id;
    }
    // Sometimes it's in the headers
    if (response?.headers?.['plaid-request-id']) {
      return response.headers['plaid-request-id'];
    }
    return null;
  } catch (error) {
    console.error('Error extracting Plaid request ID:', error);
    return null;
  }
}

/**
 * Log Link session details for debugging
 */
export function logLinkSession(metadata: any, linkSessionId: string) {
  const sessionData: PlaidLogData = {
    eventType: 'link_session_started',
    linkSessionId,
    institutionId: metadata?.institution?.institution_id,
    institutionName: metadata?.institution?.name,
    accountId: metadata?.accounts?.map((a: any) => a.id),
    metadata: {
      linkToken: metadata?.link_token,
      accounts: metadata?.accounts?.length || 0,
      transferStatus: metadata?.transfer_status,
    },
  };
  
  logPlaidEvent(sessionData);
}

/**
 * Format error for logging with all relevant details
 */
export function formatPlaidError(error: any, context: string): PlaidLogData {
  return {
    eventType: 'error',
    errorCode: error?.error_code || error?.code,
    errorMessage: error?.error_message || error?.message || error?.toString(),
    errorType: error?.error_type,
    metadata: {
      context,
      displayMessage: error?.display_message,
      documentationUrl: error?.documentation_url,
      suggestedAction: error?.suggested_action,
      rawError: error,
    },
  };
}
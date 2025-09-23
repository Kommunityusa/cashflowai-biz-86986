import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaidLogData {
  eventType: string;
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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data } = await req.json() as { action: string; data: PlaidLogData };

    switch (action) {
      case 'log_error': {
        // Log critical Plaid errors to audit logs for debugging
        console.error('[Plaid Error Log]', {
          user_id: user.id,
          ...data,
          timestamp: data.timestamp || new Date().toISOString(),
        });

        // Store in audit logs
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: `PLAID_ERROR_${data.eventType?.toUpperCase() || 'UNKNOWN'}`,
          entity_type: 'plaid_error',
          entity_id: data.itemId || data.linkSessionId,
          details: {
            ...data,
            severity: 'error',
            logged_at: new Date().toISOString(),
          },
        });

        // For critical errors, also log to platform_settings for admin review
        if (data.errorCode && ['ITEM_LOGIN_REQUIRED', 'ITEM_ERROR', 'INVALID_CREDENTIALS'].includes(data.errorCode)) {
          await supabase.from('platform_settings').insert({
            key: `plaid_critical_error_${Date.now()}`,
            value: {
              user_id: user.id,
              error: data,
              timestamp: new Date().toISOString(),
            },
          });
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'log_event': {
        // Log general Plaid events
        console.log('[Plaid Event Log]', {
          user_id: user.id,
          ...data,
          timestamp: data.timestamp || new Date().toISOString(),
        });

        // Store in audit logs
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: `PLAID_${data.eventType?.toUpperCase() || 'EVENT'}`,
          entity_type: 'plaid_event',
          entity_id: data.itemId || data.linkSessionId,
          details: data,
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_logs': {
        // Retrieve Plaid logs for debugging
        const { data: logs, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', user.id)
          .like('action', 'PLAID_%')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          throw error;
        }

        // Extract key identifiers for debugging
        const identifiers = {
          item_ids: [...new Set(logs?.map(l => l.details?.itemId).filter(Boolean))],
          request_ids: [...new Set(logs?.map(l => l.details?.requestId).filter(Boolean))],
          account_ids: [...new Set(logs?.flatMap(l => l.details?.accountId || []).filter(Boolean))],
          link_session_ids: [...new Set(logs?.map(l => l.details?.linkSessionId).filter(Boolean))],
        };

        return new Response(
          JSON.stringify({ 
            logs,
            identifiers,
            count: logs?.length || 0,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default: {
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (error) {
    console.error('Error in plaid-logging function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting storage
const rateLimitMap = new Map();
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    // Create Supabase client with service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify user authentication using the provided token
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    const { action, data } = await req.json();
    
    // Get client info
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    switch (action) {
      case 'log_audit': {
        // Verify user is authenticated
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }

        // Log audit event
        const { error } = await supabaseAdmin
          .from('audit_logs')
          .insert({
            user_id: userId,
            action: data.action,
            entity_type: data.entityType,
            entity_id: data.entityId,
            details: data.details,
            ip_address: ip,
            user_agent: userAgent,
          });

        if (error) {
          console.error('Audit log error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to log audit event' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 'check_rate_limit': {
        const { email } = data;
        
        // Clean up old entries
        const now = Date.now();
        for (const [key, attempts] of rateLimitMap.entries()) {
          const filtered = attempts.filter((time: number) => now - time < LOGIN_ATTEMPT_WINDOW);
          if (filtered.length === 0) {
            rateLimitMap.delete(key);
          } else {
            rateLimitMap.set(key, filtered);
          }
        }

        // Check rate limit for this email
        const attempts = rateLimitMap.get(email) || [];
        const recentAttempts = attempts.filter((time: number) => now - time < LOGIN_ATTEMPT_WINDOW);
        
        if (recentAttempts.length >= LOGIN_ATTEMPT_LIMIT) {
          const oldestAttempt = Math.min(...recentAttempts);
          const timeUntilReset = LOGIN_ATTEMPT_WINDOW - (now - oldestAttempt);
          const minutesRemaining = Math.ceil(timeUntilReset / 60000);
          
          return new Response(
            JSON.stringify({ 
              limited: true, 
              message: `Too many login attempts. Please try again in ${minutesRemaining} minutes.`,
              minutesRemaining 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        return new Response(
          JSON.stringify({ limited: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 'log_login_attempt': {
        const { email, success, errorMessage } = data;
        
        // Use admin client for logging
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Log the attempt
        await supabaseAdmin.rpc('log_login_attempt', {
          p_email: email,
          p_success: success,
          p_error_message: errorMessage,
          p_ip_address: ip,
          p_user_agent: userAgent,
        });

        // Update rate limit map if failed
        if (!success) {
          const attempts = rateLimitMap.get(email) || [];
          attempts.push(Date.now());
          rateLimitMap.set(email, attempts);
        } else {
          // Clear rate limit on successful login
          rateLimitMap.delete(email);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      case 'get_audit_logs': {
        // Verify user is authenticated
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }

        // Fetch user's audit logs
        const { data: logs, error } = await supabaseAdmin
          .from('audit_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Fetch audit logs error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch audit logs' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        return new Response(
          JSON.stringify({ logs }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
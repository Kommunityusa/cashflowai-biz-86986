import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyPrefix: string;  // Prefix for identifying different limit types
}

const rateLimits: Record<string, RateLimitConfig> = {
  api_general: { windowMs: 60000, maxRequests: 60, keyPrefix: 'api' },  // 60 requests per minute
  transaction_create: { windowMs: 60000, maxRequests: 10, keyPrefix: 'tx_create' },  // 10 per minute
  bank_sync: { windowMs: 3600000, maxRequests: 10, keyPrefix: 'bank_sync' },  // 10 per hour
  ai_insights: { windowMs: 3600000, maxRequests: 20, keyPrefix: 'ai' },  // 20 per hour
  export_data: { windowMs: 300000, maxRequests: 5, keyPrefix: 'export' },  // 5 per 5 minutes
  report_generate: { windowMs: 300000, maxRequests: 10, keyPrefix: 'report' },  // 10 per 5 minutes
};

// In-memory storage for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

function checkRateLimit(
  identifier: string,
  limitType: keyof typeof rateLimits
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const config = rateLimits[limitType];
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  
  const current = rateLimitStore.get(key);
  
  if (!current || current.resetTime < now) {
    // Create new window
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { 
      allowed: true, 
      remaining: config.maxRequests - 1, 
      resetTime 
    };
  }
  
  if (current.count >= config.maxRequests) {
    // Rate limit exceeded
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: current.resetTime,
      retryAfter: Math.ceil((current.resetTime - now) / 1000)
    };
  }
  
  // Increment count
  current.count++;
  rateLimitStore.set(key, current);
  
  return { 
    allowed: true, 
    remaining: config.maxRequests - current.count, 
    resetTime: current.resetTime 
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get user for rate limiting
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    // Use IP address for rate limiting if user is not authenticated
    const identifier = user?.id || req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 'anonymous';
    
    const { action, limitType = 'api_general' } = await req.json();
    
    // Check rate limit
    const rateLimit = checkRateLimit(identifier, limitType as keyof typeof rateLimits);
    
    // Add rate limit headers to response
    const rateLimitHeaders = {
      'X-RateLimit-Limit': rateLimits[limitType].maxRequests.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
    };
    
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
          retryAfter: rateLimit.retryAfter 
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            ...rateLimitHeaders,
            'Retry-After': rateLimit.retryAfter!.toString(),
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    // Process different actions
    switch (action) {
      case 'check_limits': {
        // Return current rate limit status for all limit types
        const limits: Record<string, any> = {};
        
        for (const [type, config] of Object.entries(rateLimits)) {
          const status = checkRateLimit(identifier, type as keyof typeof rateLimits);
          limits[type] = {
            limit: config.maxRequests,
            remaining: status.remaining,
            resetTime: new Date(status.resetTime).toISOString(),
            windowMs: config.windowMs,
          };
        }
        
        return new Response(
          JSON.stringify({ limits }),
          { 
            headers: { 
              ...corsHeaders, 
              ...rateLimitHeaders,
              'Content-Type': 'application/json' 
            },
            status: 200 
          }
        );
      }
      
      case 'reset_limit': {
        // Admin function to reset rate limits (requires service role)
        if (!user || !req.headers.get('X-Admin-Key')) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401 
            }
          );
        }
        
        const { targetUser, limitType: resetType } = await req.json();
        const config = rateLimits[resetType as keyof typeof rateLimits];
        if (config) {
          const key = `${config.keyPrefix}:${targetUser}`;
          rateLimitStore.delete(key);
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Rate limit reset' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      case 'get_usage_stats': {
        // Get usage statistics for the current user
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401 
            }
          );
        }
        
        const stats: Record<string, any> = {};
        const now = Date.now();
        
        for (const [type, config] of Object.entries(rateLimits)) {
          const key = `${config.keyPrefix}:${user.id}`;
          const current = rateLimitStore.get(key);
          
          if (current && current.resetTime > now) {
            stats[type] = {
              used: current.count,
              limit: config.maxRequests,
              remaining: config.maxRequests - current.count,
              resetIn: Math.ceil((current.resetTime - now) / 1000),
              percentage: Math.round((current.count / config.maxRequests) * 100),
            };
          } else {
            stats[type] = {
              used: 0,
              limit: config.maxRequests,
              remaining: config.maxRequests,
              resetIn: 0,
              percentage: 0,
            };
          }
        }
        
        return new Response(
          JSON.stringify({ stats }),
          { 
            headers: { 
              ...corsHeaders, 
              ...rateLimitHeaders,
              'Content-Type': 'application/json' 
            },
            status: 200 
          }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
    }
  } catch (error) {
    console.error('Rate limit service error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
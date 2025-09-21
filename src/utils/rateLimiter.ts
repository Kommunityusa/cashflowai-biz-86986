import { supabase } from "@/integrations/supabase/client";

export type RateLimitType = 
  | 'api_general'
  | 'transaction_create'
  | 'bank_sync'
  | 'ai_insights'
  | 'export_data'
  | 'report_generate';

interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: string;
  retryAfter?: number;
}

interface UsageStats {
  [key: string]: {
    used: number;
    limit: number;
    remaining: number;
    resetIn: number;
    percentage: number;
  };
}

class RateLimiter {
  private cache: Map<string, RateLimitStatus> = new Map();
  private lastCheck: number = 0;
  private checkInterval = 60000; // Check every minute

  async checkLimit(limitType: RateLimitType = 'api_general'): Promise<RateLimitStatus> {
    const cacheKey = `${limitType}_${Date.now()}`;
    
    // Check cache first (with 1 minute expiry)
    const cached = this.cache.get(limitType);
    if (cached && Date.now() - this.lastCheck < this.checkInterval) {
      return cached;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/rate-limit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session && { 'Authorization': `Bearer ${session.access_token}` }),
          },
          body: JSON.stringify({
            action: 'check_limits',
            limitType,
          }),
        }
      );

      if (response.status === 429) {
        const error = await response.json();
        return {
          allowed: false,
          remaining: 0,
          limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
          resetTime: response.headers.get('X-RateLimit-Reset') || new Date().toISOString(),
          retryAfter: error.retryAfter,
        };
      }

      const data = await response.json();
      const limitStatus = data.limits[limitType];
      
      const status: RateLimitStatus = {
        allowed: limitStatus.remaining > 0,
        remaining: limitStatus.remaining,
        limit: limitStatus.limit,
        resetTime: limitStatus.resetTime,
      };

      this.cache.set(limitType, status);
      this.lastCheck = Date.now();
      
      return status;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Return permissive status on error
      return {
        allowed: true,
        remaining: 100,
        limit: 100,
        resetTime: new Date().toISOString(),
      };
    }
  }

  async getUsageStats(): Promise<UsageStats | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch(
        `https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/rate-limit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'get_usage_stats',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }

      const { stats } = await response.json();
      return stats;
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return null;
    }
  }

  formatResetTime(resetTime: string): string {
    const reset = new Date(resetTime);
    const now = new Date();
    const diff = Math.max(0, reset.getTime() - now.getTime());
    
    if (diff === 0) return 'now';
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  clearCache() {
    this.cache.clear();
    this.lastCheck = 0;
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Hook for React components
import { useState, useEffect } from 'react';

export function useRateLimit(limitType: RateLimitType = 'api_general') {
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      const limitStatus = await rateLimiter.checkLimit(limitType);
      setStatus(limitStatus);
      setLoading(false);
    };

    checkStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [limitType]);

  return { status, loading, formatTime: rateLimiter.formatResetTime };
}

// Decorator function for rate-limited actions
export async function withRateLimit<T>(
  limitType: RateLimitType,
  action: () => Promise<T>,
  onRateLimited?: (retryAfter: number) => void
): Promise<T | null> {
  const status = await rateLimiter.checkLimit(limitType);
  
  if (!status.allowed) {
    if (onRateLimited) {
      onRateLimited(status.retryAfter || 60);
    }
    return null;
  }
  
  return action();
}
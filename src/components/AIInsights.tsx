import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { withRateLimit } from "@/utils/rateLimiter";
import { logAuditEvent } from "@/utils/auditLogger";

interface Insight {
  title: string;
  description: string;
}

export function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchInsights = async () => {
    setLoading(true);
    
    const result = await withRateLimit(
      'ai_insights',
      async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error("Not authenticated");
          }

          const { data, error } = await supabase.functions.invoke('ai-insights', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (error) throw error;

          // Log audit event
          await logAuditEvent({
            action: 'VIEW_INSIGHTS',
            details: { timestamp: new Date().toISOString() }
          });

          // Handle the response properly
          const insightsData = data.insights || data;
          setInsights(Array.isArray(insightsData) ? insightsData : []);
          return true;
        } catch (error) {
          console.error('Error fetching insights:', error);
          toast({
            title: "Error",
            description: "Failed to fetch AI insights",
            variant: "destructive",
          });
          return false;
        }
      },
      (retryAfter) => {
        toast({
          title: "Rate Limit Exceeded",
          description: `Too many AI requests. Please wait ${retryAfter} seconds.`,
          variant: "destructive",
        });
      }
    );
    
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Financial Insights
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInsights}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-4/5 mt-1"></div>
              </div>
            ))}
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex gap-3">
                <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add more transactions to get personalized financial insights.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
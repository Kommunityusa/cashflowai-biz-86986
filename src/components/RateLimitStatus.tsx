import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  RefreshCw, 
  AlertTriangle,
  Zap,
  Database,
  Brain,
  Download,
  FileText,
  TrendingUp
} from "lucide-react";
import { rateLimiter } from "@/utils/rateLimiter";
import { useToast } from "@/hooks/use-toast";

interface UsageItem {
  name: string;
  type: string;
  icon: any;
  color: string;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  resetIn: number;
}

export function RateLimitStatus() {
  const { toast } = useToast();
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const limitConfig = {
    api_general: {
      name: "API Requests",
      icon: Activity,
      color: "text-blue-500",
      description: "General API calls"
    },
    transaction_create: {
      name: "Transaction Creation",
      icon: TrendingUp,
      color: "text-green-500",
      description: "New transactions per minute"
    },
    bank_sync: {
      name: "Bank Sync",
      icon: Database,
      color: "text-purple-500",
      description: "Bank synchronizations per hour"
    },
    ai_insights: {
      name: "AI Insights",
      icon: Brain,
      color: "text-pink-500",
      description: "AI analysis requests per hour"
    },
    export_data: {
      name: "Data Exports",
      icon: Download,
      color: "text-orange-500",
      description: "Export operations"
    },
    report_generate: {
      name: "Report Generation",
      icon: FileText,
      color: "text-indigo-500",
      description: "Report creation"
    }
  };

  useEffect(() => {
    fetchUsageStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsageStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUsageStats = async () => {
    setLoading(true);
    try {
      const stats = await rateLimiter.getUsageStats();
      
      if (stats) {
        const usageItems: UsageItem[] = Object.entries(stats).map(([type, data]: [string, any]) => {
          const config = limitConfig[type as keyof typeof limitConfig];
          return {
            name: config?.name || type,
            type,
            icon: config?.icon || Activity,
            color: config?.color || "text-gray-500",
            ...data
          };
        });
        
        setUsage(usageItems);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rate limit status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    if (percentage >= 50) return "bg-blue-500";
    return "bg-green-500";
  };

  const formatResetTime = (seconds: number) => {
    if (seconds <= 0) return "Reset";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge variant="destructive" className="text-xs">Critical</Badge>;
    }
    if (percentage >= 75) {
      return <Badge variant="secondary" className="text-xs">Warning</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Normal</Badge>;
  };

  const criticalLimits = usage.filter(u => u.percentage >= 90);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Rate Limit Status
            </CardTitle>
            <CardDescription>
              Monitor your API usage and rate limits
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsageStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {criticalLimits.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Rate limit warning:</strong> {criticalLimits.length} service(s) are near their limit.
              Please wait before making more requests.
            </AlertDescription>
          </Alert>
        )}

        {loading && usage.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading usage statistics...
          </div>
        ) : (
          <div className="space-y-4">
            {usage.map((item) => {
              const Icon = item.icon;
              const config = limitConfig[item.type as keyof typeof limitConfig];
              
              return (
                <div key={item.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${item.color}`} />
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {config?.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.percentage)}
                      <span className="text-sm text-muted-foreground">
                        {item.used}/{item.limit}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress 
                      value={item.percentage} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.remaining} remaining</span>
                      <span>Resets in {formatResetTime(item.resetIn)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-4 border-t text-xs text-muted-foreground text-center">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  Sparkles,
  Lightbulb,
  ChevronRight,
  RefreshCw,
  Building,
  Banknote,
  Users,
  Rocket,
  Info,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface FundingMetrics {
  monthlyRevenue: number;
  monthlyExpenses: number;
  burnRate: number;
  runway: number;
  totalBalance: number;
  growthRate: number;
  profitMargin: number;
  businessStage: string;
  healthScore: number;
}

interface FundingRecommendation {
  type: string;
  title: string;
  amount: string;
  requirements: string[];
  pros: string[];
  cons: string[];
  matchScore: number;
  reasoning: string;
  nextSteps?: string[];
}

interface FundingTip {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'long-term';
}

export function FundingInsights() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<FundingMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<FundingRecommendation[]>([]);
  const [tips, setTips] = useState<FundingTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realFundingOptions, setRealFundingOptions] = useState<any[]>([]);

  const fetchFundingAnalysis = async () => {
    try {
      setRefreshing(true);
      
      // Get the current session to ensure we have a valid token
      const { data: { session } } = await supabase.auth.getSession();
      
      // Fetch AI-powered analysis - the edge function will handle auth
      const { data, error } = await supabase.functions.invoke('ai-funding-analysis', {
        body: { userId: user?.id || session?.user?.id },
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });

      if (error) {
        console.error('Funding analysis error:', error);
        // Don't throw, continue with default data
      }

      if (data) {
        setMetrics(data.metrics);
        setRecommendations(data.recommendations || []);
        setTips(data.tips || []);
        
        // Fetch real funding options based on business stage
        if (data.metrics?.businessStage) {
          const searchQuery = `${data.metrics.businessStage} business funding ${data.metrics.monthlyRevenue > 50000 ? 'venture capital series A' : data.metrics.monthlyRevenue > 10000 ? 'angel investment seed' : 'small business loans microloans'} 2025`;
          
          const { data: searchData } = await supabase.functions.invoke('funding-search', {
            body: { 
              query: searchQuery, 
              businessStage: data.metrics.businessStage 
            }
          });
          
          if (searchData?.fundingOptions) {
            setRealFundingOptions(searchData.fundingOptions);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching funding analysis:', error);
      toast.error("Using default funding analysis. Connect your bank accounts for personalized recommendations.");
      
      // Set default values on error but continue to show UI
      setMetrics({
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        burnRate: 0,
        runway: 0,
        totalBalance: 0,
        growthRate: 0,
        profitMargin: 0,
        businessStage: 'early',
        healthScore: 50
      });
      
      // Set some default recommendations
      setRecommendations([
        {
          type: 'Bootstrap',
          title: 'Start with Self-Funding',
          amount: '$5K - $25K',
          requirements: ['Personal savings', 'Side income', 'Credit lines'],
          pros: ['Full control', 'No dilution', 'Learn by doing'],
          cons: ['Limited resources', 'Slower growth', 'Personal risk'],
          matchScore: 80,
          reasoning: 'Connect your bank accounts via Plaid to get personalized funding recommendations based on your actual financial data.'
        }
      ]);
      
      // Still try to fetch generic funding options
      try {
        const { data: searchData } = await supabase.functions.invoke('funding-search', {
          body: { 
            query: 'small business funding options 2025', 
            businessStage: 'early' 
          }
        });
        
        if (searchData?.fundingOptions) {
          setRealFundingOptions(searchData.fundingOptions);
        }
      } catch (searchError) {
        console.error('Error fetching funding search:', searchError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFundingAnalysis();
  }, [user]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return <AlertCircle className="h-3 w-3" />;
      case 'short-term': return <Calendar className="h-3 w-3" />;
      case 'long-term': return <Target className="h-3 w-3" />;
      default: return null;
    }
  };

  const getFundingTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('venture') || type.toLowerCase().includes('vc')) {
      return <Rocket className="h-5 w-5" />;
    }
    if (type.toLowerCase().includes('angel')) {
      return <Users className="h-5 w-5" />;
    }
    if (type.toLowerCase().includes('bank') || type.toLowerCase().includes('loan')) {
      return <Building className="h-5 w-5" />;
    }
    if (type.toLowerCase().includes('revenue')) {
      return <TrendingUp className="h-5 w-5" />;
    }
    return <Banknote className="h-5 w-5" />;
  };

  const handleLearnMore = (type: string) => {
    const urls: { [key: string]: string } = {
      'venture capital': 'https://www.investopedia.com/terms/v/venturecapital.asp',
      'angel': 'https://www.investopedia.com/terms/a/angelinvestor.asp',
      'revenue-based': 'https://www.investopedia.com/revenue-based-financing-5217851',
      'bank loan': 'https://www.sba.gov/funding-programs/loans',
      'bootstrap': 'https://www.investopedia.com/terms/b/bootstrap.asp'
    };
    
    const url = Object.entries(urls).find(([key]) => 
      type.toLowerCase().includes(key)
    )?.[1] || 'https://www.sba.gov/business-guide/plan-your-business/fund-your-business';
    
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Funding Readiness Score */}
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Funding Readiness Score
              </CardTitle>
              <CardDescription>
                AI-powered analysis based on your financial data from Plaid
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFundingAnalysis}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Health Score */}
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{metrics.healthScore}%</span>
                  <Badge variant="outline" className={getHealthColor(metrics.healthScore)}>
                    {getHealthLabel(metrics.healthScore)}
                  </Badge>
                </div>
                <Progress value={metrics.healthScore} className="h-3" />
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <DollarSign className="h-3 w-3" />
                  Monthly Revenue
                </div>
                <p className="text-xl font-semibold">
                  ${metrics.monthlyRevenue.toLocaleString()}
                </p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <TrendingDown className="h-3 w-3" />
                  Burn Rate
                </div>
                <p className="text-xl font-semibold">
                  ${metrics.burnRate.toLocaleString()}
                </p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Calendar className="h-3 w-3" />
                  Runway
                </div>
                <p className="text-xl font-semibold">
                  {metrics.runway} months
                </p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  {metrics.growthRate >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  Growth Rate
                </div>
                <p className="text-xl font-semibold">
                  {metrics.growthRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Business Stage */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Business Stage</span>
              <Badge variant="secondary" className="capitalize">
                {metrics.businessStage}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funding Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Personalized Funding Options
          </CardTitle>
          <CardDescription>
            AI-recommended funding sources based on your current metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Options</TabsTrigger>
              <TabsTrigger value="best">Best Matches</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4 mt-4">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getFundingTypeIcon(rec.type)}
                          <div>
                            <CardTitle className="text-lg">{rec.title}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {rec.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {rec.matchScore}%
                          </div>
                          <p className="text-xs text-muted-foreground">Match Score</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <Banknote className="h-4 w-4" />
                        {rec.amount}
                      </div>
                      
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>{rec.reasoning}</AlertDescription>
                      </Alert>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Pros
                          </p>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            {rec.pros.map((pro, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-green-500 mt-1">•</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" />
                            Cons
                          </p>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            {rec.cons.map((con, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-red-500 mt-1">•</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-2">Requirements</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.requirements.map((req, i) => (
                            <Badge key={i} variant="secondary">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleLearnMore(rec.type)}
                      >
                        Learn More
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Recommendations Available</AlertTitle>
                  <AlertDescription>
                    Connect your bank accounts via Plaid to get personalized funding recommendations
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="best" className="space-y-4 mt-4">
              {recommendations
                .filter(rec => rec.matchScore >= 70)
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 3)
                .map((rec, index) => (
                  <Card key={index} className="border-2 border-primary/50 bg-primary/5">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {getFundingTypeIcon(rec.type)}
                          {rec.title}
                        </CardTitle>
                        <Badge className="bg-primary">
                          {rec.matchScore}% Match
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{rec.reasoning}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{rec.amount}</span>
                        <Button size="sm" onClick={() => handleLearnMore(rec.type)}>
                          Get Started
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="comparison" className="mt-4">
              <ScrollArea className="w-full">
                <div className="min-w-[600px]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Funding Type</th>
                        <th className="text-left p-2">Amount</th>
                        <th className="text-left p-2">Match Score</th>
                        <th className="text-left p-2">Key Benefit</th>
                        <th className="text-left p-2">Main Drawback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendations.map((rec, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {getFundingTypeIcon(rec.type)}
                              <span className="font-medium">{rec.type}</span>
                            </div>
                          </td>
                          <td className="p-2">{rec.amount}</td>
                          <td className="p-2">
                            <Badge variant={rec.matchScore >= 70 ? "default" : "secondary"}>
                              {rec.matchScore}%
                            </Badge>
                          </td>
                          <td className="p-2 text-sm text-green-600">
                            {rec.pros[0]}
                          </td>
                          <td className="p-2 text-sm text-red-600">
                            {rec.cons[0]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Real Funding Options from Web */}
      {realFundingOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-blue-500" />
              Real Funding Sources Available Now
            </CardTitle>
            <CardDescription>
              Current funding programs and platforms actively accepting applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {realFundingOptions.map((option, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{option.name}</CardTitle>
                        {option.source && (
                          <Badge variant="outline" className="mt-1">
                            {option.source}
                          </Badge>
                        )}
                      </div>
                      <Badge className="bg-blue-500">
                        {option.amount}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Requirements:</p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {option.requirements?.map((req: string, i: number) => (
                          <li key={i} className="flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {option.url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(option.url, '_blank')}
                      >
                        Apply Now
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI-Powered Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI-Powered Tips to Improve Funding Eligibility
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your financial patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tips.length > 0 ? (
              tips.map((tip, index) => (
                <Alert key={index} className="border-l-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getTimeframeIcon(tip.timeframe)}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTitle className="text-base">{tip.title}</AlertTitle>
                        <Badge variant={getImpactColor(tip.impact)}>
                          {tip.impact} impact
                        </Badge>
                        <Badge variant="outline">
                          {tip.timeframe}
                        </Badge>
                      </div>
                      <AlertDescription>{tip.description}</AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))
            ) : (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Connect Your Accounts</AlertTitle>
                <AlertDescription>
                  Link your bank accounts via Plaid to receive AI-powered tips tailored to your business
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
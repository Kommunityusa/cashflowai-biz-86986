import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  TrendingUp,
  Building2,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Calculator,
  Briefcase,
  PieChart,
  Target,
} from "lucide-react";

interface FundingMetrics {
  monthlyRevenue: number;
  monthlyBurnRate: number;
  runwayMonths: number;
  profitMargin: number;
  debtToEquityRatio: number;
  cashFlow: number;
  growthRate: number;
  customerAcquisitionCost: number;
  recurringRevenue: number;
}

interface FundingRecommendation {
  type: string;
  amount: { min: number; max: number };
  probability: number;
  requirements: string[];
  pros: string[];
  cons: string[];
  nextSteps: string[];
}

export function FundingInsights() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<FundingMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<FundingRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      calculateFundingMetrics();
    }
  }, [user]);

  const calculateFundingMetrics = async () => {
    setLoading(true);

    // Get last 6 months of transactions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user?.id)
      .gte("transaction_date", sixMonthsAgo.toISOString().split("T")[0])
      .order("transaction_date");

    if (transactions) {
      // Calculate monthly averages
      const monthlyData = new Map<string, { income: number; expenses: number }>();
      
      transactions.forEach((t) => {
        const monthKey = t.transaction_date.substring(0, 7);
        const current = monthlyData.get(monthKey) || { income: 0, expenses: 0 };
        
        if (t.type === "income") {
          current.income += Number(t.amount);
        } else {
          current.expenses += Number(t.amount);
        }
        
        monthlyData.set(monthKey, current);
      });

      const monthlyValues = Array.from(monthlyData.values());
      const avgMonthlyRevenue = monthlyValues.reduce((sum, m) => sum + m.income, 0) / monthlyValues.length || 0;
      const avgMonthlyExpenses = monthlyValues.reduce((sum, m) => sum + m.expenses, 0) / monthlyValues.length || 0;
      
      // Calculate growth rate
      const sortedMonths = Array.from(monthlyData.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      let growthRate = 0;
      if (sortedMonths.length >= 2) {
        const firstMonth = sortedMonths[0][1].income;
        const lastMonth = sortedMonths[sortedMonths.length - 1][1].income;
        if (firstMonth > 0) {
          growthRate = ((lastMonth - firstMonth) / firstMonth) * 100;
        }
      }

      // Get bank account balance for runway calculation
      const { data: bankAccounts } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("user_id", user?.id)
        .eq("is_active", true);

      const totalBalance = bankAccounts?.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0) || 0;
      const burnRate = avgMonthlyExpenses - avgMonthlyRevenue;
      const runwayMonths = burnRate > 0 ? totalBalance / burnRate : 999;

      // Calculate recurring revenue (simplified - looks for recurring patterns)
      const recurringPatterns = new Map<string, number>();
      transactions
        .filter(t => t.type === "income")
        .forEach(t => {
          const key = `${t.vendor_name}-${t.amount}`;
          recurringPatterns.set(key, (recurringPatterns.get(key) || 0) + 1);
        });
      
      const recurringRevenue = Array.from(recurringPatterns.entries())
        .filter(([_, count]) => count >= 2)
        .reduce((sum, [key, _]) => {
          const amount = parseFloat(key.split('-').pop() || "0");
          return sum + amount;
        }, 0) / 6; // Monthly average

      const calculatedMetrics: FundingMetrics = {
        monthlyRevenue: avgMonthlyRevenue,
        monthlyBurnRate: burnRate,
        runwayMonths: Math.min(runwayMonths, 999),
        profitMargin: avgMonthlyRevenue > 0 ? ((avgMonthlyRevenue - avgMonthlyExpenses) / avgMonthlyRevenue) * 100 : 0,
        debtToEquityRatio: 0, // Simplified for now
        cashFlow: avgMonthlyRevenue - avgMonthlyExpenses,
        growthRate,
        customerAcquisitionCost: 0, // Would need more data
        recurringRevenue,
      };

      setMetrics(calculatedMetrics);
      generateRecommendations(calculatedMetrics);
    }

    setLoading(false);
  };

  const generateRecommendations = (metrics: FundingMetrics) => {
    const recommendations: FundingRecommendation[] = [];

    // Bootstrap/Friends & Family
    if (metrics.monthlyRevenue < 10000) {
      recommendations.push({
        type: "Bootstrap / Friends & Family",
        amount: { min: 10000, max: 100000 },
        probability: 85,
        requirements: [
          "Personal network",
          "Clear business plan",
          "MVP or prototype"
        ],
        pros: [
          "Maintain full control",
          "No equity dilution",
          "Quick access to funds"
        ],
        cons: [
          "Limited capital",
          "Personal relationships at risk",
          "Slower growth potential"
        ],
        nextSteps: [
          "Prepare a simple business plan",
          "Create financial projections",
          "Identify potential investors in your network"
        ]
      });
    }

    // Angel Investment
    if (metrics.monthlyRevenue >= 5000 && metrics.growthRate > 10) {
      recommendations.push({
        type: "Angel Investment",
        amount: { min: 25000, max: 500000 },
        probability: metrics.growthRate > 20 ? 65 : 45,
        requirements: [
          "Proven traction",
          "Scalable business model",
          "Strong founding team",
          `Current MRR: $${metrics.monthlyRevenue.toFixed(0)}`
        ],
        pros: [
          "Mentorship and guidance",
          "Industry connections",
          "Validation of business model"
        ],
        cons: [
          "Equity dilution (10-25%)",
          "Loss of some control",
          "Investor expectations"
        ],
        nextSteps: [
          "Prepare pitch deck",
          "Join angel investor networks",
          "Attend startup events",
          "Refine financial projections"
        ]
      });
    }

    // Venture Capital
    if (metrics.monthlyRevenue >= 50000 && metrics.growthRate > 20) {
      recommendations.push({
        type: "Venture Capital (Seed)",
        amount: { min: 500000, max: 2000000 },
        probability: metrics.growthRate > 50 ? 40 : 20,
        requirements: [
          `Monthly revenue: $${metrics.monthlyRevenue.toFixed(0)}+`,
          "High growth potential",
          "Large addressable market",
          "Strong product-market fit"
        ],
        pros: [
          "Significant capital for scaling",
          "Strategic partnerships",
          "Credibility boost"
        ],
        cons: [
          "Significant equity dilution (15-30%)",
          "Board seats and control",
          "Pressure for rapid growth"
        ],
        nextSteps: [
          "Build relationships with VCs",
          "Demonstrate consistent growth",
          "Hire key team members",
          "Develop go-to-market strategy"
        ]
      });
    }

    // Revenue-Based Financing
    if (metrics.recurringRevenue > 10000) {
      recommendations.push({
        type: "Revenue-Based Financing",
        amount: { 
          min: metrics.recurringRevenue * 3, 
          max: metrics.recurringRevenue * 6 
        },
        probability: 70,
        requirements: [
          `Recurring revenue: $${metrics.recurringRevenue.toFixed(0)}/month`,
          "Predictable cash flow",
          "B2B or SaaS model preferred"
        ],
        pros: [
          "No equity dilution",
          "Flexible repayment",
          "Quick approval process"
        ],
        cons: [
          "Higher cost than traditional loans",
          "Reduces cash flow during repayment",
          "Revenue share (3-9%)"
        ],
        nextSteps: [
          "Document recurring revenue streams",
          "Prepare cash flow statements",
          "Research RBF providers"
        ]
      });
    }

    // Bank Loan / Line of Credit
    if (metrics.monthlyRevenue > 20000 && metrics.runwayMonths > 6) {
      recommendations.push({
        type: "Bank Loan / Line of Credit",
        amount: { 
          min: metrics.monthlyRevenue * 3, 
          max: metrics.monthlyRevenue * 12 
        },
        probability: metrics.profitMargin > 10 ? 60 : 30,
        requirements: [
          "Positive cash flow or clear path to it",
          "Good credit score",
          "Business operating 2+ years",
          "Collateral may be required"
        ],
        pros: [
          "Lower interest rates",
          "No equity dilution",
          "Build business credit"
        ],
        cons: [
          "Personal guarantee often required",
          "Strict qualification criteria",
          "Regular repayments regardless of revenue"
        ],
        nextSteps: [
          "Prepare detailed financial statements",
          "Build relationship with bank",
          "Improve business credit score"
        ]
      });
    }

    setRecommendations(recommendations);
  };

  const getHealthScore = () => {
    if (!metrics) return 0;
    
    let score = 50; // Base score
    
    // Revenue growth
    if (metrics.growthRate > 20) score += 20;
    else if (metrics.growthRate > 10) score += 10;
    else if (metrics.growthRate < 0) score -= 10;
    
    // Profitability
    if (metrics.profitMargin > 20) score += 15;
    else if (metrics.profitMargin > 0) score += 5;
    else score -= 10;
    
    // Runway
    if (metrics.runwayMonths > 12) score += 15;
    else if (metrics.runwayMonths > 6) score += 5;
    else score -= 15;
    
    return Math.min(Math.max(score, 0), 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const healthScore = getHealthScore();

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Funding Readiness Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Health</span>
                <span className="text-sm font-bold">{healthScore}%</span>
              </div>
              <Progress value={healthScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {healthScore >= 70 ? "Excellent funding position" : 
                 healthScore >= 50 ? "Good, but room for improvement" : 
                 "Focus on improving metrics before seeking funding"}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                <p className="text-lg font-semibold">
                  ${metrics?.monthlyRevenue.toFixed(0) || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Growth Rate</p>
                <p className="text-lg font-semibold flex items-center gap-1">
                  {metrics?.growthRate.toFixed(1) || 0}%
                  {(metrics?.growthRate || 0) > 0 ? 
                    <TrendingUp className="h-4 w-4 text-green-500" /> : 
                    <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Runway</p>
                <p className="text-lg font-semibold">
                  {metrics?.runwayMonths > 100 ? "∞" : `${metrics?.runwayMonths.toFixed(0)} months`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Burn Rate</p>
                <p className="text-lg font-semibold text-red-600">
                  ${Math.abs(metrics?.monthlyBurnRate || 0).toFixed(0)}/mo
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Profit Margin</p>
                <p className="text-lg font-semibold">
                  {metrics?.profitMargin.toFixed(1) || 0}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recurring Revenue</p>
                <p className="text-lg font-semibold">
                  ${metrics?.recurringRevenue.toFixed(0) || 0}/mo
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funding Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Funding Options Available to You
        </h3>
        
        {recommendations.map((rec, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{rec.type}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      ${(rec.amount.min / 1000).toFixed(0)}k - ${(rec.amount.max / 1000).toFixed(0)}k
                    </Badge>
                    <Badge 
                      variant={rec.probability >= 60 ? "default" : rec.probability >= 40 ? "secondary" : "outline"}
                    >
                      {rec.probability}% Success Rate
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Typical Range</p>
                  <p className="text-sm font-semibold">
                    ${rec.amount.min.toLocaleString()} - ${rec.amount.max.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Requirements</p>
                  <ul className="text-xs space-y-1">
                    {rec.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-green-600">Pros</p>
                  <ul className="text-xs space-y-1">
                    {rec.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-green-600">+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-red-600">Cons</p>
                  <ul className="text-xs space-y-1">
                    {rec.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-red-600">-</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Next Steps:</p>
                  <ul className="text-xs space-y-1">
                    {rec.nextSteps.map((step, i) => (
                      <li key={i}>• {step}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Improvement Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">Tips to Improve Funding Eligibility:</p>
          <ul className="text-sm space-y-1">
            {metrics && metrics.growthRate < 10 && (
              <li>• Focus on increasing revenue growth rate above 10% monthly</li>
            )}
            {metrics && metrics.profitMargin < 0 && (
              <li>• Work towards positive profit margins by reducing expenses or increasing prices</li>
            )}
            {metrics && metrics.runwayMonths < 6 && (
              <li>• Extend runway to at least 6 months through cost reduction or revenue increase</li>
            )}
            {metrics && metrics.recurringRevenue < 5000 && (
              <li>• Build recurring revenue streams to demonstrate predictable income</li>
            )}
            <li>• Document all financial transactions and maintain clean books</li>
            <li>• Build relationships with potential investors before you need funding</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
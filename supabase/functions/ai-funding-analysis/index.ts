import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Funding Analysis - Request received');
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Authentication failed');
    }

    console.log('Fetching transactions for user:', user.id);

    // Fetch user's transactions from the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      throw transactionsError;
    }

    console.log(`Found ${transactions?.length || 0} transactions`);

    // Calculate metrics from actual transaction data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get last month for comparison
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // Filter transactions by month
    const currentMonthTransactions = transactions?.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }) || [];
    
    const lastMonthTransactions = transactions?.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    }) || [];

    // Calculate monthly revenue and expenses
    const currentMonthRevenue = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const currentMonthExpenses = Math.abs(currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0));
    
    const lastMonthRevenue = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate total balance (all income - all expenses)
    const totalIncome = transactions?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    
    const totalExpenses = Math.abs(transactions?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0);
    
    const totalBalance = totalIncome - totalExpenses;

    // Calculate burn rate (monthly expenses)
    const burnRate = currentMonthExpenses;
    
    // Calculate runway (months of operation left based on current balance and burn rate)
    const runway = burnRate > 0 ? Math.floor(totalBalance / burnRate) : 999;
    
    // Calculate growth rate
    const growthRate = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;
    
    // Calculate profit margin
    const profitMargin = currentMonthRevenue > 0 
      ? ((currentMonthRevenue - currentMonthExpenses) / currentMonthRevenue) * 100 
      : 0;

    // Determine business stage based on revenue
    let businessStage = 'early';
    if (currentMonthRevenue > 100000) {
      businessStage = 'growth';
    } else if (currentMonthRevenue > 50000) {
      businessStage = 'scaling';
    } else if (currentMonthRevenue > 10000) {
      businessStage = 'developing';
    }

    // Calculate health score (0-100)
    let healthScore = 50;
    if (profitMargin > 0) healthScore += 20;
    if (growthRate > 10) healthScore += 15;
    if (runway > 12) healthScore += 15;
    if (burnRate < currentMonthRevenue * 0.8) healthScore += 10;
    healthScore = Math.min(100, Math.max(0, healthScore));

    const metrics = {
      monthlyRevenue: Math.round(currentMonthRevenue),
      monthlyExpenses: Math.round(currentMonthExpenses),
      burnRate: Math.round(burnRate),
      runway: runway > 999 ? 999 : runway,
      totalBalance: Math.round(totalBalance),
      growthRate: Math.round(growthRate * 10) / 10,
      profitMargin: Math.round(profitMargin * 10) / 10,
      businessStage,
      healthScore: Math.round(healthScore)
    };

    console.log('Calculated metrics:', metrics);

    // Generate dynamic recommendations based on actual metrics
    const recommendations = [];

    // Angel Investment recommendation
    if (metrics.monthlyRevenue >= 25000 && metrics.growthRate > 5) {
      recommendations.push({
        type: 'Angel Investment',
        title: 'Angel Investors & Seed Funding',
        amount: `$${Math.round(metrics.monthlyRevenue * 5 / 1000) * 1000} - $${Math.round(metrics.monthlyRevenue * 20 / 1000) * 1000}`,
        requirements: [
          `Monthly revenue: $${metrics.monthlyRevenue.toLocaleString()}+ ✓`,
          metrics.growthRate > 10 ? 'Demonstrated growth trajectory ✓' : 'Need stronger growth trajectory',
          'Scalable business model',
          'Strong founding team'
        ],
        pros: [
          'Strategic mentorship',
          'Industry connections',
          'Credibility boost',
          'Follow-on funding potential'
        ],
        cons: [
          '15-25% equity dilution',
          'Board seat requirements',
          'Regular reporting obligations',
          'Potential loss of control'
        ],
        matchScore: Math.min(95, Math.round(50 + metrics.growthRate * 2 + (metrics.monthlyRevenue / 1000))),
        reasoning: `With $${(metrics.monthlyRevenue / 1000).toFixed(0)}K monthly revenue and ${metrics.growthRate}% growth, you're ${metrics.growthRate > 15 ? 'perfectly positioned' : 'approaching readiness'} for angel investment.`
      });
    }

    // Revenue-Based Financing
    if (metrics.monthlyRevenue >= 10000) {
      const rbfAmount = metrics.monthlyRevenue * 3;
      recommendations.push({
        type: 'Revenue-Based Financing',
        title: 'Revenue-Based Capital',
        amount: `$${Math.round(rbfAmount / 1000) * 1000} - $${Math.round(rbfAmount * 2 / 1000) * 1000}`,
        requirements: [
          `Consistent monthly revenue: $${metrics.monthlyRevenue.toLocaleString()} ✓`,
          'B2B or SaaS business model preferred',
          metrics.profitMargin > 0 ? 'Positive unit economics ✓' : 'Need positive unit economics',
          '6+ months of revenue history'
        ],
        pros: [
          'No equity dilution',
          'Flexible repayment terms',
          'Quick approval (1-2 weeks)',
          'No personal guarantee'
        ],
        cons: [
          'Revenue share 3-9% until repaid',
          'Higher cost than traditional loans',
          'Reduces monthly cash flow',
          'Revenue reporting requirements'
        ],
        matchScore: Math.min(90, Math.round(40 + (metrics.monthlyRevenue / 500) + (metrics.profitMargin > 0 ? 20 : 0))),
        reasoning: `Based on your $${(metrics.monthlyRevenue / 1000).toFixed(0)}K/month revenue, you could access up to $${Math.round(rbfAmount * 2 / 1000)}K in RBF without giving up equity.`
      });
    }

    // SBA Loan
    if (metrics.monthlyRevenue >= 8333) { // $100K annual
      recommendations.push({
        type: 'SBA 7(a) Loan',
        title: 'Small Business Administration Loan',
        amount: `$100K - $${Math.round(metrics.monthlyRevenue * 12 / 1000) * 1000}`,
        requirements: [
          'Minimum credit score 680',
          'Business operating 2+ years',
          `Annual revenue $${Math.round(metrics.monthlyRevenue * 12 / 1000)}K+ ✓`,
          'Collateral may be required'
        ],
        pros: [
          'Low interest rates (11.5-14%)',
          'Long repayment terms (10 years)',
          'No equity dilution',
          'Build business credit'
        ],
        cons: [
          'Personal guarantee required',
          'Lengthy application process',
          'Strict documentation requirements',
          'Fixed monthly payments'
        ],
        matchScore: Math.min(85, Math.round(30 + (metrics.monthlyRevenue / 300) + (metrics.profitMargin > 0 ? 15 : 0))),
        reasoning: `Your revenue of $${Math.round(metrics.monthlyRevenue * 12 / 1000)}K annually qualifies you for SBA loans with favorable terms.`
      });
    }

    // Bootstrap recommendation for early stage
    if (metrics.monthlyRevenue < 25000 || recommendations.length === 0) {
      recommendations.push({
        type: 'Bootstrap',
        title: 'Self-Funded Growth',
        amount: '$10K - $50K',
        requirements: [
          'Personal savings or revenue reinvestment',
          'Focus on profitability',
          'Lean operations'
        ],
        pros: [
          'Full control maintained',
          'No dilution',
          'Learn by doing',
          'No debt obligations'
        ],
        cons: [
          'Limited resources',
          'Slower growth potential',
          'Personal financial risk'
        ],
        matchScore: 75,
        reasoning: `With $${(metrics.monthlyRevenue / 1000).toFixed(0)}K monthly revenue, focus on achieving profitability and building a track record before seeking external funding.`
      });
    }

    // Generate dynamic tips based on actual metrics
    const tips = [];

    // Burn rate optimization tip
    if (metrics.burnRate > metrics.monthlyRevenue * 0.9) {
      tips.push({
        title: 'Urgent: Reduce Burn Rate',
        description: `Your burn rate of $${(metrics.burnRate / 1000).toFixed(0)}K exceeds 90% of revenue. Cut non-essential expenses immediately to extend runway and improve fundability.`,
        impact: 'high' as const,
        timeframe: 'immediate' as const
      });
    } else if (metrics.burnRate > metrics.monthlyRevenue * 0.7) {
      tips.push({
        title: 'Optimize Operating Expenses',
        description: `Reduce burn rate from $${(metrics.burnRate / 1000).toFixed(0)}K to below $${(metrics.monthlyRevenue * 0.7 / 1000).toFixed(0)}K through cost optimization to improve your funding position.`,
        impact: 'high' as const,
        timeframe: 'immediate' as const
      });
    }

    // Growth acceleration tip
    if (metrics.growthRate < 10) {
      tips.push({
        title: 'Accelerate Revenue Growth',
        description: `Your ${metrics.growthRate}% growth rate is below investor expectations. Target 15-20% monthly growth through improved sales and marketing to unlock better funding options.`,
        impact: 'high' as const,
        timeframe: 'short-term' as const
      });
    }

    // Profitability tip
    if (metrics.profitMargin < 0) {
      tips.push({
        title: 'Path to Profitability',
        description: `Currently operating at a ${Math.abs(metrics.profitMargin)}% loss. Create a clear path to profitability within 6-12 months to attract investors and lenders.`,
        impact: 'high' as const,
        timeframe: 'short-term' as const
      });
    }

    // Financial documentation tip
    tips.push({
      title: 'Prepare Funding Documentation',
      description: 'Organize your financial statements, create a pitch deck, and prepare 12-24 month projections. Most investors require comprehensive documentation.',
      impact: 'medium' as const,
      timeframe: 'immediate' as const
    });

    return new Response(JSON.stringify({
      metrics,
      recommendations,
      tips
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Funding analysis error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return minimal data on error
    return new Response(JSON.stringify({ 
      error: errorMessage,
      metrics: {
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        burnRate: 0,
        runway: 0,
        totalBalance: 0,
        growthRate: 0,
        profitMargin: 0,
        businessStage: 'early',
        healthScore: 0
      },
      recommendations: [
        {
          type: 'Bootstrap',
          title: 'Start with Self-Funding',
          amount: 'Variable',
          requirements: ['Add transactions to see personalized recommendations'],
          pros: ['Full control', 'No dilution'],
          cons: ['Limited resources'],
          matchScore: 50,
          reasoning: 'Add your financial data to get personalized funding recommendations.'
        }
      ],
      tips: [
        {
          title: 'Add Transaction Data',
          description: 'Import or manually add your income and expense transactions to get accurate funding analysis and recommendations.',
          impact: 'high' as const,
          timeframe: 'immediate' as const
        }
      ]
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
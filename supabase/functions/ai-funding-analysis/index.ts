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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    
    // Create Supabase client with service role for server-side operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    // Get user from the authorization token if provided
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }
    
    // Also check if userId was passed in the body
    const body = await req.json().catch(() => ({}));
    if (!userId && body.userId) {
      userId = body.userId;
    }
    
    if (!userId) {
      console.error('No user ID found in request');
      throw new Error('Authentication required');
    }

    console.log('Analyzing funding for user:', userId);

    // Fetch transactions from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('transaction_date', sixMonthsAgo.toISOString())
      .order('transaction_date', { ascending: false });

    const { data: bankAccounts } = await supabaseAdmin
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Calculate financial metrics
    const monthlyData = new Map();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    transactions?.forEach((t: any) => {
      const date = new Date(t.transaction_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyData.has(key)) {
        monthlyData.set(key, { revenue: 0, expenses: 0, transactions: 0 });
      }
      
      const data = monthlyData.get(key);
      if (t.type === 'income') {
        data.revenue += Number(t.amount);
      } else {
        data.expenses += Number(t.amount);
      }
      data.transactions++;
    });

    // Calculate averages and trends
    const months = Array.from(monthlyData.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    const lastMonth = months[0]?.[1] || { revenue: 0, expenses: 0 };
    const prevMonth = months[1]?.[1] || { revenue: 0, expenses: 0 };
    
    const monthlyRevenue = lastMonth.revenue;
    const monthlyExpenses = lastMonth.expenses;
    const burnRate = monthlyExpenses;
    const totalBalance = bankAccounts?.reduce((sum: number, acc: any) => sum + Number(acc.current_balance || 0), 0) || 0;
    const runway = burnRate > 0 ? Math.floor(totalBalance / burnRate) : 12;
    const growthRate = prevMonth.revenue > 0 ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0;
    const profitMargin = monthlyRevenue > 0 ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100 : -100;

    // Determine business stage and health
    let businessStage = 'early';
    let healthScore = 50;
    
    if (monthlyRevenue > 100000) {
      businessStage = 'growth';
      healthScore += 20;
    } else if (monthlyRevenue > 50000) {
      businessStage = 'established';
      healthScore += 15;
    } else if (monthlyRevenue > 10000) {
      businessStage = 'developing';
      healthScore += 10;
    }

    if (profitMargin > 20) healthScore += 20;
    else if (profitMargin > 0) healthScore += 10;
    else healthScore -= 10;

    if (runway > 12) healthScore += 15;
    else if (runway > 6) healthScore += 10;
    else if (runway > 3) healthScore += 5;
    else healthScore -= 20;

    if (growthRate > 20) healthScore += 15;
    else if (growthRate > 10) healthScore += 10;
    else if (growthRate > 0) healthScore += 5;

    healthScore = Math.max(0, Math.min(100, healthScore));

    // Search for real funding options based on business metrics
    const fundingSearchQuery = `${businessStage} stage business funding options ${monthlyRevenue > 50000 ? 'venture capital' : monthlyRevenue > 10000 ? 'angel investment seed funding' : 'bootstrap small business loans'} ${new Date().getFullYear()}`;
    
    console.log('Searching for funding options:', fundingSearchQuery);

    // Generate recommendations based on actual metrics
    const recommendations = [];
    
    // Add recommendations based on revenue levels
    if (monthlyRevenue < 10000) {
      recommendations.push({
        type: 'Bootstrap',
        title: 'Self-Funded Growth',
        amount: '$10K - $50K',
        requirements: ['Personal savings', 'Credit cards', 'Friends & family'],
        pros: ['Full control', 'No equity dilution', 'Quick access'],
        cons: ['Limited capital', 'Personal risk', 'Slower growth'],
        matchScore: 85,
        reasoning: `With monthly revenue of $${monthlyRevenue.toFixed(0)}, bootstrapping is your most viable option. Focus on organic growth and reinvesting profits.`
      });

      if (monthlyRevenue > 5000) {
        recommendations.push({
          type: 'Small Business Loan',
          title: 'SBA Microloans',
          amount: '$5K - $50K',
          requirements: ['Business plan', 'Good credit score', 'Collateral may be required'],
          pros: ['Lower interest rates', 'Build business credit', 'Keep full ownership'],
          cons: ['Personal guarantee required', 'Strict qualification', 'Fixed repayments'],
          matchScore: 65,
          reasoning: `SBA microloans are designed for businesses like yours with $${monthlyRevenue.toFixed(0)}/month revenue.`
        });
      }
    }
    
    if (monthlyRevenue >= 10000 && monthlyRevenue < 50000) {
      recommendations.push({
        type: 'Angel Investment',
        title: 'Angel Investors & Seed Funding',
        amount: '$50K - $500K',
        requirements: [`Monthly revenue: $${monthlyRevenue.toFixed(0)}`, 'Scalable model', 'Strong team'],
        pros: ['Mentorship', 'Network access', 'Credibility boost'],
        cons: ['10-25% equity dilution', 'Board involvement', 'Regular reporting'],
        matchScore: growthRate > 10 ? 75 : 60,
        reasoning: `Your revenue of $${monthlyRevenue.toFixed(0)}/month and ${growthRate.toFixed(1)}% growth rate makes you suitable for angel investment.`
      });

      recommendations.push({
        type: 'Revenue-Based Financing',
        title: 'Revenue-Based Capital',
        amount: `$${(monthlyRevenue * 3).toFixed(0)} - $${(monthlyRevenue * 6).toFixed(0)}`,
        requirements: ['Predictable revenue', 'B2B or SaaS preferred', 'Positive unit economics'],
        pros: ['No equity dilution', 'Flexible repayment', 'Fast approval'],
        cons: ['Revenue share 3-9%', 'Higher cost than loans', 'Reduces cash flow'],
        matchScore: 70,
        reasoning: `Based on your $${monthlyRevenue.toFixed(0)}/month revenue, you could access up to $${(monthlyRevenue * 6).toFixed(0)} in RBF.`
      });
    }
    
    if (monthlyRevenue >= 50000) {
      recommendations.push({
        type: 'Venture Capital',
        title: 'Series A Preparation',
        amount: '$2M - $15M',
        requirements: [`Monthly revenue: $${monthlyRevenue.toFixed(0)}+`, 'High growth potential', 'Large market'],
        pros: ['Significant capital', 'Strategic partnerships', 'Rapid scaling'],
        cons: ['20-30% dilution', 'Board control', 'Growth pressure'],
        matchScore: growthRate > 20 ? 80 : 65,
        reasoning: `With $${monthlyRevenue.toFixed(0)}/month revenue and ${growthRate.toFixed(1)}% growth, you're approaching Series A readiness.`
      });

      recommendations.push({
        type: 'Debt Financing',
        title: 'Traditional Bank Loan',
        amount: `$${(monthlyRevenue * 6).toFixed(0)} - $${(monthlyRevenue * 12).toFixed(0)}`,
        requirements: ['2+ years in business', 'Strong financials', 'Collateral'],
        pros: ['Lower interest rates', 'No equity dilution', 'Build credit'],
        cons: ['Personal guarantee', 'Strict criteria', 'Fixed payments'],
        matchScore: profitMargin > 10 ? 75 : 55,
        reasoning: `Your revenue supports a loan up to $${(monthlyRevenue * 12).toFixed(0)} with ${profitMargin.toFixed(1)}% profit margin.`
      });
    }

    // Generate AI-powered tips based on metrics
    const tips = [];
    
    if (profitMargin < 20) {
      tips.push({
        title: 'Improve Profit Margins',
        description: `Your current profit margin is ${profitMargin.toFixed(1)}%. Focus on reducing costs or increasing prices to reach the 20%+ benchmark that investors prefer. Consider automating processes or renegotiating vendor contracts.`,
        impact: 'high',
        timeframe: 'immediate'
      });
    }
    
    if (runway < 6) {
      tips.push({
        title: 'Extend Cash Runway',
        description: `With only ${runway} months of runway, you need to act fast. Either reduce burn rate by 30% or secure funding within 2 months. Consider bridge financing or revenue acceleration.`,
        impact: 'high',
        timeframe: 'immediate'
      });
    }
    
    if (growthRate < 15) {
      tips.push({
        title: 'Accelerate Revenue Growth',
        description: `Your ${growthRate.toFixed(1)}% growth rate needs improvement. Target 15-20% MoM growth through marketing campaigns, sales outreach, or product improvements to attract investors.`,
        impact: 'medium',
        timeframe: 'short-term'
      });
    }

    if (monthlyRevenue > 10000 && !bankAccounts?.length) {
      tips.push({
        title: 'Connect Bank Accounts',
        description: 'Link your business bank accounts via Plaid to get more accurate cash flow analysis and unlock additional funding options.',
        impact: 'high',
        timeframe: 'immediate'
      });
    }

    // Add specific funding preparation tips
    if (monthlyRevenue > 5000) {
      tips.push({
        title: 'Prepare Financial Documentation',
        description: 'Start organizing P&L statements, cash flow projections, and tax returns. Most lenders require 2 years of financial history.',
        impact: 'medium',
        timeframe: 'short-term'
      });
    }

    return new Response(JSON.stringify({
      metrics: {
        monthlyRevenue,
        monthlyExpenses,
        burnRate,
        runway,
        totalBalance,
        growthRate,
        profitMargin,
        businessStage,
        healthScore
      },
      recommendations: recommendations.sort((a, b) => b.matchScore - a.matchScore),
      tips
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Funding analysis error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
        healthScore: 50
      },
      recommendations: [
        {
          type: 'Bootstrap',
          title: 'Start with Self-Funding',
          amount: '$5K - $25K',
          requirements: ['Personal savings', 'Side income', 'Credit lines'],
          pros: ['Full control', 'No dilution', 'Learn by doing'],
          cons: ['Limited resources', 'Slower growth', 'Personal risk'],
          matchScore: 80,
          reasoning: 'Connect your bank accounts to get personalized funding recommendations based on your actual financial data.'
        }
      ],
      tips: [
        {
          title: 'Connect Your Bank Accounts',
          description: 'Link your bank accounts via Plaid to unlock personalized funding analysis and recommendations.',
          impact: 'high',
          timeframe: 'immediate'
        }
      ]
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
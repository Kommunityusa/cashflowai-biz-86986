import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('No user found');

    // Fetch transactions from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: transactions } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('transaction_date', sixMonthsAgo.toISOString())
      .order('transaction_date', { ascending: false });

    const { data: bankAccounts } = await supabaseClient
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Calculate financial metrics
    const monthlyData = new Map();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    transactions?.forEach(t => {
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
    const totalBalance = bankAccounts?.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0) || 0;
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

    // Generate AI-powered insights and recommendations
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIKey) {
      // Return structured response without AI
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
        recommendations: generateDefaultRecommendations(healthScore, monthlyRevenue, businessStage),
        tips: generateDefaultTips(profitMargin, runway, growthRate)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const prompt = `
    Analyze this business's financial health and provide funding recommendations:
    
    Monthly Revenue: $${monthlyRevenue.toFixed(2)}
    Monthly Expenses: $${monthlyExpenses.toFixed(2)}
    Burn Rate: $${burnRate.toFixed(2)}
    Cash Balance: $${totalBalance.toFixed(2)}
    Runway: ${runway} months
    Growth Rate: ${growthRate.toFixed(1)}%
    Profit Margin: ${profitMargin.toFixed(1)}%
    Business Stage: ${businessStage}
    
    Provide a JSON response with:
    1. Three specific funding recommendations based on their metrics
    2. Three actionable tips to improve funding eligibility
    
    Format:
    {
      "recommendations": [
        {
          "type": "funding type",
          "title": "specific title",
          "amount": "recommended amount range",
          "requirements": ["requirement 1", "requirement 2"],
          "pros": ["pro 1", "pro 2"],
          "cons": ["con 1", "con 2"],
          "matchScore": 0-100,
          "reasoning": "why this fits their situation"
        }
      ],
      "tips": [
        {
          "title": "specific improvement",
          "description": "detailed actionable advice",
          "impact": "high/medium/low",
          "timeframe": "immediate/short-term/long-term"
        }
      ]
    }`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial advisor specializing in business funding. Provide practical, specific recommendations based on actual financial metrics.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    const aiData = await openAIResponse.json();
    const aiRecommendations = JSON.parse(aiData.choices[0].message.content);

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
      recommendations: aiRecommendations.recommendations,
      tips: aiRecommendations.tips
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Funding analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
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
      recommendations: [],
      tips: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateDefaultRecommendations(healthScore: number, revenue: number, stage: string) {
  const recommendations = [];
  
  if (healthScore > 70 && revenue > 50000) {
    recommendations.push({
      type: 'Venture Capital',
      title: 'Series A Funding',
      amount: '$2M - $15M',
      requirements: ['Strong growth metrics', 'Scalable business model'],
      pros: ['Large capital injection', 'Strategic partnerships'],
      cons: ['Equity dilution', 'Loss of control'],
      matchScore: healthScore,
      reasoning: 'Your strong metrics make you attractive to VCs'
    });
  }
  
  if (revenue > 10000) {
    recommendations.push({
      type: 'Revenue-Based Financing',
      title: 'RBF for Growth',
      amount: '$50K - $500K',
      requirements: ['Consistent revenue', 'Positive unit economics'],
      pros: ['No equity dilution', 'Flexible repayment'],
      cons: ['Higher cost than traditional loans', 'Revenue share required'],
      matchScore: Math.min(80, healthScore + 10),
      reasoning: 'Your consistent revenue makes RBF a good fit'
    });
  }
  
  recommendations.push({
    type: 'Bootstrap',
    title: 'Self-Funded Growth',
    amount: 'Reinvest profits',
    requirements: ['Positive cash flow', 'Disciplined spending'],
    pros: ['Full ownership', 'Complete control'],
    cons: ['Slower growth', 'Limited resources'],
    matchScore: Math.max(60, healthScore),
    reasoning: 'Maintain control while growing sustainably'
  });
  
  return recommendations;
}

function generateDefaultTips(profitMargin: number, runway: number, growthRate: number) {
  const tips = [];
  
  if (profitMargin < 20) {
    tips.push({
      title: 'Improve Profit Margins',
      description: 'Focus on reducing operational costs and optimizing pricing strategy to achieve 20%+ margins',
      impact: 'high',
      timeframe: 'short-term'
    });
  }
  
  if (runway < 6) {
    tips.push({
      title: 'Extend Cash Runway',
      description: 'Build at least 6-12 months of runway through cost reduction or revenue increase',
      impact: 'high',
      timeframe: 'immediate'
    });
  }
  
  if (growthRate < 10) {
    tips.push({
      title: 'Accelerate Growth',
      description: 'Target 10-20% month-over-month growth through marketing and sales initiatives',
      impact: 'medium',
      timeframe: 'short-term'
    });
  }
  
  return tips;
}
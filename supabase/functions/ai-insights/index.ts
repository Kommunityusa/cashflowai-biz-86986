import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { getErrorMessage } from '../_shared/error-handler.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AI Insights] Function called');
    
    // Check if Lovable AI API key is configured
    if (!LOVABLE_API_KEY) {
      console.log('[AI Insights] Lovable AI API key not configured');
      return new Response(
        JSON.stringify({
          insights: [
            {
              title: "AI Insights Not Configured",
              description: "Lovable AI is not configured. Please contact support if this persists."
            },
            {
              title: "Track Your Spending",
              description: "Start adding transactions to get detailed insights about your spending patterns and financial health."
            },
            {
              title: "Set Financial Goals",
              description: "Create budget categories and set spending limits to better manage your finances."
            }
          ]
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[AI Insights] No authorization header');
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[AI Insights] User authentication failed:', userError);
      throw new Error('Invalid user');
    }

    console.log('[AI Insights] Generating insights for user:', user.id);

    // Get user's recent transactions with proper category relationship
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories!transactions_category_id_fkey(name)
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(100);  // Get more transactions for better context
    
    if (transactionError) {
      console.error('[AI Insights] Failed to fetch transactions:', transactionError);
    }

    // Calculate spending patterns and trends
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentTransactions = transactions?.filter(t => 
      new Date(t.transaction_date) >= thirtyDaysAgo
    ) || [];
    
    const lastWeekTransactions = transactions?.filter(t => 
      new Date(t.transaction_date) >= sevenDaysAgo
    ) || [];
    
    const expensesByCategory = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc: Record<string, number>, t: any) => {
        const category = t.category?.name || 'Uncategorized';
        acc[category] = (acc[category] || 0) + Number(t.amount);
        return acc;
      }, {});

    const totalExpenses = Object.values(expensesByCategory).reduce((sum: number, amount: number) => sum + amount, 0);
    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    
    // Calculate week-over-week trends
    const lastWeekExpenses = lastWeekTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    
    const lastWeekIncome = lastWeekTransactions
      .filter(t => t.type === 'income')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    
    // Get most recent plaid account data for context
    const { data: plaidAccounts } = await supabase
      .from('plaid_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('last_sync', { ascending: false })
      .limit(5);
    
    const totalBalance = plaidAccounts?.reduce((sum: number, acc: any) => 
      sum + (acc.available_balance || acc.current_balance || 0), 0) || 0;

    // Build contextual prompt with recent Plaid data
    const weeklySpendingChange = lastWeekExpenses > 0 
      ? ((lastWeekExpenses - (totalExpenses * 7 / 30)) / (totalExpenses * 7 / 30) * 100).toFixed(1)
      : 0;
    
    const topCategories = Object.entries(expensesByCategory)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 3);
    
    const prompt = `Analyze this real-time financial data from the past 30 days and provide 3 specific, actionable insights:
    
    RECENT ACTIVITY (30 days):
    - Total Income: $${totalIncome.toFixed(2)}
    - Total Expenses: $${totalExpenses.toFixed(2)}
    - Net Cash Flow: $${(totalIncome - totalExpenses).toFixed(2)}
    
    LAST 7 DAYS:
    - Weekly Spending: $${lastWeekExpenses.toFixed(2)}
    - Weekly Income: $${lastWeekIncome.toFixed(2)}
    - Spending Trend: ${Number(weeklySpendingChange) > 0 ? '↑' : '↓'} ${Math.abs(Number(weeklySpendingChange))}%
    
    TOP SPENDING CATEGORIES:
    ${topCategories.map(([category, amount]: [string, number]) => 
      `- ${category}: $${amount.toFixed(2)} (${((amount / totalExpenses) * 100).toFixed(1)}% of expenses)`
    ).join('\n')}
    
    ${totalBalance > 0 ? `ACCOUNT BALANCE: $${totalBalance.toFixed(2)}` : ''}
    
    Provide insights that:
    1. Reflect the most recent week's activity and trends
    2. Identify specific opportunities to save money based on the spending categories
    3. Consider the current cash flow situation and account balance
    
    Respond with a JSON object containing an "insights" array with objects having "title" and "description" fields. Make insights specific and actionable based on the actual data.`;

    console.log('[AI Insights] Calling Lovable AI Gateway');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a financial advisor providing brief, actionable insights. Always respond with valid JSON format containing an "insights" array.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    console.log('[AI Insights] Lovable AI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[AI Insights] Lovable AI error:', errorData);
      
      // Return default insights if Lovable AI fails
      return new Response(
        JSON.stringify({
          insights: [
            {
              title: "Budget Analysis",
              description: totalExpenses > totalIncome 
                ? `You're spending $${(totalExpenses - totalIncome).toFixed(2)} more than you earn. Consider reducing expenses.`
                : `You're saving $${(totalIncome - totalExpenses).toFixed(2)}. Great job maintaining positive cash flow!`
            },
            {
              title: "Top Expense Category",
              description: Object.entries(expensesByCategory).length > 0
                ? `Your highest expense is ${Object.entries(expensesByCategory).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0][0]} at $${(Object.entries(expensesByCategory).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0][1] as number).toFixed(2)}`
                : "Start tracking expenses to identify spending patterns"
            },
            {
              title: "Financial Health",
              description: totalIncome === 0 
                ? "Add income transactions to get a complete financial picture"
                : `Your expense ratio is ${((totalExpenses / totalIncome) * 100).toFixed(0)}% of income`
            }
          ]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('[AI Insights] Lovable AI response received');
    
    // Parse the content - Lovable AI might return markdown-wrapped JSON
    let content;
    try {
      let responseContent = data.choices[0].message.content;
      
      // Remove markdown code blocks if present
      if (typeof responseContent === 'string') {
        responseContent = responseContent.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();
      }
      
      content = typeof responseContent === 'string' 
        ? JSON.parse(responseContent)
        : responseContent;
        
      // Ensure we have the expected structure
      if (!content.insights || !Array.isArray(content.insights)) {
        throw new Error('Invalid response structure');
      }
    } catch (parseError) {
      console.error('[AI Insights] Failed to parse Lovable AI response:', parseError);
      console.error('[AI Insights] Raw response:', data.choices[0].message.content);
      // Return default insights if parsing fails
      content = {
        insights: [
          {
            title: "Financial Overview",
            description: `Income: $${totalIncome.toFixed(2)}, Expenses: $${totalExpenses.toFixed(2)}`
          },
          {
            title: "Spending Analysis",
            description: "Review your spending patterns to identify areas for improvement"
          },
          {
            title: "Budget Recommendation",
            description: "Consider setting monthly budget limits for each category"
          }
        ]
      };
    }
    
    console.log('[AI Insights] Successfully generated insights');

    return new Response(
      JSON.stringify(content),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[AI Insights] Function error:', error);
    
    // Return generic insights on error
    return new Response(
      JSON.stringify({
        insights: [
          {
            title: "Service Temporarily Unavailable",
            description: "AI insights are temporarily unavailable. Please try again later."
          },
          {
            title: "Track Your Finances",
            description: "Continue adding transactions to build your financial history."
          },
          {
            title: "Manual Review",
            description: "Review your transactions manually to understand your spending patterns."
          }
        ]
      }),
      {
        status: 200, // Return 200 with fallback data instead of error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
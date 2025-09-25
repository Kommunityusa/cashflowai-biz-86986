import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { getErrorMessage } from '../_shared/error-handler.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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
    
    // Check if OpenAI API key is configured
    if (!openAIApiKey) {
      console.log('[AI Insights] OpenAI API key not configured');
      return new Response(
        JSON.stringify({
          insights: [
            {
              title: "AI Insights Not Configured",
              description: "OpenAI API key is missing. Please add OPENAI_API_KEY to your Supabase Edge Function secrets to enable AI-powered financial insights."
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

    // Get user's recent transactions
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(50);
    
    if (transactionError) {
      console.error('[AI Insights] Failed to fetch transactions:', transactionError);
    }

    // Calculate spending patterns
    const expensesByCategory = transactions
      ?.filter(t => t.type === 'expense')
      .reduce((acc: any, t: any) => {
        const category = t.categories?.name || 'Uncategorized';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {}) || {};

    const totalExpenses = Object.values(expensesByCategory).reduce((sum: any, amount: any) => sum + amount, 0) as number;
    const totalIncome = transactions
      ?.filter(t => t.type === 'income')
      .reduce((sum: any, t: any) => sum + t.amount, 0) || 0;

    const prompt = `Analyze the following financial data and provide 3 actionable insights:
    
    Total Income: $${totalIncome.toFixed(2)}
    Total Expenses: $${totalExpenses.toFixed(2)}
    Net: $${(totalIncome - totalExpenses).toFixed(2)}
    
    Expenses by Category:
    ${Object.entries(expensesByCategory)
      .map(([category, amount]: [string, any]) => `- ${category}: $${amount.toFixed(2)}`)
      .join('\n')}
    
    Respond with a JSON object containing an "insights" array with objects having "title" and "description" fields. Focus on spending patterns, potential savings, and financial health.`;

    console.log('[AI Insights] Calling OpenAI API with gpt-4o-mini model');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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

    console.log('[AI Insights] OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[AI Insights] OpenAI API error:', errorData);
      
      // Return default insights if OpenAI fails
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
    console.log('[AI Insights] OpenAI response received');
    
    // Parse the content - OpenAI might return markdown-wrapped JSON
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
      console.error('[AI Insights] Failed to parse OpenAI response:', parseError);
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
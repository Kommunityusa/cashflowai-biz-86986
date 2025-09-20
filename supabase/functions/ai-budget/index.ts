import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
      throw new Error('Invalid user');
    }

    // Get user's transactions from last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', user.id)
      .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false });

    // Calculate spending by category
    const categorySpending = new Map();
    const monthlySpending = new Map();
    
    transactions?.forEach(t => {
      if (t.type === 'expense') {
        const category = t.categories?.name || 'Uncategorized';
        categorySpending.set(category, (categorySpending.get(category) || 0) + Number(t.amount));
        
        const monthKey = new Date(t.transaction_date).toISOString().slice(0, 7);
        monthlySpending.set(monthKey, (monthlySpending.get(monthKey) || 0) + Number(t.amount));
      }
    });

    const avgMonthlySpending = Array.from(monthlySpending.values()).reduce((a, b) => a + b, 0) / monthlySpending.size || 0;
    
    const topCategories = Array.from(categorySpending.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`)
      .join('\n');

    const prompt = `Based on the following spending data, create a monthly budget recommendation:

Average Monthly Spending: $${avgMonthlySpending.toFixed(2)}

Top Spending Categories:
${topCategories}

Provide a JSON object with the following structure:
{
  "totalBudget": number (recommended total monthly budget),
  "categories": [
    { "name": string, "amount": number, "percentage": number }
  ],
  "recommendations": [
    string (specific actionable recommendation)
  ],
  "savingsGoal": number (recommended monthly savings)
}

Focus on realistic budgets and include at least 3 specific recommendations for reducing expenses.`;

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
            content: 'You are a financial advisor specializing in budget planning. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate budget');
    }

    const data = await response.json();
    const budget = JSON.parse(data.choices[0].message.content);
    
    console.log('Generated budget:', budget);

    return new Response(
      JSON.stringify(budget),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-budget function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
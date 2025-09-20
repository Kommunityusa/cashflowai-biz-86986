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

    // Get user's recent transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(50);

    // Calculate spending patterns
    const expensesByCategory = transactions
      ?.filter(t => t.type === 'expense')
      .reduce((acc: any, t: any) => {
        const category = t.categories?.name || 'Uncategorized';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {});

    const totalExpenses = Object.values(expensesByCategory || {}).reduce((sum: any, val: any) => sum + val, 0) as number;
    const totalIncome = transactions
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const prompt = `Based on the following financial data, provide 3 brief, actionable insights:
    
    Total Income: $${totalIncome.toFixed(2)}
    Total Expenses: $${totalExpenses.toFixed(2)}
    Net: $${(totalIncome - totalExpenses).toFixed(2)}
    
    Top expense categories:
    ${Object.entries(expensesByCategory || {})
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 5)
      .map(([cat, amount]: any) => `- ${cat}: $${amount.toFixed(2)} (${((amount/totalExpenses)*100).toFixed(1)}%)`)
      .join('\n')}
    
    Provide insights as a JSON array with objects containing "title" and "description" fields. Focus on spending patterns, potential savings, and financial health.`;

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
            content: 'You are a financial advisor providing brief, actionable insights. Always respond with valid JSON array format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate insights');
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    console.log('Generated insights:', content);

    return new Response(
      JSON.stringify(content),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
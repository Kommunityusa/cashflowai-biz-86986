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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('No user found');
    }

    console.log('Fetching financial data for user:', user.id);

    // Get user's transactions for current tax year
    const currentYear = new Date().getFullYear();
    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .gte('transaction_date', `${currentYear}-01-01`)
      .order('transaction_date', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      throw transactionsError;
    }

    // Calculate summary statistics
    const totalIncome = transactions
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    const totalExpenses = transactions
      ?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    const deductibleExpenses = transactions
      ?.filter(t => t.type === 'expense' && t.is_tax_deductible)
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // Get expense breakdown by category
    const expensesByCategory = transactions
      ?.filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.categories?.name || 'Uncategorized';
        const irsCode = t.categories?.irs_category_code || 'other';
        acc[category] = {
          amount: (acc[category]?.amount || 0) + Number(t.amount),
          irsCode,
          deductible: t.is_tax_deductible
        };
        return acc;
      }, {} as Record<string, any>);

    console.log('Calling Lovable AI for tax insights...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are a tax advisor specialized in small business taxes. Analyze this financial data and provide insights based on IRS Publication 334 (Tax Guide for Small Business).

Financial Summary for ${currentYear}:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Tax-Deductible Expenses: $${deductibleExpenses.toFixed(2)}

Expense Breakdown by IRS Category:
${Object.entries(expensesByCategory || {})
  .map(([category, data]: [string, any]) => 
    `- ${category} (IRS Code: ${data.irsCode}): $${data.amount.toFixed(2)}${data.deductible ? ' (Deductible)' : ''}`
  )
  .join('\n')}

Provide 3-5 specific, actionable tax insights for this small business based on:
1. Deduction opportunities they might be missing
2. Tax optimization strategies
3. Record-keeping recommendations
4. Quarterly tax planning suggestions
5. Year-end tax planning actions

Reference specific IRS Publication 334 sections where applicable. Keep insights concise and actionable.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a knowledgeable tax advisor specializing in small business taxes and IRS Publication 334. Provide clear, specific, and actionable advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices[0].message.content;

    console.log('Tax insights generated successfully');

    return new Response(
      JSON.stringify({
        insights,
        summary: {
          totalIncome,
          totalExpenses,
          deductibleExpenses,
          potentialSavings: deductibleExpenses * 0.25, // Rough estimate at 25% tax rate
          year: currentYear,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in tax-insights function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

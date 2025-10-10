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

    // Get user's transactions for current tax year - MOST RECENT DATA
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = new Date().toISOString().split('T')[0]; // Today's date
    
    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      throw transactionsError;
    }

    console.log(`Fetched ${transactions?.length || 0} transactions from ${startDate} to ${endDate}`);


    // Calculate summary statistics from MOST RECENT transaction data
    const totalIncome = transactions
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    const totalExpenses = transactions
      ?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    const deductibleExpenses = transactions
      ?.filter(t => t.type === 'expense' && t.is_tax_deductible)
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // Get expense breakdown by category with transaction counts
    const expensesByCategory = transactions
      ?.filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const category = t.categories?.name || 'Uncategorized';
        const irsCode = t.categories?.irs_category_code || 'other';
        if (!acc[category]) {
          acc[category] = {
            amount: 0,
            irsCode,
            deductible: t.is_tax_deductible,
            count: 0
          };
        }
        acc[category].amount += Number(t.amount);
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, any>);

    // Get the most recent transaction date for context
    const mostRecentDate = transactions?.[0]?.transaction_date || endDate;

    console.log('Calling Lovable AI for tax insights...');
    console.log(`Data summary: ${transactions?.length} transactions, Latest: ${mostRecentDate}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are a tax advisor specialized in small business taxes. Analyze this CURRENT financial data and provide insights based on IRS Publication 334 (Tax Guide for Small Business).

Financial Summary for ${currentYear} (Data through ${mostRecentDate}):
- Total Transactions: ${transactions?.length || 0}
- Total Income YTD: $${totalIncome.toFixed(2)}
- Total Expenses YTD: $${totalExpenses.toFixed(2)}
- Tax-Deductible Expenses YTD: $${deductibleExpenses.toFixed(2)}
- Net Income YTD: $${(totalIncome - totalExpenses).toFixed(2)}

Expense Breakdown by IRS Category:
${Object.entries(expensesByCategory || {})
  .sort(([, a]: [string, any], [, b]: [string, any]) => b.amount - a.amount)
  .map(([category, data]: [string, any]) => 
    `- ${category} (IRS Code: ${data.irsCode}): $${data.amount.toFixed(2)} (${data.count} transactions)${data.deductible ? ' ✓ Deductible' : ''}`
  )
  .join('\n')}

Provide 3-5 specific, actionable tax insights for this small business based on:
1. Deduction opportunities they might be missing based on their spending patterns
2. Tax optimization strategies for their specific situation
3. Record-keeping recommendations for the categories they use most
4. Quarterly tax planning suggestions based on their YTD performance
5. Year-end tax planning actions they should consider NOW

Reference specific IRS Publication 334 sections where applicable. Keep insights concise, actionable, and tailored to their actual spending data.`;

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
          netIncome: totalIncome - totalExpenses,
          potentialSavings: deductibleExpenses * 0.25, // Rough estimate at 25% tax rate
          year: currentYear,
          dataThrough: mostRecentDate,
          transactionCount: transactions?.length || 0,
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

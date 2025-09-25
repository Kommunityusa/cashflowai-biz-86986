import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { transactions } = await req.json();
    
    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No transactions provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch user's categories for reference
    const { data: categories } = await supabaseClient
      .from('categories')
      .select('name, type')
      .eq('user_id', user.id);

    const incomeCategories = categories?.filter(c => c.type === 'income').map(c => c.name) || [];
    const expenseCategories = categories?.filter(c => c.type === 'expense').map(c => c.name) || [];

    // Prepare transactions for AI analysis
    const transactionText = transactions.map((t: any) => 
      `${t.description || ''} | ${t.vendor_name || ''} | Amount: ${t.amount} | Date: ${t.transaction_date}`
    ).join('\n');

    // Call OpenAI to categorize transactions
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
            content: `You are a bookkeeping expert categorizing business transactions. 
            
Available income categories: ${incomeCategories.join(', ')}
Available expense categories: ${expenseCategories.join(', ')}

For each transaction, determine:
1. Whether it's income (money coming in) or expense (money going out)
2. The most appropriate category from the available list
3. Whether it's likely tax deductible (for expenses)

Important patterns:
- Payroll from companies like Gusto, ADP, Paychex = "Salaries & Wages" (expense, not income)
- Facebook/Meta ads = "Marketing & Advertising"
- Real estate investments (Fundrise, REITs) = "Investment Income" if positive, "Investment Expense" if negative
- Venmo/Zelle/PayPal = Analyze the context, could be various categories
- Bank transfers = Often "Other Income" or "Other Expenses" unless context suggests otherwise

Return a JSON array with one object per transaction in the same order as provided.`
          },
          {
            role: 'user',
            content: `Categorize these transactions:\n${transactionText}\n\nReturn JSON array: [{"type": "income/expense", "category": "category name", "tax_deductible": true/false, "confidence": 0-1}]`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const categorizations = JSON.parse(aiResponse.choices[0].message.content);

    // Update transactions with AI categorizations
    const results = [];
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const categorization = categorizations[i];
      
      // Find the matching category ID
      const { data: category } = await supabaseClient
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', categorization.category)
        .eq('type', categorization.type)
        .single();

      if (category) {
        const { error } = await supabaseClient
          .from('transactions')
          .update({
            category_id: category.id,
            type: categorization.type,
            tax_deductible: categorization.tax_deductible,
            ai_processed_at: new Date().toISOString(),
            ai_confidence_score: categorization.confidence,
            ai_suggested_category_id: category.id,
          })
          .eq('id', transaction.id)
          .eq('user_id', user.id);

        results.push({
          transaction_id: transaction.id,
          success: !error,
          category: categorization.category,
          type: categorization.type,
          error: error?.message,
        });
      } else {
        results.push({
          transaction_id: transaction.id,
          success: false,
          category: categorization.category,
          type: categorization.type,
          error: 'Category not found',
        });
      }
    }

    return new Response(
      JSON.stringify({ results, message: 'Categorization complete' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-categorize-transactions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
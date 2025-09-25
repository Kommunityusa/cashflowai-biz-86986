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
    console.log('Calling OpenAI API to categorize transactions...');
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
            content: `You are an expert bookkeeper. Categorize each transaction using ONLY these exact category names:

INCOME CATEGORIES:
${incomeCategories.map(c => `- ${c}`).join('\n')}

EXPENSE CATEGORIES:
${expenseCategories.map(c => `- ${c}`).join('\n')}

Key rules:
- GUSTO PAYROLL = "Salaries & Wages" (expense, tax deductible)
- Facebook/Meta ads = "Marketing & Advertising" (expense, tax deductible)
- Fundrise/Real Estate = "Investments" (expense if payment out, income if return)
- Venmo/Zelle = Analyze context, often "Other Expenses"
- Check deposits from businesses = "Service Revenue" or "Sales Revenue"

Return a JSON object with a "transactions" array containing categorization for each transaction.`
          },
          {
            role: 'user',
            content: `Categorize these transactions. Return ONLY valid JSON in this format: {"transactions": [{"type": "income" or "expense", "category": "exact category name from list", "tax_deductible": true/false, "confidence": 0.0-1.0}]}:\n\n${transactionText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "text" } // Explicitly set to text to avoid issues
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    console.log('OpenAI raw response:', aiResponse.choices[0].message.content);
    
    // Clean up the response - remove markdown code blocks if present
    let content = aiResponse.choices[0].message.content;
    // Remove any markdown formatting
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    
    console.log('Cleaned content to parse:', content);
    
    let categorizations;
    try {
      const parsed = JSON.parse(content);
      // Handle both array and object with transactions property
      categorizations = parsed.transactions || parsed;
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Content that failed to parse:', content);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    // Ensure we have an array of categorizations
    if (!Array.isArray(categorizations)) {
      throw new Error('AI response is not an array of categorizations');
    }

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
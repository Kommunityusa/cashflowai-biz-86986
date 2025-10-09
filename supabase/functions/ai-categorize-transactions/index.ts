import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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

    // Prepare transactions for AI analysis with explicit type indication
    const transactionText = transactions.map((t: any) => 
      `${t.description || ''} | ${t.vendor_name || ''} | Amount: $${t.amount} | Type: ${t.type} | Date: ${t.transaction_date}`
    ).join('\n');

    // Call Lovable AI to categorize transactions
    console.log('[AI-CATEGORIZE] Calling Lovable AI Gateway...');
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
            content: `You are an expert bookkeeper. Analyze each transaction and assign the most appropriate category.
CRITICAL: The transaction type (income or expense) is already determined and shown in each transaction. You MUST respect this type designation.

EXISTING INCOME CATEGORIES:
${incomeCategories.join(', ')}

EXISTING EXPENSE CATEGORIES:
${expenseCategories.join(', ')}

IMPORTANT RULES:
1. The transaction type (income/expense) is ALREADY DETERMINED - DO NOT CHANGE IT
2. You can suggest NEW categories if the existing ones don't fit well
3. Be specific and professional with category names

Common patterns to recognize:
INCOME TRANSACTIONS (money coming IN):
- Direct deposits from employers = "Salary Income" 
- Client payments = "Service Revenue" or "Consulting Income"
- Product sales = "Sales Revenue"
- Investment returns = "Investment Income"
- Refunds = "Refunds & Returns"
- Interest earned = "Interest Income"
- Dividends = "Dividend Income"

EXPENSE TRANSACTIONS (money going OUT):
- Payroll services (Gusto, ADP) = "Payroll Processing" 
- Facebook/Meta ads = "Social Media Advertising"
- Google/YouTube ads = "Digital Advertising"
- Investment contributions = "Investment Contributions"
- Restaurants/food delivery = "Meals & Entertainment"
- AWS/Cloud services = "Cloud Services & Hosting"
- Stripe/Square fees = "Payment Processing Fees"
- Rent payments = "Rent & Lease"
- Insurance = "Business Insurance" or specific type
- Bank fees = "Bank Fees & Charges"
- Software subscriptions = "Software & Subscriptions"

Create professional, specific categories that match the transaction type.`
          },
          {
            role: 'user',
            content: `Categorize these transactions. Return ONLY valid JSON - no markdown, no code blocks, just pure JSON:
{"transactions": [{"type": "income" or "expense", "category": "category name", "is_new_category": true/false, "tax_deductible": true/false, "confidence": 0.0-1.0}]}

Transactions:
${transactionText}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI-CATEGORIZE] Lovable AI error:', errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      
      throw new Error(`Lovable AI error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    console.log('[AI-CATEGORIZE] Lovable AI response received');
    
    // Parse the response - it should be pure JSON
    let categorizations;
    try {
      const content = aiResponse.choices[0].message.content.trim();
      const parsed = JSON.parse(content);
      categorizations = parsed.transactions;
    } catch (parseError) {
      console.error('[AI-CATEGORIZE] Failed to parse JSON:', parseError);
      
      // Try to extract JSON from the response if it contains markdown
      try {
        const content = aiResponse.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          categorizations = parsed.transactions;
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (retryError) {
        throw new Error('Failed to parse AI response as JSON');
      }
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
      
      if (!categorization) {
        results.push({
          transaction_id: transaction.id,
          success: false,
          error: 'No categorization found for transaction',
        });
        continue;
      }
      
      let categoryId;
      
      // First, try to find existing category (case-insensitive)
      const { data: existingCategory } = await supabaseClient
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', categorization.category)
        .eq('type', categorization.type)
        .maybeSingle();

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create new category if it doesn't exist
        console.log(`[AI-CATEGORIZE] Creating new category: ${categorization.category} (${categorization.type})`);
        
        // Determine color based on type and category name
        let color = categorization.type === 'income' ? '#10B981' : '#EF4444';
        let icon = categorization.type === 'income' ? 'dollar-sign' : 'credit-card';
        
        // Custom colors for specific categories
        if (categorization.category.toLowerCase().includes('marketing') || 
            categorization.category.toLowerCase().includes('advertising')) {
          color = '#8B5CF6';
          icon = 'megaphone';
        } else if (categorization.category.toLowerCase().includes('salary') || 
                   categorization.category.toLowerCase().includes('wage')) {
          color = categorization.type === 'income' ? '#10B981' : '#F59E0B';
          icon = 'users';
        } else if (categorization.category.toLowerCase().includes('investment')) {
          color = '#3B82F6';
          icon = 'trending-up';
        } else if (categorization.category.toLowerCase().includes('software') || 
                   categorization.category.toLowerCase().includes('subscription')) {
          color = '#6366F1';
          icon = 'cpu';
        } else if (categorization.category.toLowerCase().includes('meal') || 
                   categorization.category.toLowerCase().includes('food')) {
          color = '#EC4899';
          icon = 'coffee';
        } else if (categorization.category.toLowerCase().includes('travel') || 
                   categorization.category.toLowerCase().includes('transport')) {
          color = '#14B8A6';
          icon = 'plane';
        }
        
        const { data: newCategory, error: createError } = await supabaseClient
          .from('categories')
          .insert({
            user_id: user.id,
            name: categorization.category,
            type: categorization.type,
            color: color,
            icon: icon,
            is_default: false
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('[AI-CATEGORIZE] Error creating category:', createError);
          results.push({
            transaction_id: transaction.id,
            success: false,
            category: categorization.category,
            type: categorization.type,
            error: `Failed to create category: ${createError.message}`,
          });
          continue;
        }
        
        categoryId = newCategory.id;
      }

      // Update transaction with the category (but preserve original transaction type)
      const { error: updateError } = await supabaseClient
        .from('transactions')
        .update({
          category_id: categoryId,
          tax_deductible: categorization.tax_deductible || false,
          needs_review: false,
        })
        .eq('id', transaction.id)
        .eq('user_id', user.id);

      results.push({
        transaction_id: transaction.id,
        success: !updateError,
        category: categorization.category,
        type: categorization.type,
        is_new_category: !existingCategory,
        error: updateError?.message,
      });
    }

    const successCount = results.filter(r => r.success).length;
    const newCategoriesCount = results.filter(r => r.is_new_category && r.success).length;

    return new Response(
      JSON.stringify({ 
        results, 
        message: `Categorized ${successCount} of ${transactions.length} transactions. Created ${newCategoriesCount} new categories.`,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[AI-CATEGORIZE] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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

    const body = await req.json();
    const transactions = body.transactions || [];

    console.log(`[plaid-categorize] Processing ${transactions.length} transactions for user ${user.id}`);

    // Validate transactions array
    if (!Array.isArray(transactions) || transactions.length === 0) {
      console.log('[plaid-categorize] No transactions to process');
      return new Response(
        JSON.stringify({ categorized: 0, message: 'No transactions to process' }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Fetch user's categories
    const { data: userCategories, error: categoriesError } = await supabaseClient
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }

    // Enhanced business categorization rules
    const businessCategories = {
      income: {
        'TRANSFER_IN': 'Sales',
        'DEPOSIT': 'Sales',
        'PAYMENT': 'Sales',
        'WIRE': 'Sales',
        'INTEREST': 'Investments',
        'DIVIDEND': 'Investments',
      },
      expense: {
        'TRAVEL': 'Travel',
        'FOOD_AND_DRINK': 'Travel',
        'SHOPS': 'Office Supplies',
        'SERVICE': 'Software',
        'RECREATION': 'Marketing',
        'TRANSFER_OUT': 'Other Expenses',
        'PAYMENT': 'Other Expenses',
        'BANK_FEES': 'Other Expenses',
        'INTEREST_CHARGED': 'Other Expenses',
        'RENT': 'Rent',
        'UTILITIES': 'Utilities',
        'INSURANCE': 'Insurance',
      }
    };

    let categorizedCount = 0;
    const updates = [];

    for (const transaction of transactions) {
      try {
        // Skip if transaction doesn't have required fields
        if (!transaction.id) {
          console.log('[plaid-categorize] Skipping transaction without ID');
          continue;
        }

        // Safely access amount with fallback
        const amount = transaction.amount || 0;
        
        // Determine transaction type and category
        const isIncome = amount < 0; // Plaid uses negative for money in
        const type = isIncome ? 'income' : 'expense';
        
        // Map Plaid category to business category
        let categoryName = 'Other ' + (isIncome ? 'Income' : 'Expenses');
        
        if (transaction.plaid_category && Array.isArray(transaction.plaid_category) && transaction.plaid_category.length > 0) {
          const plaidCategory = transaction.plaid_category[0].toUpperCase();
          const categoryMap = isIncome ? businessCategories.income : businessCategories.expense;
          
          for (const [key, value] of Object.entries(categoryMap)) {
            if (plaidCategory.includes(key)) {
              categoryName = value;
              break;
            }
          }
        }

        // Find the matching category from user's categories
        const matchingCategory = userCategories?.find(
          cat => cat.name === categoryName && cat.type === type
        );

        if (matchingCategory) {
          // Check for tax-deductible patterns
          const taxDeductiblePatterns = [
            'office', 'supplies', 'software', 'subscription',
            'insurance', 'travel', 'meal', 'equipment',
            'professional', 'service', 'consulting'
          ];
          
          const transactionName = transaction.vendor_name || transaction.description || '';
          const isTaxDeductible = taxDeductiblePatterns.some(pattern => 
            transactionName.toLowerCase().includes(pattern)
          );

          // Extract vendor information
          const vendorName = transaction.vendor_name || transaction.description || 'Unknown';

          // Update the transaction with the category
          const { error: updateError } = await supabaseClient
            .from('transactions')
            .update({
              category_id: matchingCategory.id,
              ai_suggested_category_id: matchingCategory.id,
              tax_deductible: isTaxDeductible,
              vendor_name: vendorName,
              ai_processed_at: new Date().toISOString(),
              ai_confidence_score: 0.85, // Fixed confidence for rule-based categorization
            })
            .eq('id', transaction.id)
            .eq('user_id', user.id); // Extra safety check

          if (updateError) {
            console.error(`[plaid-categorize] Failed to update transaction ${transaction.id}:`, updateError);
          } else {
            categorizedCount++;
            console.log(`[plaid-categorize] Categorized transaction ${transaction.id} as ${categoryName}`);
          }
        } else {
          console.log(`[plaid-categorize] No matching category found for ${categoryName} (${type})`);
        }
      } catch (error) {
        console.error(`[plaid-categorize] Error processing transaction:`, error);
      }
    }

    console.log(`[plaid-categorize] Successfully categorized ${categorizedCount} out of ${transactions.length} transactions`);

    return new Response(
      JSON.stringify({
        categorized: categorizedCount,
        total: transactions.length,
        message: `Successfully categorized ${categorizedCount} transactions`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('[plaid-categorize] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
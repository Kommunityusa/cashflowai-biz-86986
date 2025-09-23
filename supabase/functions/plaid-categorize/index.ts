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

    const { transaction } = await req.json();

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

    // Determine transaction type and category
    const isIncome = transaction.amount < 0; // Plaid uses negative for money in
    const type = isIncome ? 'income' : 'expense';
    
    // Map Plaid category to business category
    let categoryName = 'Other ' + (isIncome ? 'Income' : 'Expenses');
    
    if (transaction.category && transaction.category.length > 0) {
      const plaidCategory = transaction.category[0].toUpperCase();
      const categoryMap = isIncome ? businessCategories.income : businessCategories.expense;
      
      for (const [key, value] of Object.entries(categoryMap)) {
        if (plaidCategory.includes(key)) {
          categoryName = value;
          break;
        }
      }
    }

    // Check for tax-deductible patterns
    const taxDeductiblePatterns = [
      'office', 'supplies', 'software', 'subscription',
      'insurance', 'travel', 'meal', 'equipment',
      'professional', 'service', 'consulting'
    ];
    
    const isTaxDeductible = taxDeductiblePatterns.some(pattern => 
      transaction.name.toLowerCase().includes(pattern)
    );

    // Extract vendor information
    const vendorName = transaction.merchant_name || transaction.name.split(' ')[0];

    console.log('Business categorization:', {
      transactionId: transaction.transaction_id,
      type,
      categoryName,
      isTaxDeductible,
      vendorName,
      amount: Math.abs(transaction.amount)
    });

    return new Response(
      JSON.stringify({
        type,
        categoryName,
        isTaxDeductible,
        vendorName,
        amount: Math.abs(transaction.amount),
        needsReview: transaction.pending || !transaction.authorized
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Categorization error:', error);
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
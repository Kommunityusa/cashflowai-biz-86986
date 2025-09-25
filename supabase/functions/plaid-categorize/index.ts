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

    // Enhanced business bookkeeping categorization with contextual matching
    const categorizeTransaction = (transaction: any, isIncome: boolean) => {
      const description = (transaction.description || '').toLowerCase();
      const vendorName = (transaction.vendor_name || '').toLowerCase();
      const plaidCategory = transaction.plaid_category && Array.isArray(transaction.plaid_category) 
        ? transaction.plaid_category.map((c: string) => c.toLowerCase()) 
        : [];
      
      // Combined text for pattern matching
      const combinedText = `${description} ${vendorName} ${plaidCategory.join(' ')}`;
      
      // Income categorization patterns
      if (isIncome) {
        if (combinedText.match(/\b(sales?|revenue|invoice|payment\s+from|customer)/i)) return 'Sales Revenue';
        if (combinedText.match(/\b(service|consulting|professional|freelance)/i)) return 'Service Revenue';
        if (combinedText.match(/\b(interest|apy|yield|savings)/i)) return 'Interest Income';
        if (combinedText.match(/\b(dividend|distribution|stock)/i)) return 'Dividend Income';
        if (combinedText.match(/\b(rent|lease|tenant|property)/i)) return 'Rental Income';
        if (combinedText.match(/\b(investment|capital|gain|trading)/i)) return 'Investment Income';
        if (combinedText.match(/\b(commission|referral|affiliate)/i)) return 'Commission Income';
        if (combinedText.match(/\b(royalty|licensing|copyright)/i)) return 'Royalty Income';
        if (combinedText.match(/\b(grant|funding|subsidy)/i)) return 'Grant Income';
        if (plaidCategory.includes('transfer') || plaidCategory.includes('deposit')) return 'Sales Revenue';
        return 'Other Income';
      }
      
      // Expense categorization patterns with vendor-specific rules
      // Salaries & Payroll
      if (combinedText.match(/\b(payroll|salary|wages?|adp|paychex|gusto|rippling|employee\s+pay)/i)) return 'Salaries & Wages';
      if (combinedText.match(/\b(benefits?|health\s+insurance|401k|pension|dental|vision|life\s+insurance)/i)) return 'Employee Benefits';
      if (combinedText.match(/\b(payroll\s+tax|fica|suta|futa|employment\s+tax)/i)) return 'Payroll Taxes';
      
      // Rent & Utilities
      if (combinedText.match(/\b(rent|lease|landlord|property\s+management|office\s+space)/i)) return 'Rent & Lease';
      if (combinedText.match(/\b(electric|gas|water|sewer|trash|utility|pge|edison|con\s+ed)/i)) return 'Utilities';
      
      // Office & Equipment
      if (combinedText.match(/\b(office\s+depot|staples|office\s+supplies|paper|pens|printer|ink|toner)/i)) return 'Office Supplies';
      if (combinedText.match(/\b(equipment|tools?|machinery|hardware|home\s+depot|lowes|grainger)/i)) return 'Equipment & Tools';
      if (combinedText.match(/\b(computer|laptop|monitor|keyboard|mouse|tech\s+equipment)/i)) return 'Equipment & Tools';
      
      // Software & Technology
      if (combinedText.match(/\b(software|subscription|saas|adobe|microsoft|google|zoom|slack|aws|azure)/i)) return 'Software & Subscriptions';
      if (combinedText.match(/\b(dropbox|github|atlassian|salesforce|hubspot|quickbooks|xero)/i)) return 'Software & Subscriptions';
      if (combinedText.match(/\b(hosting|domain|cloudflare|godaddy|namecheap)/i)) return 'Software & Subscriptions';
      
      // Marketing & Advertising
      if (combinedText.match(/\b(marketing|advertising|ads?|promotion|google\s+ads|facebook\s+ads|meta)/i)) return 'Marketing & Advertising';
      if (combinedText.match(/\b(mailchimp|constant\s+contact|social\s+media|campaign|seo)/i)) return 'Marketing & Advertising';
      
      // Travel & Transportation
      if (combinedText.match(/\b(travel|flight|airline|hotel|lodging|uber|lyft|taxi|parking|toll)/i)) return 'Travel & Transportation';
      if (combinedText.match(/\b(united|american|delta|southwest|marriott|hilton|airbnb)/i)) return 'Travel & Transportation';
      if (combinedText.match(/\b(gas|fuel|shell|chevron|exxon|bp|gasoline|car\s+rental)/i)) return 'Travel & Transportation';
      
      // Meals & Entertainment
      if (combinedText.match(/\b(restaurant|food|meal|lunch|dinner|breakfast|coffee|starbucks|dunkin)/i)) return 'Meals & Entertainment';
      if (combinedText.match(/\b(doordash|uber\s+eats|grubhub|postmates|seamless)/i)) return 'Meals & Entertainment';
      if (combinedText.match(/\b(entertainment|client\s+meeting|business\s+meal)/i)) return 'Meals & Entertainment';
      
      // Professional Services
      if (combinedText.match(/\b(legal|lawyer|attorney|law\s+firm|litigation)/i)) return 'Legal Fees';
      if (combinedText.match(/\b(accounting|cpa|bookkeep|tax\s+prep|audit)/i)) return 'Accounting Fees';
      if (combinedText.match(/\b(consulting|consultant|professional\s+service|advisor)/i)) return 'Professional Services';
      
      // Insurance & Financial
      if (combinedText.match(/\b(insurance|premium|policy|liability|coverage|state\s+farm|geico|allstate)/i)) return 'Insurance';
      if (combinedText.match(/\b(bank\s+fee|service\s+charge|overdraft|wire\s+fee|atm\s+fee)/i)) return 'Bank Fees';
      if (combinedText.match(/\b(interest\s+charge|finance\s+charge|apr|credit\s+card\s+interest)/i)) return 'Interest Expense';
      
      // Communication
      if (combinedText.match(/\b(phone|telephone|verizon|at&t|t-mobile|sprint|cellular|mobile)/i)) return 'Telephone & Internet';
      if (combinedText.match(/\b(internet|broadband|comcast|spectrum|cox|fiber|isp)/i)) return 'Telephone & Internet';
      
      // Shipping & Postage
      if (combinedText.match(/\b(shipping|postage|fedex|ups|usps|dhl|mail|package|freight)/i)) return 'Postage & Shipping';
      
      // Education & Training
      if (combinedText.match(/\b(training|education|course|seminar|conference|workshop|certification)/i)) return 'Training & Education';
      if (combinedText.match(/\b(udemy|coursera|linkedin\s+learning|skillshare)/i)) return 'Training & Education';
      
      // Licenses & Compliance
      if (combinedText.match(/\b(license|permit|registration|compliance|regulatory|filing\s+fee)/i)) return 'Licenses & Permits';
      
      // Taxes
      if (combinedText.match(/\b(tax|irs|state\s+tax|federal\s+tax|sales\s+tax|property\s+tax)/i)) return 'Taxes';
      
      // Inventory & COGS
      if (combinedText.match(/\b(inventory|stock|merchandise|product|supplier|wholesale|vendor)/i)) return 'Inventory';
      if (combinedText.match(/\b(cost\s+of\s+goods|cogs|materials|supplies\s+for\s+resale)/i)) return 'Cost of Goods Sold';
      
      // Repairs & Maintenance
      if (combinedText.match(/\b(repair|maintenance|fix|service|plumb|electric|hvac|cleaning)/i)) return 'Repairs & Maintenance';
      
      // Check Plaid categories as fallback
      if (plaidCategory.includes('bank_fees')) return 'Bank Fees';
      if (plaidCategory.includes('travel')) return 'Travel & Transportation';
      if (plaidCategory.includes('food_and_drink')) return 'Meals & Entertainment';
      if (plaidCategory.includes('shops')) return 'Office Supplies';
      if (plaidCategory.includes('recreation')) return 'Marketing & Advertising';
      
      return 'Other Expenses';
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
        
        // Use the enhanced categorization function
        const categoryName = categorizeTransaction(transaction, isIncome);

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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
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
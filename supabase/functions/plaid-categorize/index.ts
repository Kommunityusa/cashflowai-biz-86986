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
      const description = (transaction.description || transaction.name || '').toLowerCase();
      const vendorName = (transaction.vendor_name || transaction.merchant_name || '').toLowerCase();
      const plaidCategory = transaction.plaid_category && Array.isArray(transaction.plaid_category) 
        ? transaction.plaid_category.map((c: string) => c.toLowerCase()) 
        : [];
      const plaidDetailed = transaction.personal_finance_category?.detailed?.toLowerCase() || '';
      const plaidPrimary = transaction.personal_finance_category?.primary?.toLowerCase() || '';
      
      // Combined text for comprehensive pattern matching
      const combinedText = `${description} ${vendorName} ${plaidCategory.join(' ')} ${plaidDetailed} ${plaidPrimary}`;
      
      // Income categorization with vendor-specific patterns
      if (isIncome) {
        // Sales Revenue - payments from customers, invoices, square, stripe
        if (combinedText.match(/\b(sales?|revenue|invoice|payment\s+(from|received)|customer|square|stripe|paypal\s+transfer|shopify|etsy|ebay|amazon\s+seller)/i)) {
          return 'Sales Revenue';
        }
        // Service Revenue - consulting, freelance, professional services
        if (combinedText.match(/\b(service|consulting|professional|freelance|contractor|hourly|retainer|project\s+payment|upwork|fiverr|toptal)/i)) {
          return 'Service Revenue';
        }
        // Interest Income - bank interest, savings
        if (combinedText.match(/\b(interest|apy|yield|savings\s+interest|cd\s+interest|money\s+market|treasury)/i)) {
          return 'Interest Income';
        }
        // Dividend Income
        if (combinedText.match(/\b(dividend|distribution|stock|shares|equity|mutual\s+fund|etf\s+dist)/i)) {
          return 'Dividend Income';
        }
        // Rental Income
        if (combinedText.match(/\b(rent|lease|tenant|property|apartment|airbnb|vrbo|booking\.com|rental\s+income)/i)) {
          return 'Rental Income';
        }
        // Investment Income
        if (combinedText.match(/\b(investment|capital\s+gain|trading|portfolio|securities|bonds|crypto|bitcoin|ethereum)/i)) {
          return 'Investment Income';
        }
        // Commission Income
        if (combinedText.match(/\b(commission|referral|affiliate|partner\s+revenue|reseller|broker)/i)) {
          return 'Commission Income';
        }
        // Royalty Income
        if (combinedText.match(/\b(royalty|licensing|copyright|patent|trademark|publishing|music|book)/i)) {
          return 'Royalty Income';
        }
        // Grant Income
        if (combinedText.match(/\b(grant|funding|subsidy|government\s+aid|sba|ppp|eidl|tax\s+credit)/i)) {
          return 'Grant Income';
        }
        // Default for income
        return 'Sales Revenue';
      }
      
      // Expense categorization with extensive vendor and pattern matching
      
      // Salaries & Payroll - specific payroll services
      if (combinedText.match(/\b(payroll|salary|wages?|adp|paychex|gusto|rippling|bamboohr|workday|paycom|paycor|zenefits|trinet|insperity|direct\s+deposit\s+payroll)/i)) {
        return 'Salaries & Wages';
      }
      
      // Employee Benefits
      if (combinedText.match(/\b(benefits?|health\s+insurance|medical|dental|vision|401k|retirement|pension|fsa|hsa|cobra|aflac|metlife|cigna|aetna|blue\s+cross|united\s+healthcare|kaiser)/i)) {
        return 'Employee Benefits';
      }
      
      // Payroll Taxes
      if (combinedText.match(/\b(payroll\s+tax|fica|social\s+security|medicare|suta|futa|sui|employment\s+tax|eftps|irs\s+payroll)/i)) {
        return 'Payroll Taxes';
      }
      
      // Rent & Lease - property management companies
      if (combinedText.match(/\b(rent|lease|landlord|property\s+management|office\s+space|warehouse|coworking|wework|regus|spaces|building\s+rent|monthly\s+rent)/i)) {
        return 'Rent & Lease';
      }
      
      // Utilities - specific utility companies
      if (combinedText.match(/\b(electric|gas|water|sewer|trash|utility|utilities|pge|pg&e|edison|con\s+ed|duke\s+energy|dominion|exelon|nextera|waste\s+management|republic\s+services)/i)) {
        return 'Utilities';
      }
      
      // Office Supplies - office supply stores
      if (combinedText.match(/\b(office\s+(depot|max)|staples|supplies|paper|pens|printer|ink|toner|3m|avery|brother|canon|epson|xerox|post-it|sharpie|bic|hammermill)/i)) {
        return 'Office Supplies';
      }
      
      // Equipment & Tools - hardware and equipment stores
      if (combinedText.match(/\b(equipment|tools?|machinery|hardware|home\s+depot|lowes|grainger|ace\s+hardware|menards|harbor\s+freight|snap-on|dewalt|makita|milwaukee|craftsman|computer|laptop|monitor|dell|hp|lenovo|apple\s+store|best\s+buy|micro\s+center)/i)) {
        return 'Equipment & Tools';
      }
      
      // Software & Subscriptions - SaaS and software companies
      if (combinedText.match(/\b(software|subscription|saas|adobe|microsoft|office\s+365|google\s+workspace|zoom|slack|teams|aws|amazon\s+web|azure|dropbox|box|github|gitlab|atlassian|jira|confluence|salesforce|hubspot|quickbooks|xero|freshbooks|mailchimp|constant\s+contact|sendgrid|twilio|stripe|square|shopify|wix|squarespace|godaddy|namecheap|cloudflare|netflix|spotify|linkedin|canva|figma|notion|asana|monday|trello|lastpass|1password|nordvpn|expressvpn)/i)) {
        return 'Software & Subscriptions';
      }
      
      // Marketing & Advertising - advertising platforms
      if (combinedText.match(/\b(marketing|advertising|ads?|promotion|google\s+ads|adwords|facebook\s+ads|meta\s+ads|instagram\s+ads|twitter\s+ads|linkedin\s+ads|bing\s+ads|amazon\s+ads|youtube\s+ads|tiktok\s+ads|pinterest|snapchat|campaign|seo|sem|ppc|cpm|cpc|vistaprint|moo|printful|promotional|swag|trade\s+show|conference\s+booth)/i)) {
        return 'Marketing & Advertising';
      }
      
      // Travel & Transportation - airlines, hotels, gas stations
      if (combinedText.match(/\b(travel|flight|airline|united|american|delta|southwest|jetblue|alaska|spirit|frontier|british\s+airways|lufthansa|hotel|marriott|hilton|hyatt|sheraton|westin|holiday\s+inn|hampton|courtyard|residence\s+inn|fairfield|springhill|airbnb|vrbo|booking|expedia|priceline|kayak|uber|lyft|taxi|cab|parking|park|toll|ezpass|sunpass|fastrak|gas|fuel|shell|chevron|exxon|mobil|bp|citgo|valero|marathon|speedway|wawa|sheetz|7-eleven|circle\s+k|car\s+rental|hertz|enterprise|avis|budget|national|alamo|zipcar|turo)/i)) {
        return 'Travel & Transportation';
      }
      
      // Meals & Entertainment - restaurants and food delivery
      if (combinedText.match(/\b(restaurant|food|meal|lunch|dinner|breakfast|coffee|cafe|starbucks|dunkin|tim\s+hortons|peets|caribou|dutch\s+bros|mcdonalds|burger\s+king|wendys|subway|chipotle|panera|chick-fil-a|taco\s+bell|kfc|pizza|dominos|papa\s+johns|little\s+caesars|doordash|uber\s+eats|grubhub|postmates|seamless|caviar|instacart|entertainment|theater|cinema|concert|sports|stadium|arena|client\s+(meal|dinner|lunch)|business\s+(meal|dinner|lunch))/i)) {
        return 'Meals & Entertainment';
      }
      
      // Legal Fees - law firms
      if (combinedText.match(/\b(legal|lawyer|attorney|law\s+(firm|office)|litigation|lexisnexis|westlaw|legalzoom|rocket\s+lawyer|counsel|esquire|pllc|llp|paralegal|court|filing\s+fee)/i)) {
        return 'Legal Fees';
      }
      
      // Accounting Fees - accounting firms
      if (combinedText.match(/\b(accounting|accountant|cpa|bookkeep|tax\s+(prep|preparation)|audit|h&r\s+block|jackson\s+hewitt|liberty\s+tax|turbotax|freetaxusa|taxact|ernst|young|deloitte|pwc|kpmg|bdo|grant\s+thornton)/i)) {
        return 'Accounting Fees';
      }
      
      // Professional Services - consultants
      if (combinedText.match(/\b(consulting|consultant|professional\s+service|advisor|advisory|expert|specialist|contractor|freelancer|agency|firm|associates|partners|group)/i)) {
        return 'Professional Services';
      }
      
      // Insurance - insurance companies
      if (combinedText.match(/\b(insurance|premium|policy|liability|coverage|state\s+farm|geico|progressive|allstate|farmers|nationwide|liberty\s+mutual|travelers|usaa|american\s+family|erie|auto-owners|hartford|chubb|aig|metlife|prudential|new\s+york\s+life|northwestern\s+mutual)/i)) {
        return 'Insurance';
      }
      
      // Bank Fees
      if (combinedText.match(/\b(bank\s+(fee|charge)|service\s+charge|overdraft|nsf|wire\s+(fee|transfer)|atm\s+fee|monthly\s+fee|maintenance\s+fee|chase|wells\s+fargo|bank\s+of\s+america|citibank|us\s+bank|pnc|truist|td\s+bank|capital\s+one|regions|fifth\s+third|keybank)/i)) {
        return 'Bank Fees';
      }
      
      // Interest Expense
      if (combinedText.match(/\b(interest\s+(charge|expense|payment)|finance\s+charge|apr|credit\s+card\s+interest|loan\s+interest|mortgage\s+interest|line\s+of\s+credit)/i)) {
        return 'Interest Expense';
      }
      
      // Telephone & Internet - telecom companies
      if (combinedText.match(/\b(phone|telephone|cellular|mobile|verizon|at&t|att|t-mobile|tmobile|sprint|cricket|metro|boost|virgin|tracfone|internet|broadband|comcast|xfinity|spectrum|cox|charter|centurylink|frontier|windstream|fiber|fios|dsl|cable|isp|vonage|ringcentral|8x8|nextiva|ooma|grasshopper)/i)) {
        return 'Telephone & Internet';
      }
      
      // Postage & Shipping - shipping companies
      if (combinedText.match(/\b(shipping|postage|mail|fedex|ups|usps|dhl|postal|stamps|package|freight|logistics|fulfillment|amazon\s+fba|shipstation|pirateship|easypost|sendle)/i)) {
        return 'Postage & Shipping';
      }
      
      // Training & Education - educational platforms
      if (combinedText.match(/\b(training|education|course|class|seminar|workshop|conference|certification|udemy|coursera|linkedin\s+learning|skillshare|pluralsight|masterclass|khan\s+academy|codecademy|treehouse|datacamp|books|textbook|amazon\s+books|barnes|noble|audible)/i)) {
        return 'Training & Education';
      }
      
      // Licenses & Permits
      if (combinedText.match(/\b(license|permit|registration|certification|compliance|regulatory|filing\s+fee|state\s+fee|city\s+fee|county\s+fee|business\s+license|professional\s+license|dmv|secretary\s+of\s+state)/i)) {
        return 'Licenses & Permits';
      }
      
      // Taxes - government payments
      if (combinedText.match(/\b(tax|irs|treasury|state\s+tax|federal\s+tax|sales\s+tax|use\s+tax|property\s+tax|franchise\s+tax|excise\s+tax|estimated\s+tax|quarterly\s+tax|tax\s+payment|comptroller|revenue\s+department)/i)) {
        return 'Taxes';
      }
      
      // Inventory & COGS - wholesale and suppliers
      if (combinedText.match(/\b(inventory|stock|merchandise|product|supplier|wholesale|vendor|distributor|manufacturer|raw\s+material|costco|sams\s+club|bjs|restaurant\s+depot|sysco|us\s+foods|gordon|alibaba|aliexpress|dhgate|cost\s+of\s+goods|cogs|materials|supplies\s+for\s+resale|components|parts)/i)) {
        return 'Inventory';
      }
      
      // Repairs & Maintenance - service companies
      if (combinedText.match(/\b(repair|maintenance|fix|service|hvac|plumb|electric|handyman|janitor|cleaning|landscap|lawn|pest\s+control|terminix|orkin|trugreen|stanley\s+steemer|servpro|roto-rooter|mr\s+rooter|benjamin\s+franklin|one\s+hour|merry\s+maids|molly\s+maid)/i)) {
        return 'Repairs & Maintenance';
      }
      
      // Depreciation
      if (combinedText.match(/\b(depreciation|amortization|asset\s+writedown|accumulated\s+depreciation)/i)) {
        return 'Depreciation';
      }
      
      // Analyze Plaid categories as secondary fallback
      if (plaidDetailed || plaidPrimary) {
        if (plaidDetailed.includes('rent') || plaidPrimary.includes('rent')) return 'Rent & Lease';
        if (plaidDetailed.includes('insurance') || plaidPrimary.includes('insurance')) return 'Insurance';
        if (plaidDetailed.includes('bank_fees') || plaidPrimary.includes('bank_fees')) return 'Bank Fees';
        if (plaidDetailed.includes('coffee') || plaidDetailed.includes('fast_food') || plaidDetailed.includes('restaurant')) return 'Meals & Entertainment';
        if (plaidDetailed.includes('gas') || plaidDetailed.includes('taxi') || plaidDetailed.includes('parking')) return 'Travel & Transportation';
        if (plaidDetailed.includes('groceries') || plaidDetailed.includes('supermarket')) return 'Office Supplies';
        if (plaidDetailed.includes('internet') || plaidDetailed.includes('cable') || plaidDetailed.includes('telephone')) return 'Telephone & Internet';
      }
      
      // Final fallback based on basic Plaid categories
      if (plaidCategory.length > 0) {
        if (plaidCategory.includes('travel')) return 'Travel & Transportation';
        if (plaidCategory.includes('food_and_drink')) return 'Meals & Entertainment';
        if (plaidCategory.includes('shops')) return 'Office Supplies';
        if (plaidCategory.includes('service')) return 'Professional Services';
        if (plaidCategory.includes('bank_fees')) return 'Bank Fees';
      }
      
      // Default fallback
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
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

    const { message, conversationHistory } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'No message provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch comprehensive financial data for context
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    
    const [transactionsResult, categoriesResult, bankAccountsResult, budgetsResult, vendorsResult, recurringResult] = await Promise.all([
      supabaseClient.from('transactions').select('*').gte('transaction_date', yearStart).order('transaction_date', { ascending: false }),
      supabaseClient.from('categories').select('*'),
      supabaseClient.from('bank_accounts').select('*'),
      supabaseClient.from('budgets').select('*, categories(name)').eq('is_active', true),
      supabaseClient.from('vendors').select('*').eq('is_active', true),
      supabaseClient.from('recurring_transactions').select('*').eq('is_active', true)
    ]);

    const transactions = transactionsResult.data || [];
    const categories = categoriesResult.data || [];
    const bankAccounts = bankAccountsResult.data || [];
    const budgets = budgetsResult.data || [];
    const vendors = vendorsResult.data || [];
    const recurring = recurringResult.data || [];

    // Calculate Profit & Loss metrics
    const revenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netIncome = revenue - totalExpenses;

    // Calculate Balance Sheet metrics
    const totalAssets = bankAccounts
      .filter(a => a.is_active)
      .reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

    // Expense breakdown by category
    const expensesByCategory = categories
      .filter(c => c.type === 'expense')
      .map(cat => {
        const spent = transactions
          .filter(t => t.category_id === cat.id && t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return { name: cat.name, amount: spent };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // Revenue breakdown by category
    const revenueByCategory = categories
      .filter(c => c.type === 'income')
      .map(cat => {
        const earned = transactions
          .filter(t => t.category_id === cat.id && t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return { name: cat.name, amount: earned };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    console.log('Calling Lovable AI chat with comprehensive user context...');
    
    // Build comprehensive financial context
    const contextInfo = `

COMPREHENSIVE FINANCIAL DATA (Year ${currentYear}):

PROFIT & LOSS STATEMENT:
- Total Revenue: $${revenue.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Income (Profit/Loss): $${netIncome.toFixed(2)}
- Profit Margin: ${revenue > 0 ? ((netIncome / revenue) * 100).toFixed(2) : '0.00'}%

REVENUE BREAKDOWN:
${revenueByCategory.length > 0 ? revenueByCategory.map(c => `  - ${c.name}: $${c.amount.toFixed(2)}`).join('\n') : '  - No revenue recorded'}

EXPENSE BREAKDOWN:
${expensesByCategory.length > 0 ? expensesByCategory.map(c => `  - ${c.name}: $${c.amount.toFixed(2)}`).join('\n') : '  - No expenses recorded'}

BALANCE SHEET:
- Total Assets (Bank Accounts): $${totalAssets.toFixed(2)}
- Active Bank Accounts: ${bankAccounts.filter(a => a.is_active).length}
${bankAccounts.filter(a => a.is_active).map(a => `  - ${a.account_name}: $${Number(a.current_balance || 0).toFixed(2)}`).join('\n')}

TRANSACTION SUMMARY:
- Total Transactions: ${transactions.length}
- Total Vendors: ${vendors.length}
- Recurring Transactions: ${recurring.length}
- Active Budgets: ${budgets.length}

ADDITIONAL METRICS:
- Average Transaction Size: $${transactions.length > 0 ? (transactions.reduce((sum, t) => sum + Number(t.amount), 0) / transactions.length).toFixed(2) : '0.00'}
- Transactions Needing Review: ${transactions.filter(t => t.needs_review).length}
`;

    const messages = [
      {
        role: 'system',
        content: `You are Monica, an expert bookkeeping assistant specializing in small business finance. You help users with:

- Transaction categorization and recording
- Financial statement interpretation (P&L, Balance Sheet, Cash Flow)
- Tax preparation guidance and deductions
- Cash flow analysis and forecasting
- Expense tracking best practices
- Accounting terminology and concepts

You have FULL ACCESS to the user's financial data including all transactions, profit and loss statements, balance sheet information, vendors, budgets, and recurring transactions.

${contextInfo}

CRITICAL FORMATTING RULES:
- Write in plain, clean text without any markdown formatting
- Do NOT use asterisks, underscores, or other symbols for emphasis
- Do NOT use bullet points with symbols (-, *, •)
- Write numbered lists as simple text (1. Item, 2. Item)
- Use simple line breaks to separate sections
- Keep responses conversational and natural

You provide clear, accurate, and actionable advice. When discussing financial matters, be specific and professional, referencing their actual data when relevant. You can see their complete financial picture for the current year. If you're unsure about something, recommend consulting a certified accountant.

Keep responses concise and well-formatted with simple paragraphs.`
      },
      ...(conversationHistory || []),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error response:', errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      
      throw new Error(`Lovable AI error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        response: assistantMessage,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-chat:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

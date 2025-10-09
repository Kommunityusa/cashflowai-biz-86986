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

    // Fetch user's financial data for context
    const [transactionsResult, categoriesResult, bankAccountsResult, budgetsResult] = await Promise.all([
      supabaseClient.from('transactions').select('*').order('transaction_date', { ascending: false }).limit(50),
      supabaseClient.from('categories').select('*'),
      supabaseClient.from('bank_accounts').select('*').eq('is_active', true),
      supabaseClient.from('budgets').select('*, categories(name)').eq('is_active', true)
    ]);

    const transactions = transactionsResult.data || [];
    const categories = categoriesResult.data || [];
    const bankAccounts = bankAccountsResult.data || [];
    const budgets = budgetsResult.data || [];

    // Calculate financial metrics
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const categorySpending = categories.map(cat => {
      const spent = transactions
        .filter(t => t.category_id === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { name: cat.name, amount: spent };
    }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 5);

    console.log('Calling Lovable AI chat with user context...');
    
    // Build messages array with conversation history and financial context
    const contextInfo = `

CURRENT FINANCIAL CONTEXT:
- Total Income (Recent): $${totalIncome.toFixed(2)}
- Total Expenses (Recent): $${totalExpenses.toFixed(2)}
- Net Cash Flow: $${(totalIncome - totalExpenses).toFixed(2)}
- Active Bank Accounts: ${bankAccounts.length}
- Recent Transactions: ${transactions.length}
${categorySpending.length > 0 ? `\nTop Spending Categories:\n${categorySpending.map(c => `  - ${c.name}: $${c.amount.toFixed(2)}`).join('\n')}` : ''}
${budgets.length > 0 ? `\nActive Budgets: ${budgets.length}` : ''}
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

You have access to the user's current financial data and can provide personalized insights based on their actual numbers.

${contextInfo}

CRITICAL FORMATTING RULES:
- Write in plain, clean text without any markdown formatting
- Do NOT use asterisks, underscores, or other symbols for emphasis
- Do NOT use bullet points with symbols (-, *, •)
- Write numbered lists as simple text (1. Item, 2. Item)
- Use simple line breaks to separate sections
- Keep responses conversational and natural

You provide clear, accurate, and actionable advice. When discussing financial matters, be specific and professional, referencing their actual data when relevant. If you're unsure about something, recommend consulting a certified accountant.

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

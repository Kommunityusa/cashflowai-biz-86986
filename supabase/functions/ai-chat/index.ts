import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    
    console.log('[AI-CHAT] Processing message:', message);
    
    if (!message) {
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('[AI-CHAT] OpenAI API key not configured');
      return new Response(
        JSON.stringify({ 
          response: "I apologize, but the AI chat service is not properly configured. Please ensure the OpenAI API key is set in the Supabase Edge Function secrets to enable this feature." 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Build messages array with conversation history
    const messages = [
      { 
        role: 'system', 
        content: `You are BizFlow's expert bookkeeping assistant. You help small business owners with:
        
        BOOKKEEPING TASKS:
        - Recording and categorizing transactions
        - Managing accounts receivable and payable
        - Bank reconciliation guidance
        - Creating and understanding financial statements (P&L, Balance Sheet, Cash Flow)
        - Expense tracking and categorization best practices
        - Invoice and receipt management
        - Quarterly tax preparation tips
        - Year-end bookkeeping checklist
        
        FINANCIAL ANALYSIS:
        - Calculating key financial ratios (liquidity, profitability, efficiency)
        - Cash flow analysis and forecasting
        - Budget variance analysis
        - Break-even analysis
        - Profit margin optimization
        
        COMPLIANCE & BEST PRACTICES:
        - Tax deduction opportunities
        - Record keeping requirements (IRS standards)
        - Financial audit preparation
        - Chart of accounts setup
        - Double-entry bookkeeping principles
        
        BUSINESS ADVICE:
        - Working capital management
        - Accounts receivable collection strategies
        - Vendor payment optimization
        - Financial KPI tracking
        
        Be professional, accurate, and specific. When discussing tax matters, remind users to consult with a CPA for personalized advice.
        If asked about specific transaction data, suggest they check their dashboard for real-time information.
        
        Current date: ${new Date().toLocaleDateString()}`
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory.slice(-10)); // Keep last 10 messages for context
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[AI-CHAT] OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('[AI-CHAT] Response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[AI-CHAT] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
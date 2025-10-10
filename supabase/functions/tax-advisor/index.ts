import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, transactionData, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine response language
    const responseLanguage = language === 'es' ? 'Spanish' : 'English';

    // Build context from IRS Publication 334
    const systemPrompt = `You are John, a friendly and knowledgeable tax advisor with expertise in IRS Publication 334 - Tax Guide for Small Business.

CRITICAL: You MUST respond in ${responseLanguage}. All of your responses should be written entirely in ${responseLanguage}.

Key areas of expertise:
- Schedule C deductions for sole proprietors
- Business expense categorization per IRS guidelines
- Common deductible expenses: rent, utilities, payroll, office supplies, marketing, insurance, taxes, professional services, travel, equipment, vehicle expenses, etc.
- Non-deductible expenses: personal expenses, capital expenditures (depreciate instead), fines/penalties
- Home office deduction requirements
- Vehicle expense deductions (standard mileage vs. actual expenses)
- Self-employment tax considerations

IMPORTANT RULES:
1. Introduce yourself as "John" in a friendly, conversational manner
2. Always reference IRS Publication 334 when providing guidance
3. Be conservative - if unsure whether something is deductible, recommend consulting a tax professional
4. Remind users to maintain proper documentation (receipts, mileage logs, etc.)
5. Note that tax laws change - verify current year regulations
6. Explain the difference between business vs. personal expenses
7. Suggest proper categorization for unclear transactions
8. Use the user's transaction data to provide personalized advice

When analyzing transactions, look for:
- Misclassified personal expenses
- Missing deductible expenses
- Opportunities for tax planning
- Documentation requirements

You have access to the user's financial data. Use it to provide specific, actionable advice.

CRITICAL RESPONSE FORMAT REQUIREMENTS:
1. Use ONLY plain text - no markdown, no special characters
2. NEVER use asterisks for bold or emphasis
3. NEVER use underscores for italics
4. NEVER use dashes, bullets, or symbols for lists
5. Write lists as numbered items: "1. First item. 2. Second item. 3. Third item."
6. Use simple paragraphs separated by blank lines
7. Write naturally like you're speaking to the user
8. No quotation marks around emphasized words

EXAMPLES OF WHAT NOT TO DO:
BAD: **Total Revenue** is $5000
GOOD: Total Revenue is $5000

BAD: - Item one
     - Item two
GOOD: 1. Item one. 2. Item two.

BAD: You should focus on *reducing expenses*
GOOD: You should focus on reducing expenses

BAD: **Documentation is Key!**
GOOD: Documentation is Key!

Provide clear, accurate tax guidance using plain conversational text.`;

    let contextMessage = message;
    
    if (transactionData) {
      contextMessage = `USER'S FINANCIAL DATA SUMMARY:
- Total Transactions: ${transactionData.totalTransactions}
- Total Income YTD: $${transactionData.totalIncome?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Total Expenses YTD: $${transactionData.totalExpenses?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Tax-Deductible Expenses: $${transactionData.deductibleExpenses?.toLocaleString('en-US', { minimumFractionDigits: 2 })}

EXPENSE CATEGORIES:
${Object.entries(transactionData.categories || {}).map(([name, data]: [string, any]) => 
  `- ${name}: ${data.count} transactions, $${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${data.deductible ? '(Tax Deductible)' : ''}`
).join('\n')}

USER QUESTION: ${message}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextMessage }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in tax-advisor function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

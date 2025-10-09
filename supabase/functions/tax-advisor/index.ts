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
    const { message, transactions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from IRS Publication 334
    const systemPrompt = `You are a tax advisor assistant with expertise in IRS Publication 334 - Tax Guide for Small Business.

Key areas of expertise:
- Schedule C deductions for sole proprietors
- Business expense categorization per IRS guidelines
- Common deductible expenses: rent, utilities, payroll, office supplies, marketing, insurance, taxes, professional services, travel, equipment, vehicle expenses, etc.
- Non-deductible expenses: personal expenses, capital expenditures (depreciate instead), fines/penalties
- Home office deduction requirements
- Vehicle expense deductions (standard mileage vs. actual expenses)
- Self-employment tax considerations

IMPORTANT RULES:
1. Always reference IRS Publication 334 when providing guidance
2. Be conservative - if unsure whether something is deductible, recommend consulting a tax professional
3. Remind users to maintain proper documentation (receipts, mileage logs, etc.)
4. Note that tax laws change - verify current year regulations
5. Explain the difference between business vs. personal expenses
6. Suggest proper categorization for unclear transactions

When analyzing transactions, look for:
- Misclassified personal expenses
- Missing deductible expenses
- Opportunities for tax planning
- Documentation requirements`;

    const userMessage = transactions 
      ? `Analyze these business transactions and provide tax insights:\n${JSON.stringify(transactions, null, 2)}\n\nUser question: ${message}`
      : message;

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
          { role: "user", content: userMessage }
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

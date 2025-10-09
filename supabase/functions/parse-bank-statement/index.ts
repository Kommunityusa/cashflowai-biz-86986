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

    // Get the PDF file from formData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('[PARSE-STATEMENT] Processing PDF file:', file.name);

    // Convert file to base64 for AI processing
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));

    // Call Lovable AI to extract transactions from the PDF
    console.log('[PARSE-STATEMENT] Calling AI to extract transactions...');
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
            content: `You are an expert at extracting transaction data from bank statements. 
Extract ALL transactions from this bank statement PDF and return them as a JSON array.

For each transaction, determine:
1. Date - in YYYY-MM-DD format (if year is missing, use 2025)
2. Description - the merchant/vendor name
3. Amount - the absolute numeric value (without $ or commas)
4. Type - determine if it's "income" or "expense":
   - INCOME: Look for indicators like "ACH In", "Deposit", "Credit", "Transfer In", amounts that increase the balance
   - EXPENSE: Look for indicators like "ACH Pull", "ACH Payment", "Transfer Out", "Withdrawal", amounts that decrease the balance
   - Check if the amount has a minus sign (-) which indicates expense
   - Look at the "Type" column if present for clues

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "transactions": [
    {
      "date": "2025-01-15",
      "description": "Stripe Payment",
      "amount": 150.00,
      "type": "income",
      "vendor_name": "Stripe"
    }
  ]
}

CRITICAL: Extract EVERY transaction from the statement. Do not skip any. Look through all pages.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all transactions from this bank statement PDF. Return the result as pure JSON only.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PARSE-STATEMENT] AI error:', errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      
      throw new Error(`AI error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    console.log('[PARSE-STATEMENT] AI response received');
    
    let extractedData;
    try {
      const content = aiResponse.choices[0].message.content.trim();
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[PARSE-STATEMENT] Failed to parse AI response:', parseError);
      throw new Error('Failed to parse transaction data from PDF');
    }

    const transactions = extractedData.transactions || [];
    
    if (transactions.length === 0) {
      throw new Error('No transactions found in the PDF');
    }

    console.log(`[PARSE-STATEMENT] Extracted ${transactions.length} transactions`);

    // Insert transactions into the database
    const transactionsToInsert = transactions.map((t: any) => ({
      user_id: user.id,
      description: t.description || '',
      vendor_name: t.vendor_name || t.description || '',
      amount: Math.abs(parseFloat(t.amount)),
      type: t.type || 'expense',
      transaction_date: t.date,
      status: 'completed',
      needs_review: true, // Mark for review since it's imported
    }));

    const { data: insertedTransactions, error: insertError } = await supabaseClient
      .from('transactions')
      .insert(transactionsToInsert)
      .select();

    if (insertError) {
      console.error('[PARSE-STATEMENT] Insert error:', insertError);
      throw new Error(`Failed to save transactions: ${insertError.message}`);
    }

    console.log(`[PARSE-STATEMENT] Successfully inserted ${insertedTransactions?.length || 0} transactions`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${insertedTransactions?.length || 0} transactions from PDF`,
        transactions: insertedTransactions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PARSE-STATEMENT] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('[PARSE-STATEMENT] Processing PDF:', file.name, 'Size:', file.size);

    // Convert to base64 using Deno's standard library (handles large files better)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = encodeBase64(uint8Array);

    console.log('[PARSE-STATEMENT] Converted to base64, length:', base64.length);
    console.log('[PARSE-STATEMENT] Calling AI to extract transactions...');

    // Call Lovable AI with PDF as base64
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
            content: `You are an expert at extracting transaction data from bank statement PDFs.
Extract ALL transactions and return as JSON.

RULES:
1. Parse dates to YYYY-MM-DD (use 2025 if year missing)
2. Extract merchant/vendor name
3. Amount as absolute positive number (no $ or commas)
4. Determine type:
   - INCOME: "ACH In", "Deposit", "Credit", "Transfer In", amounts increasing balance
   - EXPENSE: "ACH Pull", "Payment", "Transfer Out", "Withdrawal", amounts decreasing balance
5. Extract EVERY transaction

Return ONLY valid JSON (no markdown):
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
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all transactions from this bank statement. Return pure JSON only.'
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
      console.error('[PARSE-STATEMENT] AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Credits required. Please add funds to continue.');
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('[PARSE-STATEMENT] AI response received');
    
    let extractedData;
    try {
      const content = aiResponse.choices[0].message.content.trim();
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[PARSE-STATEMENT] Parse error:', parseError);
      throw new Error('Failed to extract transactions from PDF');
    }

    const transactions = extractedData.transactions || [];
    
    if (transactions.length === 0) {
      throw new Error('No transactions found in PDF');
    }

    console.log(`[PARSE-STATEMENT] Extracted ${transactions.length} transactions`);

    // Insert into database
    const transactionsToInsert = transactions.map((t: any) => ({
      user_id: user.id,
      description: t.description || '',
      vendor_name: t.vendor_name || t.description || '',
      amount: Math.abs(parseFloat(t.amount)),
      type: t.type || 'expense',
      transaction_date: t.date,
      status: 'completed',
      needs_review: true,
    }));

    const { data: insertedTransactions, error: insertError } = await supabaseClient
      .from('transactions')
      .insert(transactionsToInsert)
      .select();

    if (insertError) {
      console.error('[PARSE-STATEMENT] Insert error:', insertError);
      throw new Error(`Failed to save transactions: ${insertError.message}`);
    }

    console.log(`[PARSE-STATEMENT] Saved ${insertedTransactions?.length || 0} transactions`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${insertedTransactions?.length || 0} transactions`,
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

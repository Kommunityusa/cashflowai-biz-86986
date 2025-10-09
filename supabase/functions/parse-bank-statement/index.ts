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

    console.log('[PARSE-STATEMENT] Processing PDF file:', file.name, 'Size:', file.size);

    // Read PDF as text (simple extraction - works for text-based PDFs)
    const arrayBuffer = await file.arrayBuffer();
    const pdfText = new TextDecoder().decode(arrayBuffer);
    
    console.log('[PARSE-STATEMENT] Extracted text length:', pdfText.length);

    // Call Lovable AI to extract transactions from the text
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
            content: `You are an expert at extracting transaction data from bank statement text. 
Extract ALL transactions and return them as a JSON array.

IMPORTANT RULES:
1. Parse dates correctly to YYYY-MM-DD format (if year is missing, use 2025)
2. Extract merchant/vendor name from description
3. Parse amount as absolute positive number (no $ or commas)
4. Determine transaction type:
   - INCOME: "ACH In", "Deposit", "Credit", "Transfer In", or positive amounts that increase balance
   - EXPENSE: "ACH Pull", "ACH Payment", "Transfer Out", "Withdrawal", or negative amounts that decrease balance
5. Extract EVERY transaction - do not skip any

Return ONLY valid JSON (no markdown, no code blocks):
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
            content: `Extract all transactions from this bank statement text:\n\n${pdfText.substring(0, 50000)}`
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
      
      // Fallback: try regex parsing
      console.log('[PARSE-STATEMENT] Attempting fallback regex parsing...');
      const transactions = [];
      const lines = pdfText.split('\n');
      
      for (const line of lines) {
        // Look for patterns like: Jan 15  Description  $123.45
        const datePattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i;
        const amountPattern = /\$?\s?([\d,]+\.?\d{0,2})/g;
        
        const dateMatch = line.match(datePattern);
        if (dateMatch) {
          const amounts = Array.from(line.matchAll(amountPattern));
          if (amounts.length > 0) {
            let description = line.substring(dateMatch.index! + dateMatch[0].length);
            for (const match of amounts) {
              description = description.replace(match[0], '');
            }
            description = description.trim();
            
            if (description && amounts.length > 0) {
              const amountStr = amounts[0][1] || '';
              const amount = Math.abs(parseFloat(amountStr.replace(/,/g, '')));
              
              if (amount > 0) {
                // Convert date like "Jan 15" to "2025-01-15"
                const monthMap: Record<string, string> = {
                  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                  'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                  'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
                };
                const parts = dateMatch[0].toLowerCase().split(/\s+/);
                const month = monthMap[parts[0]];
                const day = parts[1].padStart(2, '0');
                
                transactions.push({
                  date: `2025-${month}-${day}`,
                  description: description.substring(0, 200),
                  amount: amount,
                  type: 'expense',
                  vendor_name: description.split(/\s+/).slice(0, 3).join(' ')
                });
              }
            }
          }
        }
      }
      
      if (transactions.length > 0) {
        extractedData = { transactions };
        console.log('[PARSE-STATEMENT] Fallback extracted', transactions.length, 'transactions');
      } else {
        throw new Error('Failed to parse transaction data from PDF');
      }
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

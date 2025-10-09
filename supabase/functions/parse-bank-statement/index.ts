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

    // Get the file from the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('[PDF Parser] Processing file:', file.name, file.type, file.size);

    // Read the PDF file as text for now (PDFs need special parsing)
    // For proper PDF parsing, we'll use AI to extract text
    const pdfBytes = await file.arrayBuffer();
    const pdfText = new TextDecoder().decode(pdfBytes);
    
    console.log('[PDF Parser] Extracted text length:', pdfText.length);

    // Use AI to parse the PDF and extract ALL transactions
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('[PDF Parser] Calling AI to extract transactions...');

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
            content: `You are a financial data extraction expert. Extract ALL transactions from bank statement text.
            
CRITICAL: Extract EVERY SINGLE transaction - do not skip any!

Rules:
- Return ONLY a valid JSON array, no markdown formatting, no explanations
- Each transaction MUST have: date (YYYY-MM-DD format), description (string), amount (positive number), vendor_name (string)
- Parse dates correctly - common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, "Jan 15 2024"
- Extract EVERY transaction you find - no sampling, no skipping
- Amount should be positive number only (no $ signs or commas in the JSON)
- Description should be clean and concise (remove extra spaces)
- Vendor name should be the merchant/payee name (first few words of description)
- If you see patterns like "Date Description Amount Balance", parse each row as a transaction
- Look for transaction tables, lists, and records throughout the entire document

Example output format (JSON ARRAY ONLY):
[{"date":"2024-01-15","description":"Purchase at Store","amount":50.00,"vendor_name":"Store"},{"date":"2024-01-16","description":"Gas Station","amount":35.50,"vendor_name":"Gas Station"}]`
          },
          {
            role: 'user',
            content: `Extract ALL transactions from this bank statement. DO NOT skip any transactions:\n\n${pdfText.substring(0, 30000)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PDF Parser] AI API error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('[PDF Parser] AI response received');

    let transactions = [];
    try {
      const content = aiResponse.choices[0].message.content;
      console.log('[PDF Parser] AI content preview:', content.substring(0, 200));
      
      // Extract JSON from the response (handle markdown wrapping)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        if (Array.isArray(extracted)) {
          transactions = extracted;
          console.log('[PDF Parser] Extracted', transactions.length, 'transactions from AI');
        }
      } else {
        console.error('[PDF Parser] No JSON array found in AI response');
      }
    } catch (e) {
      console.error('[PDF Parser] Failed to parse AI response:', e);
    }

    if (transactions.length === 0) {
      console.warn('[PDF Parser] No transactions extracted, trying fallback regex parsing...');
      
      // Fallback: Try basic regex parsing
      const lines = pdfText.split('\n');
      const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
      const amountPattern = /[-+]?\$?\s?([\d,]+\.?\d{0,2})/g;
      
      for (const line of lines) {
        const dateMatch = line.match(datePattern);
        if (dateMatch) {
          const remainingText = line.substring(dateMatch.index! + dateMatch[0].length).trim();
          const amounts = Array.from(remainingText.matchAll(amountPattern));
          
          if (amounts.length > 0) {
            let description = remainingText;
            for (const match of amounts) {
              description = description.replace(match[0], '');
            }
            description = description.trim().replace(/\s+/g, ' ');
            
            const amountStr = amounts[amounts.length - 1][1] || '';
            const amount = Math.abs(parseFloat(amountStr.replace(/,/g, '')));
            
            if (description && amount > 0) {
              const parts = dateMatch[1].split(/[\/\-]/);
              const month = parseInt(parts[0]);
              const day = parseInt(parts[1]);
              const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              
              const formattedDate = month > 12 
                ? `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
                : `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
              
              transactions.push({
                date: formattedDate,
                description: description.substring(0, 200),
                amount: amount,
                vendor_name: description.split(/\s+/).slice(0, 3).join(' ')
              });
            }
          }
        }
      }
      console.log('[PDF Parser] Fallback regex found', transactions.length, 'transactions');
    }

    // Save transactions to database
    const savedTransactions = [];
    console.log('[PDF Parser] Saving', transactions.length, 'transactions to database...');
    
    for (const trans of transactions) {
      const { data, error } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: user.id,
          description: trans.description,
          vendor_name: trans.vendor_name,
          amount: trans.amount,
          type: 'expense',
          transaction_date: trans.date,
          status: 'pending',
          needs_review: true,
        })
        .select()
        .single();
      
      if (data) {
        savedTransactions.push(data);
      } else if (error) {
        console.error('[PDF Parser] Failed to save transaction:', error);
      }
    }

    console.log('[PDF Parser] Successfully saved', savedTransactions.length, 'transactions');

    return new Response(
      JSON.stringify({ 
        transactions: savedTransactions,
        count: savedTransactions.length,
        message: `Imported ${savedTransactions.length} transactions from PDF`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PDF Parser] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
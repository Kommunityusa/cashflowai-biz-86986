import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const PDFCO_API_KEY = Deno.env.get('PDFCO_API_KEY');

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

    // Step 1: Upload PDF directly to PDF.co using binary upload
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload', {
      method: 'POST',
      headers: {
        'x-api-key': PDFCO_API_KEY || '',
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[PARSE-STATEMENT] PDF.co upload error:', errorText);
      throw new Error('Failed to upload PDF to PDF.co');
    }

    const uploadData = await uploadResponse.json();
    const pdfUrl = uploadData.url;

    console.log('[PARSE-STATEMENT] PDF uploaded successfully to PDF.co');
    console.log('[PARSE-STATEMENT] Extracting text from PDF using OCR...');

    // Step 2: Extract text from PDF using PDF.co OCR (handles scanned/image-based PDFs)
    const extractResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'x-api-key': PDFCO_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
        async: false,
        ocr: true,  // Enable OCR for image-based PDFs
        ocrLanguage: 'eng',
      }),
    });

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error('[PARSE-STATEMENT] PDF.co extraction error:', errorText);
      throw new Error('Failed to extract text from PDF');
    }

    const extractData = await extractResponse.json();
    console.log('[PARSE-STATEMENT] PDF.co extraction response:', JSON.stringify(extractData).substring(0, 500));
    
    // PDF.co returns a URL to the extracted text, fetch it
    const textUrl = extractData.url;
    if (!textUrl) {
      console.error('[PARSE-STATEMENT] No URL in PDF.co response:', JSON.stringify(extractData));
      throw new Error('PDF.co did not return a text URL');
    }

    console.log('[PARSE-STATEMENT] Fetching extracted text from:', textUrl);
    const textResponse = await fetch(textUrl);
    if (!textResponse.ok) {
      throw new Error('Failed to fetch extracted text from PDF.co');
    }
    
    const pdfText = await textResponse.text();

    console.log('[PARSE-STATEMENT] Extracted text length:', pdfText.length);
    console.log('[PARSE-STATEMENT] Text preview:', pdfText.substring(0, 500));
    
    if (!pdfText || pdfText.trim().length === 0) {
      console.error('[PARSE-STATEMENT] PDF.co returned empty text');
      throw new Error('No text could be extracted from the PDF. The PDF might be image-based or encrypted.');
    }

    console.log('[PARSE-STATEMENT] Calling AI to parse transactions...');

    // Step 3: Use AI to parse transactions from extracted text
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `Extract ALL transactions from this bank statement text and return as JSON array.

RULES:
1. Date format: YYYY-MM-DD (use 2025 if year missing)
2. Extract merchant/vendor name
3. Amount: absolute positive number (no $ or commas)
4. Type determination:
   - INCOME: "ACH In", "Deposit", "Credit", "Transfer In", positive amounts, balance increases
   - EXPENSE: "ACH Pull", "ACH Payment", "Transfer Out", "Withdrawal", negative amounts with minus sign, balance decreases
5. Extract EVERY single transaction - do not skip any

Return ONLY valid JSON (no markdown, no explanations):
{
  "transactions": [
    {
      "date": "2025-01-15",
      "description": "Merchant Name",
      "amount": 150.00,
      "type": "income",
      "vendor_name": "Merchant Name"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Extract all transactions from this bank statement:\n\n${pdfText.substring(0, 50000)}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[PARSE-STATEMENT] AI error:', errorText);
      throw new Error('AI extraction failed');
    }

    const aiData = await aiResponse.json();
    
    let extractedData;
    try {
      const content = aiData.choices[0].message.content.trim();
      console.log('[PARSE-STATEMENT] AI response preview:', content.substring(0, 500));
      
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanContent);
      console.log('[PARSE-STATEMENT] Parsed data, transaction count:', extractedData.transactions?.length || 0);
    } catch (parseError) {
      console.error('[PARSE-STATEMENT] Parse error:', parseError);
      console.error('[PARSE-STATEMENT] Raw AI response:', aiData.choices[0].message.content.substring(0, 1000));
      throw new Error('Failed to parse AI response');
    }

    const transactions = extractedData.transactions || [];
    
    if (transactions.length === 0) {
      console.error('[PARSE-STATEMENT] No transactions in parsed data');
      console.error('[PARSE-STATEMENT] Full AI response:', JSON.stringify(aiData.choices[0].message.content).substring(0, 2000));
      throw new Error('No transactions found in PDF. The AI could not extract transaction data from the statement.');
    }

    console.log(`[PARSE-STATEMENT] Found ${transactions.length} transactions`);

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
      throw new Error(`Failed to save: ${insertError.message}`);
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

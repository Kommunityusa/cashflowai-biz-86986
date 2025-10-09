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

    const { pdfText, bankAccountId } = await req.json();
    
    if (!pdfText) {
      return new Response(
        JSON.stringify({ error: 'No PDF text provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse transactions from text using regex patterns
    const transactions = [];
    const lines = pdfText.split('\n');
    
    // Enhanced parsing with multiple date formats
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,  // MM/DD/YYYY or DD/MM/YYYY
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,    // YYYY-MM-DD
      /(\w{3}\s+\d{1,2},?\s+\d{4})/,           // Jan 15, 2024
    ];
    
    const amountPattern = /[-+]?\$?\s?([\d,]+\.?\d{0,2})/g;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.length < 10) continue; // Skip empty or very short lines
      
      let dateMatch = null;
      let dateStr = '';
      let patternUsed = 0;
      
      // Try each date pattern
      for (let p = 0; p < datePatterns.length; p++) {
        dateMatch = line.match(datePatterns[p]);
        if (dateMatch) {
          dateStr = dateMatch[1];
          patternUsed = p;
          break;
        }
      }
      
      if (dateMatch && dateStr) {
        const remainingText = line.substring(dateMatch.index! + dateMatch[0].length).trim();
        const amounts: RegExpMatchArray[] = Array.from(remainingText.matchAll(amountPattern));
        
        if (amounts.length > 0) {
          // Extract description (text before amounts)
          let description = remainingText;
          for (const match of amounts) {
            description = description.replace(match[0], '');
          }
          description = description.trim().replace(/\s+/g, ' ');
          
          // Get the last amount (usually the transaction amount)
          const lastMatch: RegExpMatchArray = amounts[amounts.length - 1];
          const amountStr: string = lastMatch[1] || '';
          const amount = Math.abs(parseFloat(amountStr.replace(/,/g, '')));
          
          if (description && amount > 0) {
            // Parse date based on pattern used
            let formattedDate = '';
            try {
              if (patternUsed === 0) {
                // MM/DD/YYYY or DD/MM/YYYY - try both
                const parts = dateStr.split(/[\/\-]/);
                const month = parseInt(parts[0]);
                const day = parseInt(parts[1]);
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                
                // If month > 12, assume DD/MM/YYYY format
                if (month > 12) {
                  formattedDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else {
                  formattedDate = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                }
              } else if (patternUsed === 1) {
                // YYYY-MM-DD
                formattedDate = dateStr;
              } else {
                // Month name format
                const parsedDate = new Date(dateStr);
                if (!isNaN(parsedDate.getTime())) {
                  formattedDate = parsedDate.toISOString().split('T')[0];
                }
              }
              
              if (formattedDate && formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                transactions.push({
                  date: formattedDate,
                  description: description.substring(0, 200), // Limit description length
                  amount: amount,
                  type: 'expense',
                  vendor_name: description.split(/\s+/).slice(0, 3).join(' ') // First 3 words
                });
              }
            } catch (e) {
              console.error('Date parsing error:', e);
            }
          }
        }
      }
    }

    // If we couldn't parse structured data, try with Lovable AI
    if (transactions.length === 0) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (LOVABLE_API_KEY) {
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
                content: `You are a financial data extraction expert. Extract ALL transactions from the bank statement text.
                
Rules:
- Return ONLY a valid JSON array, no markdown formatting
- Each transaction must have: date (YYYY-MM-DD format), description (string), amount (positive number), vendor_name (string)
- Parse dates correctly - common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, "Jan 15 2024"
- Extract ALL transactions, not just a sample
- Amount should be positive number only
- Description should be clean and concise
- Vendor name should be the merchant/payee name

Example output format:
[{"date":"2024-01-15","description":"Purchase at Store","amount":50.00,"vendor_name":"Store"}]`
              },
              {
                role: 'user',
                content: `Extract ALL transactions from this statement:\n\n${pdfText.substring(0, 15000)}`
              }
            ],
            temperature: 0.1,
            max_tokens: 4000,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          try {
            const content = aiResponse.choices[0].message.content;
            // Extract JSON from the response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const extracted = JSON.parse(jsonMatch[0]);
              if (Array.isArray(extracted)) {
                transactions.push(...extracted);
              }
            }
          } catch (e) {
            console.error('Failed to parse AI response:', e);
          }
        }
      }
    }

    // Save transactions to database
    const savedTransactions = [];
    for (const trans of transactions) {
      const { data, error } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: user.id,
          description: trans.description,
          vendor_name: trans.vendor_name,
          amount: trans.amount,
          type: 'expense', // Default, will be categorized
          transaction_date: trans.date,
          bank_account_id: bankAccountId,
          status: 'pending',
          needs_review: true,
        })
        .select()
        .single();
      
      if (data) {
        savedTransactions.push(data);
      }
    }

    return new Response(
      JSON.stringify({ 
        transactions: savedTransactions,
        count: savedTransactions.length,
        message: `Imported ${savedTransactions.length} transactions from PDF`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in parse-bank-statement:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
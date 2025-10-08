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
    
    // Common bank statement patterns
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const amountPattern = /\$?([\d,]+\.?\d{0,2})/g;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dateMatch = line.match(datePattern);
      
      if (dateMatch) {
        // Extract transaction details
        const dateStr = dateMatch[1];
        const remainingText = line.substring(dateMatch.index! + dateMatch[0].length).trim();
        
        // Look for amounts (could be debit/credit)
        const amounts = remainingText.match(amountPattern);
        
        if (amounts && amounts.length > 0) {
          // Extract description (text between date and amount)
          let description = remainingText;
          amounts.forEach((amt: string) => {
            description = description.replace(amt, '');
          });
          description = description.trim().replace(/\s+/g, ' ');
          
          // Parse amount
          const amount = parseFloat(amounts[amounts.length - 1].replace(/[$,]/g, ''));
          
          if (description && amount > 0) {
            // Parse date properly
            const [month, day, year] = dateStr.split(/[\/\-]/);
            const fullYear = year.length === 2 ? `20${year}` : year;
            const formattedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            
            transactions.push({
              date: formattedDate,
              description: description,
              amount: amount,
              type: 'expense', // Will be determined by AI
              vendor_name: description.split(/\s+/)[0] // First word as vendor
            });
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
                content: 'Extract financial transactions from bank statement text. Return a JSON array with: date (YYYY-MM-DD), description, amount (positive number), vendor_name.'
              },
              {
                role: 'user',
                content: `Extract all transactions:\n${pdfText.substring(0, 10000)}`
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
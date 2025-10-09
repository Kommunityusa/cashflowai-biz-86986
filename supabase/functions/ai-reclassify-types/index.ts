import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Starting reclassification for user:', user.id);

    // Start background processing
    const processTransactions = async () => {
      try {
        // Fetch transactions in batches of 50
        const BATCH_SIZE = 50;
        let offset = 0;
        let totalUpdated = 0;

        while (true) {
          const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('id, description, amount, type, vendor_name')
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: false })
            .range(offset, offset + BATCH_SIZE - 1);

          if (txError) {
            console.error('Error fetching transactions:', txError);
            break;
          }

          if (!transactions || transactions.length === 0) {
            break;
          }

          console.log(`Processing batch: ${offset} to ${offset + transactions.length}`);

          // Prepare transactions for AI analysis
          const transactionList = transactions.map(t => 
            `ID: ${t.id} | Amount: ${t.amount} | Current Type: ${t.type} | Vendor: ${t.vendor_name || 'N/A'} | Description: ${t.description}`
          ).join('\n');

          const systemPrompt = `You are a financial transaction classifier. Determine if transactions are correctly classified as "income" or "expense".

Rules:
- Positive amounts are typically income, negative amounts are typically expenses
- Look at vendor names and descriptions for context
- Common income sources: payments received, deposits, refunds, salary
- Common expenses: purchases, bills, subscriptions, transfers out
- Return ONLY valid JSON with no markdown formatting

Respond with a JSON array:
[
  {
    "id": "transaction-uuid",
    "correct_type": "income" or "expense",
    "confidence": "high" or "medium" or "low",
    "reason": "brief explanation"
  }
]`;

          const userPrompt = `Analyze these transactions and determine the correct type for each:\n\n${transactionList}`;

          console.log('Calling Lovable AI for batch...');

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
            }),
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error('AI API error:', aiResponse.status, errorText);
            break;
          }

          const aiData = await aiResponse.json();
          const aiContent = aiData.choices[0].message.content;
          
          // Parse AI response
          let classifications;
          try {
            const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? jsonMatch[0] : aiContent;
            classifications = JSON.parse(jsonStr);
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            break;
          }

          // Update transactions
          for (const classification of classifications) {
            const transaction = transactions.find(t => t.id === classification.id);
            if (!transaction) continue;

            const needsUpdate = transaction.type !== classification.correct_type;
            
            if (needsUpdate) {
              const { error: updateError } = await supabase
                .from('transactions')
                .update({ 
                  type: classification.correct_type,
                  needs_review: false
                })
                .eq('id', classification.id)
                .eq('user_id', user.id);

              if (!updateError) {
                totalUpdated++;
              }
            }
          }

          offset += BATCH_SIZE;

          // Prevent infinite loop
          if (transactions.length < BATCH_SIZE) {
            break;
          }
        }

        console.log(`Reclassification complete. Total updated: ${totalUpdated}`);
      } catch (error) {
        console.error('Background processing error:', error);
      }
    };

    // Run in background
    processTransactions();

    // Return immediately
    return new Response(JSON.stringify({
      message: 'Transaction reclassification started in background',
      status: 'processing'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ai-reclassify-types:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

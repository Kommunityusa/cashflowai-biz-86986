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

    console.log('Fetching transactions for user:', user.id);

    // Fetch transactions in smaller batches - only last 100 transactions to avoid timeout
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, description, amount, type, vendor_name')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(100);

    if (txError) {
      console.error('Error fetching transactions:', txError);
      throw txError;
    }

    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No transactions to reclassify',
        updated: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${transactions.length} transactions`);

    // Prepare transactions for AI analysis
    const transactionList = transactions.map(t => 
      `ID: ${t.id} | Amount: ${t.amount} | Current Type: ${t.type} | Vendor: ${t.vendor_name || 'N/A'} | Description: ${t.description}`
    ).join('\n');

    const systemPrompt = `You are a financial transaction classifier. Your job is to determine if transactions are correctly classified as "income" or "expense".

Rules:
- Positive amounts are typically income, negative amounts are typically expenses
- Look at vendor names and descriptions for context
- Common income sources: payments received, deposits, refunds, salary
- Common expenses: purchases, bills, subscriptions, transfers out
- Return ONLY valid JSON with no markdown formatting

Respond with a JSON array of objects with this exact structure:
[
  {
    "id": "transaction-uuid",
    "correct_type": "income" or "expense",
    "confidence": "high" or "medium" or "low",
    "reason": "brief explanation"
  }
]`;

    const userPrompt = `Analyze these transactions and determine the correct type for each:\n\n${transactionList}`;

    console.log('Calling Lovable AI for classification...');

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
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI Response received');

    // Parse AI response - handle potential markdown formatting
    let classifications;
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiContent;
      classifications = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Content:', aiContent);
      throw new Error('Failed to parse AI classification response');
    }

    console.log(`AI classified ${classifications.length} transactions`);

    // Update transactions with corrected types
    let updated = 0;
    const results = [];

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

        if (updateError) {
          console.error(`Error updating transaction ${classification.id}:`, updateError);
          results.push({
            id: classification.id,
            success: false,
            error: updateError.message
          });
        } else {
          updated++;
          results.push({
            id: classification.id,
            success: true,
            changed: `${transaction.type} → ${classification.correct_type}`,
            reason: classification.reason
          });
        }
      } else {
        results.push({
          id: classification.id,
          success: true,
          changed: null,
          reason: 'Already correct'
        });
      }
    }

    console.log(`Reclassification complete. Updated ${updated} transactions.`);

    return new Response(JSON.stringify({
      message: `Successfully reclassified ${updated} transactions`,
      total_analyzed: transactions.length,
      updated,
      results
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

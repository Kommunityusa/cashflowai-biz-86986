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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { user_id } = await req.json();
    
    if (!user_id) {
      throw new Error('User ID is required');
    }

    console.log('Starting auto-reconciliation for user:', user_id);

    // Fetch all unreconciled transactions from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: transactions, error: fetchError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
      .gte('transaction_date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false });

    if (fetchError) throw fetchError;

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No transactions to reconcile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${transactions.length} transactions for reconciliation`);

    // Use AI to identify potential duplicates and internal transfers
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a financial reconciliation expert. Analyze transactions to identify:

1. DUPLICATE TRANSACTIONS: Same amount, same date (or within 2 days), same description
2. INTERNAL TRANSFERS: Matching positive and negative amounts on same/similar dates between different accounts
   - Look for matching amounts with opposite signs (one positive, one negative)
   - Same or adjacent dates (within 1-2 business days)
   - Descriptions that indicate transfers, account movements, or internal movements
   - CRITICAL: These should be marked as is_internal_transfer=true because they are NOT revenue or expenses

For each match found, return JSON with this structure:
{
  "duplicates": [
    {
      "transaction_ids": ["id1", "id2"],
      "reason": "Same amount and description on same date",
      "confidence": "high"
    }
  ],
  "internal_transfers": [
    {
      "transaction_ids": ["id1", "id2"],
      "reason": "Matching transfer amounts between accounts - one debit, one credit",
      "confidence": "high"
    }
  ]
}

IMPORTANT: Internal transfers represent money moving BETWEEN accounts owned by the same user, NOT revenue or expenses.
Only flag transactions with "high" confidence. Be conservative to avoid false positives.`;

    const userPrompt = `Analyze these transactions and identify duplicates and internal transfers:

${JSON.stringify(transactions.map(t => ({
  id: t.id,
  date: t.transaction_date,
  amount: t.amount,
  description: t.description,
  type: t.type,
  bank_account_id: t.bank_account_id
})), null, 2)}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI reconciliation error:', errorText);
      throw new Error('Failed to get AI reconciliation analysis');
    }

    const aiResult = await aiResponse.json();
    const analysis = JSON.parse(aiResult.choices[0].message.content);

    console.log('AI Analysis:', analysis);

    let reconciledCount = 0;
    const updates = [];

    // Mark duplicates
    if (analysis.duplicates && analysis.duplicates.length > 0) {
      for (const duplicate of analysis.duplicates) {
        if (duplicate.confidence === 'high' && duplicate.transaction_ids.length > 1) {
          // Keep first transaction, mark others as needs_review with note
          for (let i = 1; i < duplicate.transaction_ids.length; i++) {
            updates.push({
              id: duplicate.transaction_ids[i],
              needs_review: true,
              notes: `Possible duplicate - ${duplicate.reason}`
            });
            reconciledCount++;
          }
        }
      }
    }

    // Mark internal transfers
    if (analysis.internal_transfers && analysis.internal_transfers.length > 0) {
      for (const transfer of analysis.internal_transfers) {
        if (transfer.confidence === 'high' && transfer.transaction_ids.length === 2) {
          for (const txId of transfer.transaction_ids) {
            updates.push({
              id: txId,
              is_internal_transfer: true,
              notes: `Internal transfer - ${transfer.reason}`
            });
            reconciledCount++;
          }
        }
      }
    }

    // Apply updates
    for (const update of updates) {
      const { error: updateError } = await supabaseClient
        .from('transactions')
        .update({
          needs_review: update.needs_review,
          is_internal_transfer: update.is_internal_transfer,
          notes: update.notes
        })
        .eq('id', update.id);

      if (updateError) {
        console.error('Error updating transaction:', update.id, updateError);
      }
    }

    console.log(`Reconciliation complete: ${reconciledCount} transactions flagged`);

    return new Response(
      JSON.stringify({ 
        success: true,
        reconciledCount,
        duplicatesFound: analysis.duplicates?.length || 0,
        transfersFound: analysis.internal_transfers?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-reconcile:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});


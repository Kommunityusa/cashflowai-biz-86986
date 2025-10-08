import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { description, amount, type, existingCategories } = body;
    
    console.log('AI Categorizing transaction:', { description, amount, type });

    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI API key not configured');
    }

    if (!description || amount === undefined || !type) {
      throw new Error('Missing required fields: description, amount, or type');
    }

    if (!existingCategories || existingCategories.length === 0) {
      throw new Error('No categories provided');
    }

    // Create system prompt with existing categories
    const relevantCategories = existingCategories
      .filter((cat: any) => cat.type === type)
      .map((cat: any) => cat.name);

    if (relevantCategories.length === 0) {
      throw new Error(`No categories available for type: ${type}`);
    }

    const categoriesList = relevantCategories.join(', ');

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
            content: `You are an expert financial categorization assistant for small business bookkeeping. Given a transaction description and amount, suggest the most appropriate category from this list: ${categoriesList}. 
            
            Rules:
            1. Only respond with the EXACT category name from the list
            2. Choose the most specific and accurate category
            3. Consider common business patterns (e.g., software subscriptions, office supplies, travel expenses)
            4. If uncertain, choose the most likely category
            5. Never add explanations, just the category name`
          },
          {
            role: 'user',
            content: `Transaction: "${description}" for $${amount}`
          }
        ],
        temperature: 0.2,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Lovable AI API error:', error);
      throw new Error(error.error?.message || 'Failed to categorize transaction');
    }

    const data = await response.json();
    const suggestedCategory = data.choices[0]?.message?.content?.trim();
    
    // Validate that the suggested category is in the list
    if (!relevantCategories.includes(suggestedCategory)) {
      console.warn(`AI suggested "${suggestedCategory}" which is not in available categories. Using fallback.`);
      const fallbackCategory = type === 'expense' ? 'Other Expenses' : 'Other Income';
      return new Response(
        JSON.stringify({ category: fallbackCategory }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log('AI suggested category:', suggestedCategory);

    return new Response(
      JSON.stringify({ category: suggestedCategory }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-categorize function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
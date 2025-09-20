import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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
    const { description, amount, type, existingCategories } = await req.json();
    
    console.log('Categorizing transaction:', { description, amount, type });

    // Create system prompt with existing categories
    const categoriesList = existingCategories
      .filter((cat: any) => cat.type === type)
      .map((cat: any) => cat.name)
      .join(', ');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert expense categorization assistant. Given a transaction description and amount, suggest the most appropriate category from this list: ${categoriesList}. 
            
            Only respond with the exact category name from the list, nothing else. If none fit well, respond with the most general category like "Other ${type === 'expense' ? 'Expenses' : 'Income'}".`
          },
          {
            role: 'user',
            content: `Transaction: "${description}" for $${amount}`
          }
        ],
        temperature: 0.3,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to categorize transaction');
    }

    const data = await response.json();
    const suggestedCategory = data.choices[0].message.content.trim();
    
    console.log('Suggested category:', suggestedCategory);

    return new Response(
      JSON.stringify({ category: suggestedCategory }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-categorize function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
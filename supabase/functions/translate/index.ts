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
    );

    const { text, targetLanguage, sourceLanguage = 'en' } = await req.json();

    if (!text || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: text and targetLanguage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first
    const { data: cached } = await supabaseClient
      .from('ai_translations')
      .select('translated_text')
      .eq('source_text', text)
      .eq('source_language', sourceLanguage)
      .eq('target_language', targetLanguage)
      .maybeSingle();

    if (cached) {
      console.log('Using cached translation');
      return new Response(
        JSON.stringify({ translatedText: cached.translated_text, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Translating with Lovable AI from ${sourceLanguage} to ${targetLanguage}`);

    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'ru': 'Russian',
    };

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
            content: `You are a professional translator. Translate the given text from ${languageNames[sourceLanguage] || sourceLanguage} to ${languageNames[targetLanguage] || targetLanguage}.

CRITICAL RULES:
1. Return ONLY the translated text, nothing else
2. Preserve any formatting, punctuation, and special characters
3. Maintain the same tone and style as the original
4. Keep technical terms and brand names unchanged unless there's a standard translation
5. For UI elements, use concise, natural language
6. Do not add explanations, notes, or any additional text
7. If the text is already in the target language, return it unchanged`
          },
          {
            role: 'user',
            content: text
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Lovable AI error:', response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const translatedText = aiResponse.choices[0].message.content.trim();

    // Cache the translation
    await supabaseClient
      .from('ai_translations')
      .insert({
        source_text: text,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        translated_text: translatedText,
      })
      .then(({ error }) => {
        if (error) console.error('Cache insert error:', error);
      });

    console.log('Translation successful');

    return new Response(
      JSON.stringify({ translatedText, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in translate function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

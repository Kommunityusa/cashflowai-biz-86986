import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Write a professional, SEO-optimized blog post about: ${topic}

Category: ${category}
Target audience: Small business owners

CRITICAL SEO & AI SEARCH OPTIMIZATION REQUIREMENTS:
- Use primary keyword naturally in title, first paragraph, H2s, and conclusion
- Include semantic keywords and LSI terms throughout
- Write for Featured Snippets: include clear definitions, numbered lists, and how-to steps
- Optimize for AI search engines (ChatGPT, Perplexity, Gemini):
  * Answer questions directly and concisely
  * Use clear, structured information
  * Include actionable steps and examples
  * Add context and explanations
- Use E-E-A-T principles: demonstrate expertise, experience, authoritativeness, trustworthiness
- Include practical examples and real-world scenarios
- Add data points, statistics, or specific numbers when relevant

Return ONLY valid JSON with these exact fields:
{
  "title": "Engaging, keyword-rich title under 60 chars (include main keyword at start)",
  "slug": "keyword-rich-url-friendly-slug",
  "excerpt": "Compelling summary under 160 chars with primary keyword",
  "content": "Blog post in markdown format, 800-1200 words. MUST include:\n- Introduction with primary keyword in first 100 words\n- 3-5 H2 sections with semantic keywords\n- H3 subsections with specific how-to steps\n- Bullet points and numbered lists for scannability\n- Practical examples and actionable tips\n- FAQ section answering common questions\n- Conclusion with clear call-to-action",
  "meta_title": "SEO-optimized title under 60 chars with primary keyword at start",
  "meta_description": "Compelling meta description under 160 chars with primary keyword and secondary keywords",
  "meta_keywords": "primary-keyword, secondary-keyword-1, secondary-keyword-2, lsi-keyword-1, lsi-keyword-2"
}

Make the content authoritative, practical, and optimized for both traditional SEO and AI search engines.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional blog writer. Return ONLY valid, complete JSON. Write engaging, SEO-optimized content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 3000
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI Response received, parsing...');
    let blogPost;
    try {
      blogPost = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Content received:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        post: blogPost
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in generate-blog function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

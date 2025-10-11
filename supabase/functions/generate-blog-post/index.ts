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
    const { topic, category, targetKeywords } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating blog post for topic:", topic);

    const prompt = `Generate a comprehensive, SEO-optimized blog post for a Philadelphia bookkeeping and accounting software company called Cash Flow AI.

Topic: ${topic}
Category: ${category}
Target Keywords: ${targetKeywords || 'bookkeeping, accounting, small business, Philadelphia'}

Requirements:
1. Write for Philadelphia business owners
2. Include local references (neighborhoods, business types common in Philly)
3. Focus on practical bookkeeping and tax advice
4. Optimize for SEO with natural keyword integration
5. Use a professional yet friendly tone
6. Include actionable tips and examples

Generate the following in JSON format:
{
  "title": "Engaging, SEO-optimized title (55-60 characters, include primary keyword)",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling excerpt (150-160 characters)",
  "content": "Full blog post in markdown format (minimum 1200 words, include H2 and H3 headings, bullet points, examples)",
  "meta_title": "SEO meta title (50-60 characters)",
  "meta_description": "SEO meta description (150-160 characters)",
  "meta_keywords": "comma-separated keywords (focus on Philadelphia + topic)"
}`;

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
            content: "You are an expert content writer specializing in SEO-optimized blog posts for small business accounting and bookkeeping. You write engaging, informative content that ranks well in search engines while providing real value to Philadelphia business owners."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage quota exceeded. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log("Generated content:", content);
    
    let blogPost;
    try {
      blogPost = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      throw new Error("Failed to parse AI-generated content");
    }

    return new Response(
      JSON.stringify({ blogPost }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in generate-blog-post function:", error);
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

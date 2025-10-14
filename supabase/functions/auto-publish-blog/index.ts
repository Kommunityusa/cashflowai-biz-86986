import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BLOG_TOPICS = [
  { topic: "Cash flow management strategies for small businesses", category: "Finance" },
  { topic: "Tax deduction tips every small business owner should know", category: "Tax Planning" },
  { topic: "How to categorize business expenses correctly", category: "Accounting" },
  { topic: "Financial reporting best practices for entrepreneurs", category: "Finance" },
  { topic: "Understanding profit margins and improving profitability", category: "Business Growth" },
  { topic: "Budgeting techniques for seasonal businesses", category: "Finance" },
  { topic: "Common bookkeeping mistakes and how to avoid them", category: "Accounting" },
  { topic: "Preparing your business for tax season", category: "Tax Planning" },
  { topic: "Financial metrics every business owner should track", category: "Analytics" },
  { topic: "Managing business expenses during economic uncertainty", category: "Finance" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Select a random topic
    const randomTopic = BLOG_TOPICS[Math.floor(Math.random() * BLOG_TOPICS.length)];
    
    console.log('Generating blog post:', randomTopic.topic);

    // Generate blog post using AI
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
            content: "You are an expert SEO content writer and financial advisor. Write comprehensive, authoritative blog posts optimized for traditional search engines AND AI search engines (ChatGPT, Perplexity, Gemini). Return ONLY valid, complete JSON."
          },
          {
            role: "user",
            content: `Write a professional, SEO-optimized blog post about: ${randomTopic.topic}

Category: ${randomTopic.category}
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

Make the content authoritative, practical, and optimized for both traditional SEO and AI search engines.`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const blogPost = JSON.parse(content);

    // Insert and publish the blog post
    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: blogPost.title,
        slug: blogPost.slug,
        excerpt: blogPost.excerpt,
        content: blogPost.content,
        category: randomTopic.category,
        author: 'Cash Flow AI Team',
        meta_title: blogPost.meta_title,
        meta_description: blogPost.meta_description,
        meta_keywords: blogPost.meta_keywords.split(', '),
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting blog post:', insertError);
      throw insertError;
    }

    console.log('Blog post published:', insertedPost.title);

    return new Response(
      JSON.stringify({ 
        success: true, 
        post: insertedPost,
        message: 'Blog post generated and published successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in auto-publish-blog function:", error);
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

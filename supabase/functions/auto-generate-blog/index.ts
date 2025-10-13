import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Topics for Philadelphia small business bookkeeping
const BLOG_TOPICS = [
  {
    topic: "Essential tax deductions for Philadelphia small businesses in 2025",
    category: "Tax Tips",
    keywords: "Philadelphia tax deductions, small business taxes, Pennsylvania tax breaks"
  },
  {
    topic: "How to streamline bookkeeping for your Fishtown cafe or restaurant",
    category: "Industry Guide",
    keywords: "restaurant bookkeeping Philadelphia, cafe accounting, Fishtown business"
  },
  {
    topic: "Understanding quarterly tax payments for Pennsylvania freelancers",
    category: "Tax Tips",
    keywords: "quarterly taxes Pennsylvania, freelancer taxes Philadelphia, estimated tax payments"
  },
  {
    topic: "Bookkeeping best practices for Center City retail stores",
    category: "Best Practices",
    keywords: "retail bookkeeping Philadelphia, Center City business accounting, inventory tracking"
  },
  {
    topic: "Year-end tax preparation checklist for Philadelphia entrepreneurs",
    category: "Tax Preparation",
    keywords: "tax preparation Philadelphia, year-end taxes, business tax checklist"
  },
  {
    topic: "Cash flow management strategies for South Philly small businesses",
    category: "Financial Management",
    keywords: "cash flow South Philadelphia, small business finances, money management"
  },
  {
    topic: "Expense tracking tips for Philadelphia contractors and consultants",
    category: "Best Practices",
    keywords: "expense tracking Philadelphia, contractor bookkeeping, consultant finances"
  },
  {
    topic: "Pennsylvania sales tax guide for small business owners",
    category: "Tax Tips",
    keywords: "Pennsylvania sales tax, Philadelphia business tax, sales tax compliance"
  }
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

    // Get the count of published posts to rotate topics
    const { count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    const postCount = count || 0;
    const topicIndex = postCount % BLOG_TOPICS.length;
    const selectedTopic = BLOG_TOPICS[topicIndex];

    console.log(`Generating blog post ${postCount + 1} with topic:`, selectedTopic.topic);

    // Generate blog post with AI
    const prompt = `Generate a comprehensive, SEO and AI-search optimized blog post for a Philadelphia bookkeeping and accounting software company called Cash Flow AI.

Topic: ${selectedTopic.topic}
Category: ${selectedTopic.category}
Target Keywords: ${selectedTopic.keywords}

Requirements:
1. Write for Philadelphia business owners with local references (Fishtown, Center City, South Philly, University City, Old City)
2. Focus on practical bookkeeping and tax advice with actionable steps
3. Optimize for AI search engines (ChatGPT, Perplexity, Claude) with direct answers
4. Include a comprehensive FAQ section (5-8 Q&A pairs) at the end
5. Structure content with clear H2/H3 headings for easy scanning
6. Add "Quick Answer" section at the top for voice search optimization
7. Include step-by-step HowTo sections where applicable
8. Reference IRS Publication 334 and Pennsylvania-specific tax rules
9. Use numbered lists and bullet points for better AI parsing
10. Include example scenarios with real Philadelphia business types

Generate the following in JSON format:
{
  "title": "Engaging, SEO-optimized title (55-60 characters, include primary keyword)",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling excerpt (150-160 characters)",
  "quick_answer": "Direct 2-3 sentence answer to the main question (optimized for voice search and AI chat responses)",
  "content": "Full blog post in markdown format (minimum 1500 words, include H2 and H3 headings, bullet points, examples, local Philadelphia business references). Start with Quick Answer section, then main content, end with comprehensive FAQ section",
  "faq": [
    {
      "question": "Common question about the topic",
      "answer": "Clear, concise answer (2-3 sentences)"
    }
  ],
  "how_to_steps": [
    {
      "step_number": 1,
      "name": "Step name",
      "description": "Detailed step description"
    }
  ],
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const blogPost = JSON.parse(content);

    // Insert blog post into database with structured data
    console.log('Inserting blog post into database...');
    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert([{
        title: blogPost.title,
        slug: blogPost.slug,
        content: blogPost.content,
        excerpt: blogPost.excerpt,
        category: selectedTopic.category,
        author: 'Cash Flow AI Team',
        meta_title: blogPost.meta_title,
        meta_description: blogPost.meta_description,
        meta_keywords: blogPost.meta_keywords.split(',').map((k: string) => k.trim()),
        is_published: true,
        published_at: new Date().toISOString(),
        structured_data: {
          quick_answer: blogPost.quick_answer,
          faq: blogPost.faq || [],
          how_to_steps: blogPost.how_to_steps || []
        }
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting blog post:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      throw insertError;
    }

    if (!insertedPost) {
      console.error('No post returned after insert');
      throw new Error('Failed to retrieve inserted post');
    }

    console.log('Successfully published blog post:', insertedPost.title);

    return new Response(
      JSON.stringify({ 
        success: true, 
        post: insertedPost,
        message: `Published: ${insertedPost.title}`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in auto-generate-blog function:", error);
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

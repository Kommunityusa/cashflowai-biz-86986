import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Creating Supabase client with service role key...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test insert a simple blog post
    console.log('Attempting to insert test blog post...');
    const testPost = {
      title: "Test Blog Post - " + new Date().toISOString(),
      slug: "test-post-" + Date.now(),
      content: "# Test Post\n\nThis is a test blog post to verify the system is working.",
      excerpt: "A test post to verify blog functionality",
      category: "Test",
      author: "System Test",
      meta_title: "Test Post",
      meta_description: "Test description",
      meta_keywords: ["test", "blog"],
      is_published: true,
      published_at: new Date().toISOString(),
      structured_data: {
        quick_answer: "This is a test",
        faq: [],
        how_to_steps: []
      }
    };

    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert([testPost])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to insert: ${insertError.message}`);
    }

    console.log('Successfully inserted test post:', insertedPost);

    // Now invoke the real auto-generate-blog function
    console.log('Now invoking auto-generate-blog function...');
    const { data: blogData, error: blogError } = await supabase.functions.invoke('auto-generate-blog', {
      body: {}
    });

    if (blogError) {
      console.error('Blog generation error:', blogError);
      return new Response(
        JSON.stringify({ 
          success: true,
          testPost: insertedPost,
          blogError: blogError.message,
          message: 'Test post created but blog generation failed'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        testPost: insertedPost,
        generatedPost: blogData?.post,
        message: 'Both test post and generated post created successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

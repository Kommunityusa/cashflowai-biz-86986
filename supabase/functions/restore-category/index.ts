import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Check if category already exists
    const { data: existing } = await supabaseClient
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', 'Account Transfer')
      .eq('type', 'income')
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ 
          message: 'Account Transfer category already exists',
          category: existing 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the Account Transfer income category
    const { data: category, error } = await supabaseClient
      .from('categories')
      .insert({
        user_id: user.id,
        name: 'Account Transfer',
        type: 'income',
        color: '#3B82F6',
        is_default: false
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Account Transfer category restored for user:', user.id);

    return new Response(
      JSON.stringify({ 
        message: 'Account Transfer category restored successfully',
        category 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in restore-category:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

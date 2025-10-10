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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if email is verified
    if (!user.email_confirmed_at) {
      throw new Error('Please verify your email address before enabling 2FA');
    }

    // List all existing factors
    const { data: existingFactors } = await supabase.auth.mfa.listFactors();
    
    // Remove ALL unverified factors
    if (existingFactors?.totp) {
      for (const factor of existingFactors.totp) {
        if (factor.status !== 'verified') {
          console.log('Removing unverified factor:', factor.id);
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
    }

    // Wait to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a unique friendly name using timestamp
    const friendlyName = `CashFlowAI-${Date.now()}`;

    // Enroll new TOTP factor
    const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: friendlyName
    });

    if (enrollError) {
      console.error('Enrollment error:', enrollError);
      throw enrollError;
    }

    if (!enrollData) {
      throw new Error('No enrollment data returned');
    }

    return new Response(
      JSON.stringify({
        success: true,
        factorId: enrollData.id,
        qrCode: enrollData.totp.qr_code,
        secret: enrollData.totp.secret,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in enroll-2fa:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to enroll 2FA' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

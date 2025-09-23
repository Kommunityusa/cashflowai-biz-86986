import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Check environment variables
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
    const plaidSecret = Deno.env.get('PLAID_SECRET');
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    
    const config = {
      plaid: {
        clientIdExists: !!plaidClientId,
        secretExists: !!plaidSecret,
        clientIdLength: plaidClientId?.length || 0,
        secretLength: plaidSecret?.length || 0,
        environment: plaidEnv,
        plaidUrl: plaidEnv === 'production' ? 'https://production.plaid.com' : 
                   plaidEnv === 'development' ? 'https://development.plaid.com' : 
                   'https://sandbox.plaid.com'
      },
      openai: {
        keyExists: !!openAIKey,
        keyLength: openAIKey?.length || 0,
        keyPrefix: openAIKey?.substring(0, 7) || 'not-set'
      }
    };
    
    // Test Plaid connection if credentials exist
    let plaidTest = { status: 'not-tested', error: null };
    if (plaidClientId && plaidSecret) {
      try {
        const testBody = {
          client_id: plaidClientId,
          secret: plaidSecret,
          client_name: 'Test',
          country_codes: ['US'],
          language: 'en',
          user: {
            client_user_id: 'test-user'
          },
          products: ['transactions'],
          redirect_uri: 'https://example.com'
        };
        
        const plaidUrl = config.plaid.plaidUrl + '/link/token/create';
        const response = await fetch(plaidUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testBody),
        });
        
        const data = await response.json();
        
        if (data.error_code) {
          plaidTest = {
            status: 'error',
            error: data.error_message || data.error_code,
            error_type: data.error_type,
            error_code: data.error_code
          };
        } else if (data.link_token) {
          plaidTest = {
            status: 'success',
            message: 'Plaid credentials are valid and working',
            environment: plaidEnv
          };
        }
      } catch (error) {
        plaidTest = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    // Test OpenAI connection if key exists  
    let openAITest = { status: 'not-tested', error: null };
    if (openAIKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
          },
        });
        
        if (response.ok) {
          openAITest = {
            status: 'success',
            message: 'OpenAI API key is valid and working'
          };
        } else {
          const error = await response.text();
          openAITest = {
            status: 'error',
            error: `HTTP ${response.status}: ${error}`
          };
        }
      } catch (error) {
        openAITest = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    return new Response(
      JSON.stringify({
        config,
        plaidTest,
        openAITest,
        timestamp: new Date().toISOString()
      }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Test function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
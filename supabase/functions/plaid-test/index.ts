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
    console.log('[Plaid Test] Starting diagnostic test');
    
    // Check environment variables
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
    const plaidSecret = Deno.env.get('PLAID_SECRET');
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'production';
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    
    const config = {
      plaid: {
        clientIdExists: !!plaidClientId,
        secretExists: !!plaidSecret,
        clientIdLength: plaidClientId?.length || 0,
        secretLength: plaidSecret?.length || 0,
        clientIdPrefix: plaidClientId?.substring(0, 10) || 'not-set',
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
    let plaidTest: { status: string; error: string | null; details: any; message?: string } = { status: 'not-tested', error: null, details: {} };
    
    if (!plaidClientId || !plaidSecret) {
      plaidTest = {
        status: 'error',
        error: 'Plaid credentials not configured',
        details: {
          clientIdExists: !!plaidClientId,
          secretExists: !!plaidSecret,
          message: 'Please add PLAID_CLIENT_ID and PLAID_SECRET to Supabase Edge Function secrets'
        }
      };
    } else {
      try {
        // Try a minimal test first
        const minimalBody = {
          client_id: plaidClientId,
          secret: plaidSecret,
          client_name: 'Test',
          country_codes: ['US'],
          language: 'en',
          user: {
            client_user_id: 'test-user'
          },
          products: ['transactions']
        };
        
        console.log('[Plaid Test] Testing with minimal configuration');
        const plaidUrl = config.plaid.plaidUrl + '/link/token/create';
        
        const response = await fetch(plaidUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(minimalBody),
        });
        
        const data = await response.json();
        console.log('[Plaid Test] Response received:', response.status);
        
        if (data.error_code) {
          plaidTest = {
            status: 'error',
            error: data.error_message || data.error_code,
            details: {
              error_type: data.error_type,
              error_code: data.error_code,
              error_message: data.error_message,
              request_id: data.request_id,
              http_status: response.status,
              environment: plaidEnv,
              url: plaidUrl,
              suggestion: getErrorSuggestion(data.error_code)
            }
          };
        } else if (data.link_token) {
          plaidTest = {
            status: 'success',
            error: null,
            message: 'Plaid credentials are valid and working',
            details: {
              environment: plaidEnv,
              link_token_created: true,
              expiration: data.expiration,
              request_id: data.request_id
            }
          };
        } else {
          plaidTest = {
            status: 'error',
            error: 'Unexpected response from Plaid',
            details: {
              response: data,
              http_status: response.status
            }
          };
        }
      } catch (error) {
        console.error('[Plaid Test] Error during test:', error);
        plaidTest = {
          status: 'error',
          error: error.message,
          details: {
            type: 'network_error',
            message: 'Failed to connect to Plaid API'
          }
        };
      }
    }
    
    // Test OpenAI connection if key exists  
    let openAITest = { status: 'not-tested', error: null, details: {} };
    if (!openAIKey) {
      openAITest = {
        status: 'error',
        error: 'OpenAI API key not configured',
        details: {
          message: 'Please add OPENAI_API_KEY to Supabase Edge Function secrets'
        }
      };
    } else {
      try {
        console.log('[Plaid Test] Testing OpenAI connection');
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
          },
        });
        
        if (response.ok) {
          const models = await response.json();
          openAITest = {
            status: 'success',
            message: 'OpenAI API key is valid and working',
            details: {
              models_available: models.data?.length || 0
            }
          };
        } else {
          const error = await response.text();
          openAITest = {
            status: 'error',
            error: `HTTP ${response.status}`,
            details: {
              http_status: response.status,
              error_message: error
            }
          };
        }
      } catch (error) {
        console.error('[Plaid Test] OpenAI test error:', error);
        openAITest = {
          status: 'error',
          error: error.message,
          details: {
            type: 'network_error'
          }
        };
      }
    }
    
    const result = {
      summary: {
        plaid: plaidTest.status,
        openai: openAITest.status,
        timestamp: new Date().toISOString()
      },
      config,
      plaidTest,
      openAITest,
      recommendations: getRecommendations(plaidTest, openAITest)
    };
    
    console.log('[Plaid Test] Test complete:', result.summary);
    
    return new Response(
      JSON.stringify(result, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Plaid Test] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getErrorSuggestion(errorCode: string): string {
  const suggestions: Record<string, string> = {
    'INVALID_API_KEYS': 'Your Plaid API keys may be incorrect. Please verify them in the Plaid Dashboard.',
    'INVALID_PRODUCT': 'The products configuration may be incorrect. Ensure you are using valid product names.',
    'INVALID_FIELD': 'One or more fields in the request are invalid. Check the field formats.',
    'MISSING_FIELDS': 'Required fields are missing from the request.',
    'UNAUTHORIZED': 'Your API keys may not have permission for this environment.',
    'SANDBOX_ONLY': 'This feature is only available in sandbox mode.',
  };
  
  return suggestions[errorCode] || 'Please check the Plaid documentation for this error code.';
}

function getRecommendations(plaidTest: any, openAITest: any): string[] {
  const recommendations = [];
  
  if (plaidTest.status === 'error') {
    if (plaidTest.details?.error_code === 'INVALID_API_KEYS') {
      recommendations.push('Verify your Plaid API keys in the Plaid Dashboard');
      recommendations.push('Ensure you are using the correct environment (sandbox/development/production)');
    } else if (plaidTest.details?.error_code === 'INVALID_FIELD') {
      recommendations.push('Review the Plaid API documentation for required field formats');
    } else if (!plaidTest.details?.clientIdExists || !plaidTest.details?.secretExists) {
      recommendations.push('Add PLAID_CLIENT_ID and PLAID_SECRET to your Supabase Edge Function secrets');
    }
  }
  
  if (openAITest.status === 'error') {
    if (openAITest.details?.http_status === 401) {
      recommendations.push('Your OpenAI API key appears to be invalid');
    } else if (!openAITest.details?.keyExists) {
      recommendations.push('Add OPENAI_API_KEY to your Supabase Edge Function secrets');
    }
  }
  
  if (recommendations.length === 0 && plaidTest.status === 'success' && openAITest.status === 'success') {
    recommendations.push('All services are configured correctly and working properly');
  }
  
  return recommendations;
}
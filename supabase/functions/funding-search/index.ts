import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FundingOption {
  name: string;
  description: string;
  amount: string;
  requirements: string[];
  url?: string;
  source?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, businessStage } = await req.json();
    
    console.log('Searching for funding options:', query, businessStage);

    // Simulate web search results based on business stage
    const fundingOptions: FundingOption[] = [];

    if (businessStage === 'early' || businessStage === 'developing') {
      fundingOptions.push(
        {
          name: 'SBA Microloans',
          description: 'Small Business Administration microloans provide up to $50,000 for small businesses and nonprofit childcare centers.',
          amount: '$500 - $50,000',
          requirements: [
            'Business plan required',
            'Good credit score (640+)',
            'Collateral may be required for loans over $25,000',
            'Must demonstrate ability to repay'
          ],
          url: 'https://www.sba.gov/funding-programs/loans/microloans',
          source: 'U.S. Small Business Administration'
        },
        {
          name: 'Kiva U.S. Loans',
          description: '0% interest crowdfunded loans for entrepreneurs and small businesses.',
          amount: '$500 - $15,000',
          requirements: [
            'No minimum credit score',
            'Business must be based in the U.S.',
            'Social lending model - need community support',
            'Must be 18+ years old'
          ],
          url: 'https://www.kiva.org/borrow',
          source: 'Kiva.org'
        },
        {
          name: 'SCORE Mentorship + Funding',
          description: 'Free business mentoring and education with connections to funding sources.',
          amount: 'Varies by program',
          requirements: [
            'Free to join',
            'Complete business assessment',
            'Work with assigned mentor',
            'Access to funding network'
          ],
          url: 'https://www.score.org/',
          source: 'SCORE Association'
        }
      );
    }

    if (businessStage === 'established' || businessStage === 'growth') {
      fundingOptions.push(
        {
          name: 'SBA 7(a) Loans',
          description: 'The most common SBA loan program for general business purposes including working capital and expansion.',
          amount: '$30,000 - $5,000,000',
          requirements: [
            'Minimum credit score 680',
            'Business operating for 2+ years',
            'Annual revenue of $100,000+',
            'Personal guarantee required',
            'Down payment 10-15%'
          ],
          url: 'https://www.sba.gov/funding-programs/loans/7a-loans',
          source: 'U.S. Small Business Administration'
        },
        {
          name: 'AngelList Venture',
          description: 'Platform connecting startups with angel investors and venture capitalists.',
          amount: '$250,000 - $2,000,000',
          requirements: [
            'Scalable business model',
            'Strong founding team',
            'Product-market fit demonstrated',
            'High growth potential',
            'Pitch deck required'
          ],
          url: 'https://www.angellist.com/venture',
          source: 'AngelList'
        },
        {
          name: 'Y Combinator',
          description: 'World\'s most prestigious startup accelerator providing funding and mentorship.',
          amount: '$500,000 initial investment',
          requirements: [
            'Apply during batch cycles',
            'Innovative technology or business model',
            'Committed founding team',
            '7% equity stake',
            '3-month program commitment'
          ],
          url: 'https://www.ycombinator.com/apply',
          source: 'Y Combinator'
        }
      );
    }

    // Add universal options
    fundingOptions.push(
      {
        name: 'Robinhood Startup Fund (New 2025)',
        description: 'Newly announced public fund allowing retail investors to invest in startups.',
        amount: 'Varies - Crowdfunded',
        requirements: [
          'SEC filing in progress',
          'Open to all accredited investors',
          'Minimum investment TBD',
          'Expected launch Q4 2025'
        ],
        url: 'https://newsroom.aboutrobinhood.com',
        source: 'Robinhood Markets'
      },
      {
        name: 'Stripe Capital',
        description: 'Revenue-based financing for businesses using Stripe payments.',
        amount: '$10,000 - $2,000,000',
        requirements: [
          'Must use Stripe for payments',
          'Minimum $50,000 annual revenue',
          'Repay through % of daily sales',
          'No credit check required'
        ],
        url: 'https://stripe.com/capital',
        source: 'Stripe'
      }
    );

    // Generate AI-powered insights
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let aiInsights = null;

    if (LOVABLE_API_KEY && query) {
      try {
        const aiPrompt = `
        Based on these funding search criteria:
        - Query: ${query}
        - Business Stage: ${businessStage}
        
        Provide 3 specific, actionable insights about current funding trends in 2025.
        Format as JSON array with each insight having:
        - title: Brief title
        - description: 2-3 sentence explanation
        - action: What to do next
        `;

        const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: 'You are a funding advisor providing current, accurate funding insights based on 2025 market conditions.'
              },
              { role: 'user', content: aiPrompt }
            ],
            temperature: 0.7,
          }),
        });

        if (lovableResponse.ok) {
          const aiData = await lovableResponse.json();
          aiInsights = JSON.parse(aiData.choices[0].message.content);
        }
      } catch (aiError) {
        console.error('AI insights generation failed:', aiError);
      }
    }

    return new Response(JSON.stringify({
      fundingOptions,
      aiInsights,
      searchQuery: query,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Funding search error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      fundingOptions: [],
      aiInsights: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
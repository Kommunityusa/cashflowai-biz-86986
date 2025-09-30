import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

type Plan = 'free' | 'starter' | 'professional' | 'business';

interface SubscriptionContextType {
  plan: Plan;
  loading: boolean;
  hasFeature: (feature: string) => boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Feature access matrix
const FEATURE_ACCESS: Record<Plan, string[]> = {
  free: [
    'basic_dashboard',
    'manual_transactions',
    'basic_reports',
    'single_bank_account',
  ],
  starter: [
    'basic_dashboard',
    'manual_transactions',
    'basic_reports',
    'single_bank_account',
    'basic_ai_categorization',
    'monthly_reports',
    '250_transactions',
    'email_support',
    'basic_expense_tracking',
  ],
  professional: [
    'basic_dashboard',
    'manual_transactions',
    'basic_reports',
    'single_bank_account',
    'basic_ai_categorization',
    'monthly_reports',
    '250_transactions',
    'email_support',
    'basic_expense_tracking',
    'three_bank_accounts',
    'advanced_ai_categorization',
    'weekly_reports',
    '1000_transactions',
    'priority_support',
    'tax_reports',
    'custom_categories',
    'basic_vendor_management',
    'funding_access',
    'advanced_analytics',
  ],
  business: [
    'basic_dashboard',
    'manual_transactions',
    'basic_reports',
    'single_bank_account',
    'basic_ai_categorization',
    'monthly_reports',
    '250_transactions',
    'email_support',
    'basic_expense_tracking',
    'three_bank_accounts',
    'advanced_ai_categorization',
    'weekly_reports',
    '1000_transactions',
    'priority_support',
    'tax_reports',
    'custom_categories',
    'basic_vendor_management',
    'funding_access',
    'advanced_analytics',
    'unlimited_bank_accounts',
    'custom_ai_rules',
    'realtime_reports',
    'unlimited_transactions',
    'phone_support',
    'advanced_tax_reports',
    'full_vendor_management',
    'invoice_generation',
    'api_access',
  ],
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plan, setPlan] = useState<Plan>('free');
  const [loading, setLoading] = useState(true);

  const checkSubscription = async (session: Session | null) => {
    if (!session) {
      setPlan('free');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!error && data) {
        // Map the product_id to plan names
        if (data.subscribed) {
          // Determine plan based on product_id or default to professional
          const productPlanMap: Record<string, Plan> = {
            'prod_starter': 'starter',
            'prod_professional': 'professional',
            'prod_business': 'business',
          };
          
          setPlan(productPlanMap[data.product_id] || 'professional');
        } else {
          setPlan('free');
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setPlan('free');
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await checkSubscription(session);
  };

  useEffect(() => {
    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkSubscription(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setTimeout(() => {
          checkSubscription(session);
        }, 0);
      } else {
        setPlan('free');
        setLoading(false);
      }
    });

    // Refresh subscription every 60 seconds
    const interval = setInterval(refreshSubscription, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const hasFeature = (feature: string): boolean => {
    return FEATURE_ACCESS[plan].includes(feature);
  };

  return (
    <SubscriptionContext.Provider value={{ plan, loading, hasFeature, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
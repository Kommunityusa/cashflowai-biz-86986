import { useAuth } from '@/hooks/useAuth';

export type PlanType = 'starter' | 'professional' | 'business' | null;

interface FeatureLimit {
  starter: number | boolean | string;
  professional: number | boolean | string;
  business: number | boolean | string;
}

const FEATURE_LIMITS: Record<string, FeatureLimit> = {
  bankAccounts: {
    starter: 1,
    professional: 3,
    business: Infinity
  },
  transactionsPerMonth: {
    starter: 250,
    professional: 1000,
    business: Infinity
  },
  aiCategorization: {
    starter: true, // basic
    professional: true, // advanced
    business: true // advanced with custom rules
  },
  reports: {
    starter: 'monthly',
    professional: 'weekly',
    business: 'realtime'
  },
  emailSupport: {
    starter: true,
    professional: true,
    business: true
  },
  prioritySupport: {
    starter: false,
    professional: true,
    business: true
  },
  phoneSupport: {
    starter: false,
    professional: false,
    business: true
  },
  taxReports: {
    starter: false,
    professional: true,
    business: true
  },
  customCategories: {
    starter: false,
    professional: true,
    business: true
  },
  vendorManagement: {
    starter: false,
    professional: 'basic',
    business: 'full'
  },
  invoiceGeneration: {
    starter: false,
    professional: false,
    business: true
  },
  apiAccess: {
    starter: false,
    professional: false,
    business: true
  }
};

export const useFeatureAccess = () => {
  const { subscriptionPlan, user } = useAuth();
  
  // Admin users have access to all business features
  const isAdmin = user?.email === 'admin@cashflowai.com'; // You should implement proper role checking
  const plan = isAdmin ? 'business' : (subscriptionPlan as PlanType);
  
  const hasFeature = (feature: keyof typeof FEATURE_LIMITS): boolean => {
    if (!plan) return false;
    const limit = FEATURE_LIMITS[feature]?.[plan];
    return limit === true || (typeof limit === 'number' && limit > 0) || (typeof limit === 'string' && limit !== 'none');
  };
  
  const getFeatureLimit = (feature: keyof typeof FEATURE_LIMITS): number | string | boolean => {
    if (!plan) return false;
    return FEATURE_LIMITS[feature]?.[plan] ?? false;
  };
  
  const canUseFeature = (feature: keyof typeof FEATURE_LIMITS, currentUsage?: number): boolean => {
    if (!plan) return false;
    const limit = FEATURE_LIMITS[feature]?.[plan];
    
    if (typeof limit === 'boolean') return limit;
    if (typeof limit === 'string') return limit !== 'none';
    if (typeof limit === 'number' && currentUsage !== undefined) {
      return currentUsage < limit;
    }
    
    return true;
  };
  
  return {
    plan,
    hasFeature,
    getFeatureLimit,
    canUseFeature,
    features: FEATURE_LIMITS
  };
};
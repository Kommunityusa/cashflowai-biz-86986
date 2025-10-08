import { useAuth } from '@/hooks/useAuth';

export type PlanType = 'starter' | 'professional' | 'business' | null;

interface FeatureLimit {
  starter: number | boolean | string;
  professional: number | boolean | string;
  business: number | boolean | string;
}

const FEATURE_LIMITS: Record<string, FeatureLimit> = {
  bankAccounts: {
    starter: Infinity,
    professional: Infinity,
    business: Infinity
  },
  transactionsPerMonth: {
    starter: Infinity,
    professional: Infinity,
    business: Infinity
  },
  aiCategorization: {
    starter: true,
    professional: true,
    business: true
  },
  reports: {
    starter: 'realtime',
    professional: 'realtime',
    business: 'realtime'
  },
  emailSupport: {
    starter: true,
    professional: true,
    business: true
  },
  prioritySupport: {
    starter: true,
    professional: true,
    business: true
  },
  phoneSupport: {
    starter: false,
    professional: false,
    business: false
  },
  taxReports: {
    starter: true,
    professional: true,
    business: true
  },
  customCategories: {
    starter: true,
    professional: true,
    business: true
  },
  vendorManagement: {
    starter: false,
    professional: false,
    business: false
  },
  invoiceGeneration: {
    starter: false,
    professional: false,
    business: false
  },
  apiAccess: {
    starter: false,
    professional: false,
    business: false
  }
};

export const useFeatureAccess = () => {
  const { subscriptionPlan, user, isAdmin } = useAuth();
  
  // Admin users have access to all pro features
  const plan = (isAdmin ? 'pro' : subscriptionPlan) as PlanType;
  
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
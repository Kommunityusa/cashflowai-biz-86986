import { ReactNode } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeatureGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  currentUsage?: number;
}

export function FeatureGuard({ feature, children, fallback, currentUsage }: FeatureGuardProps) {
  const { canUseFeature, plan, getFeatureLimit } = useFeatureAccess();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const hasAccess = canUseFeature(feature as any, currentUsage);
  const limit = getFeatureLimit(feature as any);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  const getPlanForFeature = (feature: string): string => {
    // Determine the minimum plan required for this feature
    if (feature === 'phoneSupport' || feature === 'invoiceGeneration' || feature === 'apiAccess') {
      return t.plans.business;
    }
    if (feature === 'taxReports' || feature === 'customCategories' || feature === 'vendorManagement') {
      return t.plans.professional;
    }
    return t.plans.starter;
  };
  
  return (
    <Alert className="border-warning">
      <Lock className="h-4 w-4" />
      <AlertTitle>{t.plans.upgrade} Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          This feature requires the {getPlanForFeature(feature)} plan or higher.
          {typeof limit === 'number' && currentUsage !== undefined && (
            <span className="block mt-1">
              Current usage: {currentUsage} / {limit === Infinity ? 'Unlimited' : limit}
            </span>
          )}
        </p>
        <Button 
          variant="gradient" 
          size="sm"
          onClick={() => navigate('/select-plan')}
        >
          {t.plans.upgrade} Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}
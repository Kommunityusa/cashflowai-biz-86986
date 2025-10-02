import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

const SelectPlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter',
      name: t.plans.starter,
      price: '$10',
      features: [
        t.features.oneBank,
        t.features.basicAI,
        t.features.monthlyReports,
        t.features.transactions250,
        t.features.emailSupport,
        t.features.basicExpense
      ],
      popular: false,
      trialDays: 7
    },
    {
      id: 'professional',
      name: t.plans.professional,
      price: '$15',
      features: [
        t.features.threeBanks,
        t.features.advancedAI,
        t.features.weeklyReports,
        t.features.transactions1000,
        t.features.prioritySupport,
        t.features.taxReports,
        t.features.customCategories,
        t.features.vendorManagement
      ],
      popular: true,
      trialDays: 14
    },
    {
      id: 'business',
      name: t.plans.business,
      price: '$25',
      features: [
        t.features.unlimitedBanks,
        t.features.aiCustomRules,
        t.features.realtimeReports,
        t.features.unlimitedTransactions,
        t.features.phoneSupport,
        t.features.advancedTax,
        t.features.customCategoriesRules,
        t.features.fullVendor,
        t.features.invoiceGen,
        t.features.apiAccess
      ],
      popular: false,
      trialDays: 30
    }
  ];

  const handleSelectPlan = async (planId: string) => {
    setLoading(true);
    setSelectedPlan(planId);
    
    try {
      // For free plan, just update the user's profile
      if (planId === 'free') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .upsert({
              user_id: user.id,
              subscription_plan: 'free',
              updated_at: new Date().toISOString()
            });
        }
        
        toast({
          title: t.common.success,
          description: 'Free plan activated successfully'
        });
        
        navigate('/dashboard');
      } else {
        // For paid plans, redirect to Stripe checkout
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: t.common.error,
            description: 'Please sign in to continue',
            variant: 'destructive'
          });
          navigate('/auth');
          return;
        }

        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { planId },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) throw error;
        
        if (data?.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast({
        title: t.common.error,
        description: 'Failed to process plan selection',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t.plans.selectPlan}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.plans.choosePlan}
            </p>
            <p className="text-warning mt-2 font-medium">
              {t.plans.selectPlanToContinue}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative p-6 hover:shadow-lg transition-all ${
                  plan.popular ? 'border-primary shadow-lg scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {t.plans.mostPopular}
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-primary">
                    {plan.price}
                    <span className="text-sm text-muted-foreground font-normal">
                      {t.plans.perMonth}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? 'gradient' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading && selectedPlan === plan.id}
                >
                  {loading && selectedPlan === plan.id ? t.common.loading : t.common.select}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectPlan;
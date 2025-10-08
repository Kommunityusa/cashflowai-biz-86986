import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, ArrowLeft } from 'lucide-react';
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

  useEffect(() => {
    // Check for checkout redirect from Stripe
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');
    const checkoutEmail = urlParams.get('checkout_email');
    
    if (checkoutStatus === 'pending' && checkoutEmail) {
      // User completed Stripe checkout but needs to create account
      toast({
        title: t.common.success,
        description: 'Payment successful! Now create your account to access your dashboard.',
      });
      navigate(`/auth?checkout=completed&checkout_email=${checkoutEmail}`);
    }
  }, [navigate, toast, t]);

  const plans = [
    {
      id: 'professional',
      name: t.plans.professional,
      price: '$10',
      features: [
        t.features.unlimitedBanks,
        t.features.advancedAI,
        t.features.realtimeReports,
        t.features.unlimitedTransactions,
        t.features.emailSupport,
        t.features.taxReports,
        t.features.customCategories,
        "Bank statement uploads",
        "AI-powered insights"
      ],
      popular: true
    }
  ];

  const handleGoBack = async () => {
    // Sign out the user so they can return to the home page
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSelectPlan = async (planId: string) => {
    setLoading(true);
    setSelectedPlan(planId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        toast({
          title: t.common.error,
          description: 'Please sign in to continue',
          variant: 'destructive'
        });
        navigate('/auth');
        return;
      }

      console.log('[SelectPlan] Starting checkout for:', session.user.email);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { email: session.user.email },
      });

      console.log('[SelectPlan] Checkout response:', { data, error });

      if (error) {
        console.error('[SelectPlan] Checkout error:', error);
        throw error;
      }
      
      if (data?.url) {
        console.log('[SelectPlan] Redirecting to Stripe checkout');
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error('[SelectPlan] Error:', error);
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
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common.back || 'Back'}
        </Button>
      </div>
      
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

          <div className="flex justify-center max-w-xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className="relative p-6 border-primary shadow-lg w-full"
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
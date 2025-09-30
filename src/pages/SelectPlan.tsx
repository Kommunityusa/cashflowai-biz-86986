import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SelectPlan() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserEmail(session.user.email || "");

    // Check if user already has a subscription
    try {
      const { data } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (data?.subscribed) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const processCheckout = async (planName: string) => {
    try {
      setIsLoading(true);
      setSelectedPlan(planName);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-trial-checkout", {
        body: { plan: planName },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const skipForNow = () => {
    navigate("/dashboard");
  };

  const plans = [
    {
      name: "Starter",
      price: "$10",
      period: t('plans.month'),
      description: t('plans.starterDesc'),
      features: [
        { text: "1 bank account connection", included: true },
        { text: "Basic AI categorization", included: true },
        { text: "Monthly reports", included: true },
        { text: "Up to 250 transactions/month", included: true },
        { text: "Email support", included: true },
        { text: "Advanced analytics", included: false },
        { text: "Tax preparation reports", included: false },
      ],
      trialDays: 7,
    },
    {
      name: "Professional",
      price: "$15",
      period: t('plans.month'),
      description: t('plans.professionalDesc'),
      popular: true,
      features: [
        { text: "3 bank account connections", included: true },
        { text: "Advanced AI categorization", included: true },
        { text: "Weekly & monthly reports", included: true },
        { text: "Up to 1,000 transactions/month", included: true },
        { text: "Priority email support", included: true },
        { text: "Tax preparation reports", included: true },
        { text: "Custom categories", included: true },
      ],
      trialDays: 14,
    },
    {
      name: "Business",
      price: "$25",
      period: t('plans.month'),
      description: t('plans.businessDesc'),
      features: [
        { text: "Unlimited bank connections", included: true },
        { text: "Advanced AI with custom rules", included: true },
        { text: "Real-time reports & analytics", included: true },
        { text: "Unlimited transactions", included: true },
        { text: "Priority phone & chat support", included: true },
        { text: "Full vendor management", included: true },
        { text: "Invoice generation", included: true },
      ],
      trialDays: 30,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-center mb-8 pt-8">
          <div className="p-2 bg-gradient-primary rounded-lg mr-3">
            <TrendingUp className="h-8 w-8 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl text-foreground">Cash Flow AI</span>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('plans.selectPlan')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('plans.choosePlan')}
          </p>
          {userEmail && (
            <p className="text-sm text-muted-foreground mt-2">
              Logged in as: {userEmail}
            </p>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular 
                  ? "border-primary shadow-glow scale-105" 
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="flex items-baseline mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.period}</span>
                </div>
                <p className="text-sm text-success mt-2">
                  {plan.trialDays}-day free trial
                </p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-success mr-3 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/50 mr-3 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${
                        feature.included ? "text-foreground" : "text-muted-foreground/50"
                      }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.popular ? "gradient" : "outline"}
                  size="lg" 
                  className="w-full"
                  onClick={() => processCheckout(plan.name)}
                  disabled={isLoading && selectedPlan === plan.name}
                >
                  {isLoading && selectedPlan === plan.name 
                    ? t('common.loading')
                    : t('plans.startTrial')
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skip Option */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={skipForNow}
            className="text-muted-foreground hover:text-foreground"
          >
            Continue with Free Plan →
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            You can upgrade anytime from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
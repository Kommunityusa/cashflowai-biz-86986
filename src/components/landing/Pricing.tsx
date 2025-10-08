import { Button } from "@/components/ui/button";
import { Check, X, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";

export function Pricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const handleGetStarted = () => {
    navigate("/auth");
  };

  const handleUpgrade = async (planName: string) => {
    setSelectedPlan(planName);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setShowTrialModal(true);
    } else {
      // Get user email from session
      const email = session.user?.email;
      if (!email) {
        toast({
          title: "Error",
          description: "Unable to retrieve your email. Please sign in again.",
          variant: "destructive",
        });
        return;
      }
      await processCheckout(email, planName);
    }
  };

  const processCheckout = async (email?: string, planName?: string) => {
    setIsLoading(true);
    setShowTrialModal(false);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { email },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL received");

      window.open(data.url, '_blank');
      
      toast({
        title: "Redirecting to Checkout",
        description: "Complete your payment in the new tab",
      });
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      name: t.plans.professional,
      price: "$10",
      period: t.plans.perMonth,
      description: "Complete bookkeeping solution for small businesses",
      popular: true,
      features: [
        { text: t.features.unlimitedBanks, included: true },
        { text: t.features.advancedAI, included: true },
        { text: t.features.realtimeReports, included: true },
        { text: t.features.unlimitedTransactions, included: true },
        { text: t.features.emailSupport, included: true },
        { text: t.features.taxReports, included: true },
        { text: t.features.customCategories, included: true },
        { text: "Bank statement uploads", included: true },
        { text: "AI-powered insights", included: true },
      ],
      cta: "Subscribe Now",
      variant: "gradient" as const,
      onClick: () => handleUpgrade("professional"),
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Simple,{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Transparent
            </span>{" "}
            Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you need more power. No hidden fees, no surprises.
          </p>
        </div>

        <div className="flex justify-center max-w-2xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative bg-card rounded-2xl p-8 border border-primary shadow-glow w-full"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.period}</span>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-success mr-3 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground/50 mr-3 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? "text-foreground" : "text-muted-foreground/50"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.variant} 
                size="lg" 
                className="w-full"
                onClick={plan.onClick}
                disabled={isLoading && plan.name === "Pro"}
              >
                {isLoading && plan.name === "Pro" ? "Loading..." : plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All plans include SSL encryption, automatic backups, and GDPR compliance
          </p>
        </div>
      </div>
      
      <Dialog open={showTrialModal} onOpenChange={setShowTrialModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Get Started with {selectedPlan}</DialogTitle>
            <DialogDescription>
              Enter your email to continue with your subscription
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get('email') as string;
            processCheckout(email, selectedPlan);
          }} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : "Continue to Checkout"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
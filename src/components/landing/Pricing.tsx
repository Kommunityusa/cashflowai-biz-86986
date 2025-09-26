import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { TrialSignupModal } from "@/components/TrialSignupModal";

export function Pricing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);

  const handleGetStarted = () => {
    navigate("/auth");
  };

  const handleUpgrade = async () => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Show modal for email collection
      setShowTrialModal(true);
    } else {
      // Proceed with checkout for authenticated users
      await processCheckout();
    }
  };

  const processCheckout = async (email?: string) => {
    try {
      setIsLoading(true);
      setShowTrialModal(false);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      // Prepare the request body
      const requestBody = email ? { email } : {};
      const headers: any = {};
      
      if (session) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke("create-trial-checkout", {
        body: requestBody,
        headers,
      });

      if (error) {
        throw error;
      }
      
      if (data?.hasSubscription) {
        toast({
          title: "Already Subscribed",
          description: "You already have an active subscription",
          variant: "destructive",
        });
        return;
      }

      if (data?.hasTrial) {
        toast({
          title: "Trial Active",
          description: "You already have an active trial",
          variant: "destructive",
        });
        return;
      }
      
      if (data?.url) {
        // Open in new tab for Stripe checkout
        window.open(data.url, '_blank');
        
        if (!session) {
          toast({
            title: "Complete Your Signup",
            description: "After completing checkout, return here to create your account with the same email.",
          });
        }
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      name: "Starter",
      price: "$10",
      period: "/month",
      description: "Perfect for freelancers and solopreneurs",
      features: [
        { text: "2 bank account connections", included: true },
        { text: "Basic AI categorization", included: true },
        { text: "Monthly reports", included: true },
        { text: "Up to 500 transactions/month", included: true },
        { text: "Email support", included: true },
        { text: "Basic expense tracking", included: true },
        { text: "Advanced analytics", included: false },
        { text: "Tax preparation reports", included: false },
        { text: "Priority support", included: false },
        { text: "Custom categories & rules", included: false },
      ],
      cta: "Start 7-Day Free Trial",
      variant: "outline" as const,
      onClick: handleUpgrade,
    },
    {
      name: "Professional",
      price: "$15",
      period: "/month",
      description: "15-day free trial • Cancel anytime",
      popular: true,
      trial: "15-day free trial",
      features: [
        { text: "Unlimited bank connections", included: true },
        { text: "Advanced AI categorization", included: true },
        { text: "Real-time reports & analytics", included: true },
        { text: "Unlimited transactions", included: true },
        { text: "Priority email & chat support", included: true },
        { text: "Tax preparation reports", included: true },
        { text: "Custom categories & rules", included: true },
        { text: "Vendor management", included: true },
        { text: "Invoice generation", included: true },
        { text: "API access", included: true },
      ],
      cta: "Start 15-Day Free Trial",
      variant: "gradient" as const,
      onClick: handleUpgrade,
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

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card rounded-2xl p-8 border ${
                plan.popular 
                  ? "border-primary shadow-glow" 
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
      
      <TrialSignupModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        onSubmit={processCheckout}
        isLoading={isLoading}
      />
    </section>
  );
}
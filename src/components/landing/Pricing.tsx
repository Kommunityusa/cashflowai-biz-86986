import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for freelancers and solopreneurs",
    features: [
      { text: "1 bank account connection", included: true },
      { text: "Basic transaction categorization", included: true },
      { text: "Monthly reports", included: true },
      { text: "Up to 100 transactions/month", included: true },
      { text: "Email support", included: true },
      { text: "Advanced AI features", included: false },
      { text: "Unlimited transactions", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$25",
    period: "/month",
    description: "For growing businesses that need more",
    popular: true,
    features: [
      { text: "Unlimited bank connections", included: true },
      { text: "Advanced AI categorization", included: true },
      { text: "Real-time reports & analytics", included: true },
      { text: "Unlimited transactions", included: true },
      { text: "Priority email & chat support", included: true },
      { text: "Tax preparation reports", included: true },
      { text: "Custom categories & rules", included: true },
      { text: "API access", included: true },
    ],
    cta: "Start Free Trial",
    variant: "gradient" as const,
  },
];

export function Pricing() {
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
              >
                {plan.cta}
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
    </section>
  );
}
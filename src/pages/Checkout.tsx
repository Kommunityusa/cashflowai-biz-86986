import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Redirect to auth if not logged in
        navigate("/auth");
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      console.log("[CHECKOUT] Starting checkout process...");
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[CHECKOUT] Session:", session ? "exists" : "missing");
      
      if (!session) {
        throw new Error("You must be logged in to subscribe");
      }

      const { data, error } = await supabase.functions.invoke("create-paypal-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log("[CHECKOUT] Response:", { data, error });

      if (error) {
        console.error("[CHECKOUT] Error:", error);
        throw error;
      }
      
      if (!data?.url) {
        throw new Error("No checkout URL received");
      }

      console.log("[CHECKOUT] Redirecting to PayPal:", data.url);
      window.open(data.url, "_blank");
    } catch (error: any) {
      console.error("[CHECKOUT] Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const features = [
    "Unlimited bank connections",
    "Advanced AI categorization",
    "Real-time reports & analytics",
    "Unlimited transactions",
    "Email support",
    "Tax preparation reports",
    "Custom categories",
    "Bank statement uploads",
    "AI-powered insights",
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-card rounded-2xl p-8 border border-primary shadow-glow">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium mb-4">
              Most Popular
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Cash Flow AI Pro</h1>
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-5xl font-bold text-foreground">$10</span>
              <span className="text-muted-foreground ml-2">/month</span>
            </div>
            <p className="text-muted-foreground">Complete bookkeeping solution for small businesses</p>
          </div>

          <ul className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="h-5 w-5 text-success mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button 
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Subscribe Now"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Secure payment powered by PayPal
          </p>
        </div>
      </div>
    </div>
  );
}

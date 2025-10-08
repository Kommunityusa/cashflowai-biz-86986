import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, Loader2 } from "lucide-react";

export default function Subscribe() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user already has a subscription
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_plan")
        .eq("user_id", session.user.id)
        .single();

      if (profile?.subscription_plan === "professional") {
        // Already subscribed, go to dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Subscription check error:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        toast({
          title: "Error",
          description: "Please sign in to continue",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { email: session.user.email },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL received");

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Subscribe to Continue</CardTitle>
            <CardDescription className="text-base">
              Get full access to Cash Flow AI Pro and manage your business finances with AI-powered insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-subtle rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Cash Flow AI Pro</h3>
                  <p className="text-muted-foreground">Everything you need to manage your finances</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">$10</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  "Unlimited bank connections",
                  "Unlimited transactions",
                  "Advanced AI categorization",
                  "Real-time financial reports",
                  "Tax-ready reports",
                  "Priority support",
                  "Bank statement uploads",
                  "AI-powered insights",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                variant="gradient"
                size="lg"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  "Subscribe Now - $10/month"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Cancel anytime. No hidden fees.
              </p>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  supabase.auth.signOut();
                  navigate("/");
                }}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CreditCard,
  Calendar,
  ArrowRight,
  Info,
  Crown,
  Pause,
  Play,
  X,
} from "lucide-react";

export function SubscriptionStatus() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [isManaging, setIsManaging] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Try edge function first
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!error && data) {
        setSubscription(data);
      } else {
        // Fallback: check profiles table directly
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_plan")
          .eq("user_id", session.user.id)
          .single();

        if (profile?.subscription_plan) {
          setSubscription({
            subscribed: profile.subscription_plan === "professional",
            plan: profile.subscription_plan === "professional" ? "pro" : "free",
          });
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setIsManaging(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to manage your subscription",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsManaging(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsManaging(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to manage your subscription",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsManaging(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  // Check both the subscription response and profile data
  const isPro = subscription?.plan === "pro" || subscription?.subscribed === true;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-gradient-subtle rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isPro ? (
              <Crown className="h-8 w-8 text-primary" />
            ) : (
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {isPro ? "Cash Flow AI Pro" : "Free Plan"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isPro ? "$10 per month" : "No charge"}
              </p>
            </div>
          </div>
          <Badge variant={isPro ? "default" : "secondary"} className="px-3 py-1">
            {isPro ? "Active" : "Current"}
          </Badge>
        </div>

        {isPro && subscription?.subscription_end && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            <span>Next billing date: {new Date(subscription.subscription_end).toLocaleDateString()}</span>
          </div>
        )}

        <div className="space-y-3">
          {isPro ? (
            <>
              <p className="text-sm text-muted-foreground">
                You have full access to all Pro features including unlimited transactions, 
                AI insights, and priority support.
              </p>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Subscription management is available in the deployed version of the app. 
                  Your Pro plan is active and all features are available.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro for unlimited transactions, advanced AI features, and more.
              </p>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Stripe checkout will be available once the app is deployed with proper Stripe configuration.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </div>

      {/* Features Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Plan Features</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm">Monthly Transactions</span>
            <span className="text-sm font-medium">
              {isPro ? "Unlimited" : "100"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm">Bank Connections</span>
            <span className="text-sm font-medium">
              {isPro ? "Unlimited" : "1"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm">AI Insights</span>
            <span className="text-sm font-medium">
              {isPro ? "Advanced" : "Basic"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm">Support</span>
            <span className="text-sm font-medium">
              {isPro ? "Priority" : "Standard"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm">Data Encryption</span>
            <span className="text-sm font-medium text-success">
              Always Enabled
            </span>
          </div>
        </div>
      </Card>

    </div>
  );
}
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
      const { data, error } = await supabase.functions.invoke("check-paypal-subscription", {
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
      
      console.log('[SubscriptionStatus] Starting upgrade', { hasSession: !!session });
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to manage your subscription",
          variant: "destructive",
        });
        return;
      }

      console.log('[SubscriptionStatus] Invoking create-paypal-checkout');

      const { data, error } = await supabase.functions.invoke("create-paypal-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('[SubscriptionStatus] Response:', { data, error });

      if (error) {
        console.error('[SubscriptionStatus] Error:', error);
        throw error;
      }
      
      if (data?.url) {
        console.log('[SubscriptionStatus] Opening checkout');
        window.open(data.url, "_blank");
        toast({
          title: "Redirecting to Checkout",
          description: "Complete your payment in the new tab",
        });
      } else {
        throw new Error("No checkout URL received");
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

      const { data, error } = await supabase.functions.invoke("cancel-paypal-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Your subscription has been cancelled.",
      });
      
      // Refresh subscription status
      checkSubscription();
    } catch (error) {
      console.error("Cancellation error:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
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
                {isPro ? "Cash Flow AI Pro" : "No Active Subscription"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isPro ? "$10 per month" : "Subscribe to access all features"}
              </p>
            </div>
          </div>
          {isPro && (
            <Badge variant="default" className="px-3 py-1">
              Active
            </Badge>
          )}
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
              <Button 
                onClick={handleManageSubscription} 
                disabled={isManaging}
                variant="outline"
                className="w-full"
              >
                {isManaging ? "Loading..." : "Manage Subscription"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Subscribe to Cash Flow AI Pro to unlock unlimited transactions, advanced AI features, and priority support.
              </p>
              <Button 
                onClick={handleUpgrade} 
                disabled={isManaging}
                variant="gradient"
                className="w-full"
              >
                {isManaging ? "Loading..." : "Subscribe to Pro - $10/month"}
              </Button>
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
              {isPro ? "Unlimited" : "Requires Subscription"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm">Bank Connections</span>
            <span className="text-sm font-medium">
              {isPro ? "Unlimited" : "Requires Subscription"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm">AI Insights</span>
            <span className="text-sm font-medium">
              {isPro ? "Advanced" : "Requires Subscription"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm">Support</span>
            <span className="text-sm font-medium">
              {isPro ? "Priority" : "Requires Subscription"}
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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Clock, CreditCard, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionStatus {
  subscribed: boolean;
  plan: string;
  inTrial: boolean;
  trialDaysRemaining: number | null;
  subscription_end: string | null;
  status?: string;
  cancelAtPeriodEnd?: boolean;
}

export function TrialBanner() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTrial = async () => {
    try {
      setCheckingOut(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to start your free trial");
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-trial-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.hasSubscription) {
        toast.error("You already have an active subscription");
        return;
      }

      if (data.hasTrial) {
        toast.error("You already have an active trial");
        return;
      }

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      toast.error("Failed to start trial. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const manageSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error("Failed to open customer portal");
    }
  };

  useEffect(() => {
    checkSubscription();
    // Check subscription status every minute
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !subscriptionStatus) return null;

  // Show trial banner if in trial
  if (subscriptionStatus.inTrial && subscriptionStatus.trialDaysRemaining !== null) {
    const daysLeft = subscriptionStatus.trialDaysRemaining;
    const isUrgent = daysLeft <= 3;
    
    return (
      <Card className={`p-4 mb-4 ${isUrgent ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-primary bg-primary/5'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isUrgent ? (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            ) : (
              <Clock className="h-5 w-5 text-primary" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">
                  {isUrgent ? 'Trial Ending Soon!' : 'Free Trial Active'}
                </p>
                <Badge variant={isUrgent ? "destructive" : "default"}>
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your trial ends on {new Date(subscriptionStatus.subscription_end!).toLocaleDateString()}.
                Credit card will be charged $25/month after trial ends.
              </p>
            </div>
          </div>
          <Button 
            onClick={manageSubscription}
            variant={isUrgent ? "default" : "outline"}
            size="sm"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Subscription
          </Button>
        </div>
      </Card>
    );
  }

  // Show active subscription banner
  if (subscriptionStatus.subscribed && !subscriptionStatus.inTrial) {
    return (
      <Card className="p-4 mb-4 border-green-500 bg-green-50 dark:bg-green-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">Pro Subscription Active</p>
                <Badge variant="default" className="bg-green-500">PRO</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {subscriptionStatus.cancelAtPeriodEnd 
                  ? `Subscription ends on ${new Date(subscriptionStatus.subscription_end!).toLocaleDateString()}`
                  : `Next billing date: ${new Date(subscriptionStatus.subscription_end!).toLocaleDateString()}`
                }
              </p>
            </div>
          </div>
          <Button onClick={manageSubscription} variant="outline" size="sm">
            Manage Subscription
          </Button>
        </div>
      </Card>
    );
  }

  // Show start trial CTA for free users
  return (
    <Alert className="mb-4 border-primary">
      <Sparkles className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-semibold mb-1">Start Your 15-Day Free Trial</p>
          <p className="text-sm">
            Get full access to all BizFlow Pro features. Credit card required. Cancel anytime.
          </p>
        </div>
        <Button 
          onClick={startTrial} 
          disabled={checkingOut}
          className="ml-4"
        >
          {checkingOut ? "Loading..." : "Start Free Trial"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
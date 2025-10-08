import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const [isLoadingPayPal, setIsLoadingPayPal] = useState(false);

  const handleStripeCheckout = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingStripe(true);
    try {
      console.log("[CHECKOUT] Starting Stripe checkout with signup...");
      
      // Check if user already exists
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      let session = existingSession;
      
      if (!session) {
        // Try to sign in first
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // If sign in fails, create new account
          const redirectUrl = `${window.location.origin}/dashboard`;
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
            },
          });

          if (signUpError) throw signUpError;
          session = signUpData.session;
          
          toast({
            title: "Account Created",
            description: "Your account has been created successfully!",
          });
        } else {
          session = signInData.session;
        }
      }

      if (!session) {
        throw new Error("Failed to create session. Please check your email for confirmation.");
      }

      const { data, error } = await supabase.functions.invoke("create-stripe-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("[CHECKOUT] Stripe error:", error);
        throw error;
      }
      
      if (!data?.url) {
        throw new Error("No checkout URL received");
      }

      console.log("[CHECKOUT] Redirecting to Stripe:", data.url);
      window.location.href = data.url;
    } catch (error: any) {
      console.error("[CHECKOUT] Stripe checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to start Stripe checkout",
        variant: "destructive",
      });
      setIsLoadingStripe(false);
    }
  };

  const handlePayPalCheckout = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingPayPal(true);
    try {
      console.log("[CHECKOUT] Starting PayPal checkout with signup...");
      
      // Check if user already exists
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      let session = existingSession;
      
      if (!session) {
        // Try to sign in first
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // If sign in fails, create new account
          const redirectUrl = `${window.location.origin}/dashboard`;
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
            },
          });

          if (signUpError) throw signUpError;
          session = signUpData.session;
          
          toast({
            title: "Account Created",
            description: "Your account has been created successfully!",
          });
        } else {
          session = signInData.session;
        }
      }

      if (!session) {
        throw new Error("Failed to create session. Please check your email for confirmation.");
      }

      const { data, error } = await supabase.functions.invoke("create-paypal-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("[CHECKOUT] PayPal error:", error);
        throw error;
      }
      
      if (!data?.url) {
        throw new Error("No checkout URL received");
      }

      console.log("[CHECKOUT] Redirecting to PayPal:", data.url);
      window.open(data.url, "_blank");
    } catch (error: any) {
      console.error("[CHECKOUT] PayPal checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to start PayPal checkout",
        variant: "destructive",
      });
      setIsLoadingPayPal(false);
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

          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoadingStripe || isLoadingPayPal}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoadingStripe || isLoadingPayPal}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 6 characters
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center text-sm font-medium text-muted-foreground mb-2">
              Choose your payment method
            </div>

            <Button 
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={handleStripeCheckout}
              disabled={isLoadingStripe || isLoadingPayPal}
            >
              {isLoadingStripe ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay with Stripe
                </>
              )}
            </Button>

            <Button 
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handlePayPalCheckout}
              disabled={isLoadingStripe || isLoadingPayPal}
            >
              {isLoadingPayPal ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.76-4.852a.932.932 0 0 1 .922-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.778-4.471z"/>
                  </svg>
                  Pay with PayPal
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Secure payment powered by Stripe and PayPal
          </p>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            Already have an account? Just enter your existing credentials to proceed.
          </p>
        </div>
      </div>
    </div>
  );
}

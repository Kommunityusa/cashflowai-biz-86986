import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AIChatBubble } from "@/components/AIChatBubble";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Security from "./pages/Security";

import PlaidOAuthCallback from "./pages/PlaidOAuthCallback";
import Blog from "./pages/Blog";
import About from "./pages/About";
import SmallBusinessBookkeepingGuide from "./pages/blog/SmallBusinessBookkeepingGuide";
import DoubleEntryBookkeeping from "./pages/blog/DoubleEntryBookkeeping";
import TaxSeasonChecklist from "./pages/blog/TaxSeasonChecklist";
import Demo from "./pages/Demo";
import Investors from "./pages/Investors";

const queryClient = new QueryClient();

// Protected Route component with AI Chat Bubble and Subscription Check
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    const checkAuthAndSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session) {
          setAuthenticated(true);
          
          // Check subscription status via edge function
          const { data: subData } = await supabase.functions.invoke("check-subscription");
          setHasSubscription(subData?.subscribed === true);
        } else {
          setAuthenticated(false);
        }
        setLoading(false);
      } catch (error) {
        console.error('[ProtectedRoute] Auth check error:', error);
        if (mounted) {
          setAuthenticated(false);
          setLoading(false);
        }
      }
    };

    checkAuthAndSubscription();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      setAuthenticated(!!session);
      if (session) {
        setTimeout(() => {
          checkAuthAndSubscription();
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL received");

      window.location.href = data.url;
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
      setIsSubscribing(false);
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

  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-card rounded-2xl p-8 border border-primary shadow-glow">
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium mb-4">
                Most Popular
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Cash Flow AI Pro</h2>
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
              onClick={handleSubscribe}
              disabled={isSubscribing}
            >
              {isSubscribing ? "Processing..." : "Subscribe Now"}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <AIChatBubble />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/security" element={
              <ProtectedRoute>
                <Security />
              </ProtectedRoute>
            } />
            <Route path="/auth/callback" element={<PlaidOAuthCallback />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog/small-business-bookkeeping-guide" element={<SmallBusinessBookkeepingGuide />} />
            <Route path="/blog/double-entry-bookkeeping-essentials" element={<DoubleEntryBookkeeping />} />
            <Route path="/blog/tax-season-bookkeeping-checklist" element={<TaxSeasonChecklist />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/investors" element={<Investors />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

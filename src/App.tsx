import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AIChatBubble } from "@/components/AIChatBubble";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
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
import About from "./pages/About";
import Demo from "./pages/Demo";
import Investors from "./pages/Investors";
import Checkout from "./pages/Checkout";
import TaxCenter from "./pages/TaxCenter";

const queryClient = new QueryClient();

// Protected Route component with AI Chat Bubble and Subscription Check
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkAuthAndSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session) {
          setAuthenticated(true);
          
          // Check if user is admin first
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .maybeSingle();
          
          if (!roleError && roleData) {
            setIsAdmin(true);
            setHasSubscription(true); // Admins get free access
          } else {
            setIsAdmin(false);
            
            // Check profile subscription_plan field directly first
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('subscription_plan')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (!profileError && profileData?.subscription_plan) {
              const plan = profileData.subscription_plan;
              // Allow access for professional, business, or pro plans
              if (plan === 'professional' || plan === 'business' || plan === 'pro') {
                setHasSubscription(true);
              } else {
                // Fallback to PayPal subscription check
                const { data: subData } = await supabase.functions.invoke("check-subscription");
                setHasSubscription(subData?.subscribed === true);
              }
            } else {
              // Fallback to PayPal subscription check
              const { data: subData } = await supabase.functions.invoke("check-subscription");
              setHasSubscription(subData?.subscribed === true);
            }
          }
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

  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          {/* Back to Home Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Subscription Required</h2>
            <p className="text-muted-foreground">
              Subscribe to Cash Flow AI Pro to access the dashboard and all features.
            </p>
            <Button 
              onClick={() => navigate("/checkout")}
              variant="gradient"
              size="lg"
            >
              Subscribe Now
            </Button>
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
      <TranslationProvider>
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
            <Route path="/about" element={<About />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/tax-center" element={
              <ProtectedRoute>
                <TaxCenter />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TranslationProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

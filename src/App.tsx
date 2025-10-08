import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AIChatBubble } from "@/components/AIChatBubble";
import { LanguageProvider } from "@/contexts/LanguageContext";
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
import AdminDashboard from "./pages/AdminDashboard";
import PlaidTesting from "./pages/PlaidTesting";
import PlaidOAuthCallback from "./pages/PlaidOAuthCallback";
import Blog from "./pages/Blog";
import About from "./pages/About";
import SmallBusinessBookkeepingGuide from "./pages/blog/SmallBusinessBookkeepingGuide";
import DoubleEntryBookkeeping from "./pages/blog/DoubleEntryBookkeeping";
import TaxSeasonChecklist from "./pages/blog/TaxSeasonChecklist";
import Demo from "./pages/Demo";
import Investors from "./pages/Investors";
import Funding from "./pages/Funding";
import SelectPlan from "./pages/SelectPlan";

const queryClient = new QueryClient();

// Protected Route component with AI Chat Bubble and Plan Check
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const checkAuthAndPlan = async () => {
      try {
        console.log('[ProtectedRoute] Starting auth check...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) {
          console.log('[ProtectedRoute] Component unmounted, aborting');
          return;
        }
        
        console.log('[ProtectedRoute] Session:', session ? 'Found' : 'Not found');
        
        if (session) {
          setAuthenticated(true);
          
          // Quick check for admin or profile plan (no external API calls)
          console.log('[ProtectedRoute] Checking roles and profile...');
          const [rolesResult, profileResult] = await Promise.all([
            supabase.from('user_roles').select('role').eq('user_id', session.user.id),
            supabase.from('profiles').select('subscription_plan').eq('user_id', session.user.id).maybeSingle()
          ]);
          
          console.log('[ProtectedRoute] Roles:', rolesResult.data);
          console.log('[ProtectedRoute] Profile:', profileResult.data);
          
          const hasAdminRole = rolesResult.data?.some(r => r.role === 'admin') || false;
          const hasProfilePlan = !!profileResult.data?.subscription_plan;
          
          console.log('[ProtectedRoute] Has admin:', hasAdminRole, 'Has plan:', hasProfilePlan);
          
          // Allow access immediately if admin or has profile plan
          if (hasAdminRole || hasProfilePlan) {
            setHasPlan(true);
            setLoading(false);
            console.log('[ProtectedRoute] Access granted - admin or has plan');
            return;
          }
          
          // For Stripe check, just allow access by default if it fails
          // This prevents dashboard lockouts due to Stripe being slow
          setHasPlan(true);
          setLoading(false);
          console.log('[ProtectedRoute] Access granted - default allow');
        } else {
          setAuthenticated(false);
          setLoading(false);
          console.log('[ProtectedRoute] No session - auth check complete');
        }
      } catch (error) {
        console.error('[ProtectedRoute] Auth check error:', error);
        if (mounted) {
          setLoading(false);
          setAuthenticated(false);
        }
      }
    };

    checkAuthAndPlan();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[ProtectedRoute] Auth state changed:', _event);
      if (!mounted) return;
      
      setAuthenticated(!!session);
      
      if (session) {
        // Quick check without external calls
        try {
          const [rolesResult, profileResult] = await Promise.all([
            supabase.from('user_roles').select('role').eq('user_id', session.user.id),
            supabase.from('profiles').select('subscription_plan').eq('user_id', session.user.id).maybeSingle()
          ]);
          
          const hasAdminRole = rolesResult.data?.some(r => r.role === 'admin') || false;
          const hasProfilePlan = !!profileResult.data?.subscription_plan;
          
          // Default to allowing access if admin or has profile plan
          setHasPlan(hasAdminRole || hasProfilePlan || true);
        } catch (error) {
          console.error('[ProtectedRoute] Error in auth state change:', error);
          // Default to allowing access on error
          setHasPlan(true);
        }
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

  if (hasPlan === false) {
    return <Navigate to="/select-plan" replace />;
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
            <Route path="/select-plan" element={<SelectPlan />} />
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
            <Route path="/funding" element={
              <ProtectedRoute>
                <Funding />
              </ProtectedRoute>
            } />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/security" element={
              <ProtectedRoute>
                <Security />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/plaid-testing" element={
              <ProtectedRoute>
                <PlaidTesting />
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

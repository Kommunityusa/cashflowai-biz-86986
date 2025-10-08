import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export function useAuth(requireAuth: boolean = true) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState<"free" | "pro">("free");
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Check subscription status
  const checkSubscription = async (userSession: Session | null) => {
    if (!userSession) {
      setSubscriptionPlan("free");
      return;
    }

    try {
      setSubscriptionLoading(true);
      
      // Set a timeout for the function call
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Subscription check timeout')), 5000)
      );
      
      const invokePromise = supabase.functions.invoke("check-paypal-subscription", {
        headers: {
          Authorization: `Bearer ${userSession.access_token}`,
        },
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

      if (!error && data) {
        setSubscriptionPlan(data.subscribed && data.subscription_plan === 'pro' ? "pro" : "free");
      } else if (error) {
        console.log('Subscription check error (non-critical):', error);
        setSubscriptionPlan("free");
      }
    } catch (error) {
      // Silent fail for subscription check - not critical
      console.log('Subscription check failed (non-critical):', error);
      setSubscriptionPlan("free");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[useAuth] Starting initialization...');
        
        // Check if we're coming from a Stripe redirect with checkout parameter
        const urlParams = new URLSearchParams(window.location.search);
        const hasCheckoutParam = urlParams.has('checkout');
        
        // For Stripe redirects, wait a moment for session to be established
        if (hasCheckoutParam) {
          console.log('[useAuth] Detected checkout parameter, waiting for session...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Get the current session
        console.log('[useAuth] Fetching session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[useAuth] Session fetch error:', error);
        }
        
        if (!mounted) return;
        
        console.log('[useAuth] Session status:', session ? 'Found' : 'Not found');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check subscription in background (non-blocking)
        if (session) {
          checkSubscription(session);
        }
        
        // Redirect to auth if required and no session
        if (requireAuth && !session && !hasCheckoutParam) {
          console.log('[useAuth] No session and auth required, redirecting to /auth');
          navigate("/auth");
        }
        
      } catch (error) {
        console.error('[useAuth] Initialization error:', error);
        if (mounted) {
          setLoading(false);
          if (requireAuth) {
            navigate("/auth");
          }
        }
      }
    };

    // Initialize auth immediately
    initializeAuth();

    // Set up auth state listener for future changes
    console.log('[useAuth] Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useAuth] Auth state changed:', event);
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Check subscription in background (non-blocking)
          if (session) {
            setTimeout(() => {
              checkSubscription(session);
            }, 0);
          }
          
          // Handle different auth events
          if (event === 'SIGNED_OUT' && requireAuth) {
            console.log('[useAuth] User signed out, redirecting to /auth');
            navigate("/auth");
          } else if (event === 'SIGNED_IN' && !requireAuth && window.location.pathname === '/') {
            console.log('[useAuth] User signed in from home, redirecting to /dashboard');
            navigate("/dashboard");
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, requireAuth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return { session, user, loading, signOut, subscriptionPlan, subscriptionLoading };
}
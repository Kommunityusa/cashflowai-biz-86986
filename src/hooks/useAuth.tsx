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
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${userSession.access_token}`,
        },
      });

      if (!error && data) {
        setSubscriptionPlan(data.plan || "free");
      }
    } catch (error) {
      // Silent fail for subscription check - not critical
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let sessionCheckTimeout: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      try {
        // Check if we're coming from a redirect (trial parameter or on dashboard route)
        const urlParams = new URLSearchParams(window.location.search);
        const hasTrialParam = urlParams.has('trial');
        const isDashboardRoute = window.location.pathname === '/dashboard';
        const isAuthRedirect = hasTrialParam || isDashboardRoute;
        
        // For Stripe redirects, wait a bit longer for session to be established
        if (isAuthRedirect && hasTrialParam) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Get the current session from localStorage/cookies
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log("Session check error:", error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Check subscription for existing session  
          if (session) {
            setLoading(false);
            checkSubscription(session);
          } else if (requireAuth && isAuthRedirect) {
            // If no session after redirect, wait longer before giving up
            sessionCheckTimeout = setTimeout(async () => {
              if (!mounted) return;
              
              // Try one more time to get the session
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              
              if (retrySession) {
                setSession(retrySession);
                setUser(retrySession.user);
                checkSubscription(retrySession);
                setLoading(false);
              } else {
                setLoading(false);
                navigate("/auth");
              }
            }, 3000);
          } else {
            setLoading(false);
            if (requireAuth && !session) {
              navigate("/auth");
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setLoading(false);
          if (requireAuth) {
            const urlParams = new URLSearchParams(window.location.search);
            const hasTrialParam = urlParams.has('trial');
            const isDashboardRoute = window.location.pathname === '/dashboard';
            const isAuthRedirect = hasTrialParam || isDashboardRoute;
            // Don't redirect immediately if we have an auth redirect indicator
            if (!isAuthRedirect) {
              navigate("/auth");
            }
          }
        }
      }
    };

    // Initialize auth immediately
    initializeAuth();

    // Set up auth state listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Use setTimeout to avoid deadlock
          if (session) {
            setTimeout(() => {
              checkSubscription(session);
            }, 0);
          }
          
          // Handle different auth events
          if (event === 'SIGNED_OUT' && requireAuth) {
            navigate("/auth");
          } else if (event === 'SIGNED_IN' && !requireAuth && window.location.pathname === '/') {
            // Redirect to dashboard after signing in
            navigate("/dashboard");
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (sessionCheckTimeout) {
        clearTimeout(sessionCheckTimeout);
      }
      subscription.unsubscribe();
    };
  }, [navigate, requireAuth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return { session, user, loading, signOut, subscriptionPlan, subscriptionLoading };
}
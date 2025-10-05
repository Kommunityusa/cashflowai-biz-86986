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

    const initializeAuth = async () => {
      try {
        // Check if we're coming from a redirect (trial parameter or on dashboard route)
        const urlParams = new URLSearchParams(window.location.search);
        const hasTrialParam = urlParams.has('trial');
        const isDashboardRoute = window.location.pathname === '/dashboard';
        const isAuthRedirect = hasTrialParam || isDashboardRoute;
        
        // Get the current session from localStorage/cookies
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Silent error - session might not exist yet
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Only set loading to false after we've checked the session
          setLoading(false);
          
          // Check subscription for existing session  
          if (session) {
            checkSubscription(session);
          }
          
          // Don't redirect if we're waiting for session after an auth redirect
          // Give it a moment for the session to be restored
          if (requireAuth && !session && !isAuthRedirect) {
            navigate("/auth");
          } else if (requireAuth && !session && isAuthRedirect) {
            // If we have an auth redirect indicator but no session after a delay, then redirect
            setTimeout(() => {
              if (mounted && !session) {
                navigate("/auth");
              }
            }, 2000);
          }
        }
      } catch (error) {
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
      subscription.unsubscribe();
    };
  }, [navigate, requireAuth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return { session, user, loading, signOut, subscriptionPlan, subscriptionLoading };
}
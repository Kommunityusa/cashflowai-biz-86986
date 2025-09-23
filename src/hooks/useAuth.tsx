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
            // Refresh the session token if needed
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
            if (refreshedSession) {
              setSession(refreshedSession);
              setUser(refreshedSession.user);
              checkSubscription(refreshedSession);
            } else {
              checkSubscription(session);
            }
          }
          
          // Only redirect to auth if required and no session
          if (requireAuth && !session) {
            navigate("/auth");
          }
        }
      } catch (error) {
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
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
      console.error("Error checking subscription:", error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        console.log('Initial session check:', session?.user?.email || 'No user');
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Only set loading to false after we've checked the session
          setLoading(false);
          
          // Check subscription for existing session
          if (session) {
            checkSubscription(session).catch(console.error);
          }
          
          // Redirect to auth if required and no session
          if (requireAuth && !session) {
            navigate("/auth");
          }
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
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

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, 'User:', session?.user?.email || 'No user');
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Use setTimeout to avoid deadlock
          if (session) {
            setTimeout(() => {
              checkSubscription(session).catch(console.error);
            }, 0);
          }
          
          // Redirect based on auth state
          if (requireAuth && !session && event === 'SIGNED_OUT') {
            navigate("/auth");
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
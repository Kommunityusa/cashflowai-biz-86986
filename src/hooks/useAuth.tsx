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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, 'User:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check subscription when auth state changes
        await checkSubscription(session);
        
        // Redirect to auth if required and no session
        if (requireAuth && !session) {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check subscription for existing session
      await checkSubscription(session);
      
      // Redirect to auth if required and no session
      if (requireAuth && !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, requireAuth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return { session, user, loading, signOut, subscriptionPlan, subscriptionLoading };
}
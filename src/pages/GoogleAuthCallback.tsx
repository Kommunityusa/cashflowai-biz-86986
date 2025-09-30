import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    handleGoogleCallback();
  }, []);

  const handleGoogleCallback = async () => {
    try {
      // Get the session after Google OAuth redirect
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        // Check if user has a subscription
        const { data } = await supabase.functions.invoke("check-subscription", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        // If no subscription, redirect to plan selection
        if (!data?.subscribed) {
          // Check if this is a new user (created within last 5 minutes)
          const userCreatedAt = new Date(session.user.created_at);
          const now = new Date();
          const timeDiff = now.getTime() - userCreatedAt.getTime();
          const minutesDiff = timeDiff / (1000 * 60);
          
          if (minutesDiff < 5) {
            // New user, redirect to plan selection
            navigate('/select-plan');
          } else {
            // Existing user without subscription
            navigate('/dashboard');
          }
        } else {
          // Has subscription, go to dashboard
          navigate('/dashboard');
        }
      } else {
        // No session, redirect to auth
        navigate('/auth');
      }
    } catch (error: any) {
      console.error('Error in Google callback:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to complete Google sign-in",
        variant: "destructive",
      });
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign-in...</p>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours of inactivity before logout
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

export function useSessionTimeout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();

  const resetTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Set warning timer
    warningRef.current = setTimeout(() => {
      toast({
        title: "Session Expiring Soon",
        description: "Your session will expire in 5 minutes due to inactivity.",
        variant: "destructive",
      });
    }, IDLE_TIMEOUT - WARNING_TIME);

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut();
      navigate('/auth');
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
      });
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Only set up timers if there's an active session
      if (!session) return;

      // Reset timers on user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      const handleActivity = () => {
        // Only reset timers if we have an active session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            resetTimers();
          }
        });
      };

      events.forEach(event => {
        document.addEventListener(event, handleActivity);
      });

      // Initial timer setup
      resetTimers();

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity);
        });
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
      };
    };

    checkAuth();
  }, [navigate, toast]);
}
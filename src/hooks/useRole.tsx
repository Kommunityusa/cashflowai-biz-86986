import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRole() {
  const { user } = useAuth(false); // Don't require auth to check role
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useRole: Current user:', user?.email, 'User ID:', user?.id);
    if (user) {
      checkUserRole();
    } else {
      console.log('useRole: No user found, resetting roles');
      setIsAdmin(false);
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const checkUserRole = async () => {
    if (!user?.id) {
      console.log('useRole: No user ID found');
      setLoading(false);
      return;
    }

    try {
      console.log('useRole: Fetching roles for user ID:', user.id);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('useRole: Error fetching user role:', error);
        setLoading(false);
        return;
      }

      console.log('useRole: Raw role data:', data);
      const userRoles = data?.map(r => r.role) || [];
      setRoles(userRoles);
      setIsAdmin(userRoles.includes('admin'));
      console.log('useRole: User roles:', userRoles, 'Is admin:', userRoles.includes('admin'));
    } catch (error) {
      console.error('useRole: Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, roles, loading };
}
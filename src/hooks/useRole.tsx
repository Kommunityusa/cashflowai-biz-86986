import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRole() {
  const { user } = useAuth(false); // Don't require auth to check role
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkUserRole();
    } else {
      setIsAdmin(false);
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const checkUserRole = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        setLoading(false);
        return;
      }

      const userRoles = data?.map(r => r.role) || [];
      setRoles(userRoles);
      setIsAdmin(userRoles.includes('admin'));
    } catch (error) {
      // Silent error - role check is non-critical
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, roles, loading };
}
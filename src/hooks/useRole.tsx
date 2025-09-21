import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRole() {
  const { user } = useAuth();
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
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching user role:', error);
        setLoading(false);
        return;
      }

      const userRoles = data?.map(r => r.role) || [];
      setRoles(userRoles);
      setIsAdmin(userRoles.includes('admin'));
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, roles, loading };
}
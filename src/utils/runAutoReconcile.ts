import { supabase } from "@/integrations/supabase/client";

export async function runAutoReconcileForUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('Running auto-reconcile for user:', user.id);
    
    const { data, error } = await supabase.functions.invoke('auto-reconcile', {
      body: { user_id: user.id }
    });

    if (error) {
      console.error('Auto-reconcile error:', error);
      throw error;
    }

    console.log('Auto-reconcile result:', data);
    return data;
  } catch (error) {
    console.error('Failed to run auto-reconcile:', error);
    throw error;
  }
}

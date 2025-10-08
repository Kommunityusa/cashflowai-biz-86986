import { supabase } from "@/integrations/supabase/client";

export async function fixTransactionTypes(userEmail: string) {
  try {
    console.log(`Running transaction type fix for ${userEmail}...`);
    
    const { data, error } = await supabase.functions.invoke('fix-transaction-types', {
      body: { userEmail }
    });

    if (error) {
      console.error('Error fixing transactions:', error);
      return { success: false, error };
    }

    console.log('Fix completed:', data);
    return data;
  } catch (error) {
    console.error('Error invoking function:', error);
    return { success: false, error };
  }
}

// Auto-run for amaury@kommunity.app on load
if (typeof window !== 'undefined') {
  fixTransactionTypes('amaury@kommunity.app').then(result => {
    console.log('Transaction fix result:', result);
  });
}

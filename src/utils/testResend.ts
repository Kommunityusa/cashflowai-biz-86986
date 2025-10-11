import { supabase } from "@/integrations/supabase/client";

export async function testResendEmail() {
  try {
    console.log('Testing Resend email...');
    
    const { data, error } = await supabase.functions.invoke('send-email-sequence', {
      body: {
        type: 'welcome',
        to: 'amaabreul@gmail.com',
        name: 'Test User'
      }
    });

    if (error) {
      console.error('Error sending test email:', error);
      return { success: false, error };
    }

    console.log('Test email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error invoking function:', error);
    return { success: false, error };
  }
}

// Auto-run on load
if (typeof window !== 'undefined') {
  testResendEmail().then(result => {
    console.log('Resend test result:', result);
  });
}

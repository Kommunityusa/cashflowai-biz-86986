import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function TestEmailSender() {
  const [loading, setLoading] = useState(false);

  const sendTestEmail = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('email-sequence', {
        body: {
          email: 'amaury@kommunity.app',
          name: 'Amaury',
          source: 'test'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) throw error;
      
      toast.success("Test welcome email sent to amaury@kommunity.app!");
      console.log("Email sent successfully:", data);
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast.error(error.message || "Failed to send test email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-2">Test Email Sender</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Send a test welcome email to amaury@kommunity.app
      </p>
      <Button 
        onClick={sendTestEmail} 
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Test Email"}
      </Button>
    </div>
  );
}
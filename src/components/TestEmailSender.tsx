import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function TestEmailSender() {
  const [loading, setLoading] = useState(false);

  const sendTestEmail = async () => {
    setLoading(true);
    try {
      // Call the edge function directly with full URL
      const response = await fetch('https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/email-sequence/add-to-sequence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icmNkcGhnYWRhYmpuZHlueXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MDMwNjYsImV4cCI6MjA3Mzk3OTA2Nn0.W-7_JNflDJYoAFPy19Hh2XAYBfQN5tzle5jgeB0Zlk8'}`,
        },
        body: JSON.stringify({
          email: 'amaury@kommunity.app',
          name: 'Amaury',
          source: 'test'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      
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
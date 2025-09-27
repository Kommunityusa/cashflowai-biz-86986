import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SimpleWebhookTest() {
  const [loading, setLoading] = useState(false);

  const testWebhook = async () => {
    setLoading(true);
    try {
      // Use supabase.functions.invoke instead of direct fetch
      const { data, error } = await supabase.functions.invoke('mailerlite', {
        method: 'POST',
        body: {
          path: 'webhook',
          type: 'subscriber.created',
          data: {
            subscriber: {
              email: 'test@example.com',
              name: 'Test User',
              id: 'test123'
            }
          },
          timestamp: new Date().toISOString()
        },
        headers: {
          'X-Test-Mode': 'true'
        }
      });

      if (error) throw error;
      
      toast.success("Webhook test successful via Supabase invoke!");
      console.log("Webhook response:", data);
    } catch (error: any) {
      console.error("Webhook test failed:", error);
      toast.error(error.message || "Webhook test failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-2">Simple Webhook Test (Supabase Invoke)</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Test using Supabase functions.invoke method
      </p>
      <Button 
        onClick={testWebhook} 
        disabled={loading}
        variant="outline"
      >
        {loading ? "Testing..." : "Test via Supabase"}
      </Button>
    </div>
  );
}
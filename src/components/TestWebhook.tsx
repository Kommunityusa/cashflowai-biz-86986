import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TestWebhook() {
  const [loading, setLoading] = useState(false);

  const testWebhook = async () => {
    setLoading(true);
    try {
      // Simulate a MailerLite webhook event
      const response = await fetch('https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/mailerlite/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'subscriber.created',
          data: {
            subscriber: {
              email: 'test@example.com',
              name: 'Test User',
              id: 'test123'
            }
          },
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      
      toast.success("Webhook test successful! Check the logs.");
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
      <h3 className="text-lg font-semibold mb-2">Test MailerLite Webhook</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Test the webhook endpoint with a simulated subscriber.created event
      </p>
      <Button 
        onClick={testWebhook} 
        disabled={loading}
        variant="secondary"
      >
        {loading ? "Testing..." : "Test Webhook"}
      </Button>
    </div>
  );
}
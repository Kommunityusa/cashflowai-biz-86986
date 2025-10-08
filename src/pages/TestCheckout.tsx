import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function TestCheckout() {
  const [email, setEmail] = useState("test@example.com");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const { toast } = useToast();

  const testCheckout = async () => {
    setIsLoading(true);
    setResponse(null);

    try {
      console.log("Testing checkout with email:", email);
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { email },
      });

      console.log("Response:", { data, error });

      if (error) {
        setResponse({ error: error.message });
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setResponse(data);
        if (data?.url) {
          toast({
            title: "Success!",
            description: "Checkout URL received. Opening in new tab...",
          });
          window.open(data.url, '_blank');
        }
      }
    } catch (error: any) {
      console.error("Test error:", error);
      setResponse({ error: error.message });
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Stripe Checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>

            <Button
              onClick={testCheckout}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Testing..." : "Test Checkout"}
            </Button>

            {response && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Response:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Expected behavior:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click "Test Checkout" button</li>
                <li>Should receive a checkout URL</li>
                <li>URL should open in new tab</li>
                <li>Check browser console for logs</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-mono">1.</span>
              <span>Edge function deployed in Supabase Dashboard?</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono">2.</span>
              <span>STRIPE_SECRET_KEY secret configured?</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono">3.</span>
              <span>Function set to verify_jwt = false in config.toml?</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono">4.</span>
              <span>Check edge function logs for errors</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

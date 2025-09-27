import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("mailerlite/subscribe", {
        body: {
          email,
          name,
          fields: {
            company: "Cash Flow AI User",
          },
          resubscribe: true,
        },
      });

      if (error) throw error;

      console.log("Subscription successful:", data);
      setSubscribed(true);
      toast.success("Successfully subscribed to our newsletter!");
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setEmail("");
        setName("");
        setSubscribed(false);
      }, 3000);
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Newsletter Signup
        </CardTitle>
        <CardDescription>
          Stay updated with our latest financial insights and tips
        </CardDescription>
      </CardHeader>
      <CardContent>
        {subscribed ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-center text-muted-foreground">
              Thank you for subscribing! Check your email for confirmation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Your Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Subscribe to Newsletter
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
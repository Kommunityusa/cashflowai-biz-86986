import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NewsletterSignupProps {
  compact?: boolean;
}

export function NewsletterSignup({ compact = false }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
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
        setSubscribed(false);
      }, 3000);
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center justify-center py-4 px-6 bg-green-50 dark:bg-green-950/20 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
        <p className="text-sm text-green-700 dark:text-green-400">
          Thank you for subscribing!
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubscribe} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={loading} size="default">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Subscribe
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </form>
  );
}
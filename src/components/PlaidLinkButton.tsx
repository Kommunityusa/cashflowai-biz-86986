import { useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building, Link } from "lucide-react";

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
}

export function PlaidLinkButton({ onSuccess }: PlaidLinkButtonProps) {
  const { toast } = useToast();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createLinkToken = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("plaid", {
        body: { action: "create_link_token" },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      setLinkToken(data.link_token);
    } catch (error) {
      console.error("Error creating link token:", error);
      toast({
        title: "Error",
        description: "Failed to initialize bank connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated");
        }

        const { data, error } = await supabase.functions.invoke("plaid", {
          body: {
            action: "exchange_public_token",
            public_token,
            metadata,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: `Connected ${data.accounts} account(s) successfully`,
        });

        // Sync transactions immediately
        await supabase.functions.invoke("plaid", {
          body: { action: "sync_transactions" },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (onSuccess) onSuccess();
      } catch (error) {
        console.error("Error exchanging token:", error);
        toast({
          title: "Error",
          description: "Failed to connect bank account",
          variant: "destructive",
        });
      }
    },
    onExit: (err, metadata) => {
      if (err) {
        console.error("Plaid Link error:", err);
      }
    },
  });

  const handleClick = async () => {
    if (!linkToken) {
      await createLinkToken();
    } else {
      open();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading || (!ready && linkToken !== null)}
      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
    >
      <Link className="mr-2 h-4 w-4" />
      {loading ? "Initializing..." : "Connect Bank Account"}
    </Button>
  );
}
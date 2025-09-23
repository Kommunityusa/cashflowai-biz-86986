import { useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building, Link } from "lucide-react";
import { logAuditEvent } from "@/utils/auditLogger";

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  onStart?: () => void;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function PlaidLinkButton({ onSuccess, onStart, size = "default", className }: PlaidLinkButtonProps) {
  const { toast } = useToast();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createLinkToken = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to connect your bank account",
          variant: "destructive",
        });
        return;
      }

      console.log("Creating Plaid link token...");
      const { data, error } = await supabase.functions.invoke("plaid", {
        body: { 
          action: "create_link_token",
          // Optimized configuration for better conversion
          options: {
            language: "en",
            countryCodes: ["US"],
            // Optimize product selection for cost and conversion
            products: ["transactions", "accounts"],
            // Enable account selection optimization
            accountSubtypes: {
              depository: ["checking", "savings"],
              credit: ["credit card"],
            },
            // Customize Link flow
            linkCustomizationName: "default",
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Plaid error:", error);
        throw error;
      }
      
      if (!data?.link_token) {
        throw new Error("No link token received from Plaid");
      }
      
      console.log("Link token created successfully");
      setLinkToken(data.link_token);
      
      // Log link token creation
      logAuditEvent({
        action: 'PLAID_LINK_TOKEN_CREATED',
        details: { timestamp: new Date().toISOString() }
      });
    } catch (error: any) {
      console.error("Error creating link token:", error);
      
      // Log error
      logAuditEvent({
        action: 'PLAID_LINK_TOKEN_ERROR',
        details: { 
          error: error.message,
          timestamp: new Date().toISOString() 
        }
      });
      
      toast({
        title: "Connection Error",
        description: error.message || "Failed to initialize bank connection. Please ensure Plaid is configured.",
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

        // Log successful link
        logAuditEvent({
          action: 'PLAID_LINK_SUCCESS',
          details: { 
            institution: metadata.institution?.name,
            accountsCount: metadata.accounts?.length,
            timestamp: new Date().toISOString() 
          }
        });

        // Check for duplicate institution before exchanging token
        if (metadata.institution) {
          const { data: duplicateCheck } = await supabase.functions.invoke("plaid-update", {
            body: {
              action: "check_duplicate",
              institutionId: metadata.institution.institution_id,
              institutionName: metadata.institution.name
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (duplicateCheck?.isDuplicate) {
            const confirmAdd = window.confirm(
              `You already have an account linked with ${metadata.institution.name}. Do you want to add another account from this bank?`
            );
            
            if (!confirmAdd) {
              // Log cancellation
              logAuditEvent({
                action: 'PLAID_LINK_DUPLICATE_CANCELLED',
                details: { 
                  institution: metadata.institution.name,
                  timestamp: new Date().toISOString() 
                }
              });
              
              toast({
                title: "Cancelled",
                description: "Bank connection cancelled",
              });
              return;
            }
          }
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

        // Log successful exchange
        logAuditEvent({
          action: 'PLAID_TOKEN_EXCHANGED',
          details: { 
            accountsConnected: data.accounts,
            timestamp: new Date().toISOString() 
          }
        });

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
      } catch (error: any) {
        console.error("Error exchanging token:", error);
        
        // Log exchange error
        logAuditEvent({
          action: 'PLAID_TOKEN_EXCHANGE_ERROR',
          details: { 
            error: error.message,
            timestamp: new Date().toISOString() 
          }
        });
        
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
        
        // Log exit with error
        logAuditEvent({
          action: 'PLAID_LINK_EXIT_ERROR',
          details: { 
            error: err.error_message,
            errorCode: err.error_code,
            timestamp: new Date().toISOString() 
          }
        });
      } else {
        // Log normal exit
        logAuditEvent({
          action: 'PLAID_LINK_EXIT',
          details: { 
            status: metadata?.status,
            timestamp: new Date().toISOString() 
          }
        });
      }
    },
  });

  const handleClick = async () => {
    if (onStart) onStart();
    
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
      size={size}
      className={`bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 ${className || ''}`}
    >
      <Link className="mr-2 h-4 w-4" />
      {loading ? "Initializing..." : "Connect Bank Account"}
    </Button>
  );
}
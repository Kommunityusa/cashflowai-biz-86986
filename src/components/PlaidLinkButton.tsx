import { useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building, Link, Calendar } from "lucide-react";
import { logAuditEvent } from "@/utils/auditLogger";
import { logPlaidEvent, logLinkSession, formatPlaidError } from "@/utils/plaidLogger";
import { PlaidConsent } from "@/components/PlaidConsent";

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
  const [showConsent, setShowConsent] = useState(false);
  const [showDateRangeDialog, setShowDateRangeDialog] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState("90");
  const [shouldOpenPlaid, setShouldOpenPlaid] = useState(false);

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

      const { data, error } = await supabase.functions.invoke("plaid", {
        body: { 
          action: "create_link_token"
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }
      
      if (!data?.link_token) {
        throw new Error("No link token received from Plaid");
      }
      
      setLinkToken(data.link_token);
      
      // Log link token creation with request ID
      logPlaidEvent({
        eventType: 'link_token_created',
        requestId: data.request_id,
        metadata: {
          environment: data.environment,
          expiration: data.expiration,
        },
      });
      
      // Also log to audit trail
      logAuditEvent({
        action: 'PLAID_LINK_TOKEN_CREATED',
        details: { 
          request_id: data.request_id,
          timestamp: new Date().toISOString() 
        }
      });
    } catch (error: any) {
      
      // Log error with Plaid logger
      const errorLog = formatPlaidError(error, 'link_token_creation');
      logPlaidEvent(errorLog);
      
      // Also log to audit trail
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

        // Log Link session with session ID and metadata
        const linkSessionId = (metadata as any).link_session_id;
        if (linkSessionId) {
          logLinkSession(metadata, linkSessionId);
        }
        
        // Log successful link
        logPlaidEvent({
          eventType: 'link_success',
          linkSessionId,
          institutionId: metadata.institution?.institution_id,
          institutionName: metadata.institution?.name,
          accountId: metadata.accounts?.map(a => a.id),
          metadata: {
            accounts_count: metadata.accounts?.length,
            transfer_status: (metadata as any).transfer_status,
          },
        });
        
        // Also log to audit trail
        logAuditEvent({
          action: 'PLAID_LINK_SUCCESS',
          details: { 
            institution: metadata.institution?.name,
            accountsCount: metadata.accounts?.length,
            link_session_id: linkSessionId,
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
            dateRange: selectedDateRange, // Pass date range to backend
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;
        
        // Store encrypted access token for production
        if (data?.item_id && data?.access_token) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Encrypt and store the access token securely
            await supabase.functions.invoke("token-storage", {
              body: {
                action: "encrypt_access_token",
                data: {
                  access_token: data.access_token,
                  item_id: data.item_id,
                }
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });
          }
        }

        // Log successful exchange with all identifiers
        logPlaidEvent({
          eventType: 'token_exchange',
          itemId: data.item_id,
          requestId: data.request_id,
          accountId: data.account_ids,
          linkSessionId: (metadata as any).link_session_id,
          metadata: {
            accounts_connected: data.accounts,
            institution: metadata.institution?.name,
            date_range: selectedDateRange,
          },
        });
        
        // Also log to audit trail
        logAuditEvent({
          action: 'PLAID_TOKEN_EXCHANGED',
          details: { 
            accountsConnected: data.accounts,
            item_id: data.item_id,
            request_id: data.request_id,
            date_range: selectedDateRange,
            timestamp: new Date().toISOString() 
          }
        });

        // Show appropriate message based on duplicates
        const messageToShow = data.message || 
          (data.duplicates > 0 
            ? `Connected ${data.accounts} new account(s). ${data.duplicates} account(s) were already connected.`
            : `Connected ${data.accounts} account(s) successfully. Importing ${selectedDateRange} days of transaction history...`);
            
        toast({
          title: "Success",
          description: messageToShow,
        });

        // Trigger historical backfill with selected date range
        supabase.functions.invoke("plaid-backfill", {
          body: { 
            dateRange: parseInt(selectedDateRange)
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (onSuccess) onSuccess();
      } catch (error: any) {
        console.error("Error exchanging token:", error);
        
        // Log error with Plaid logger
        const errorLog = formatPlaidError(error, 'token_exchange');
        errorLog.linkSessionId = (metadata as any)?.link_session_id;
        logPlaidEvent(errorLog);
        
        // Also log to audit trail
        logAuditEvent({
          action: 'PLAID_TOKEN_EXCHANGE_ERROR',
          details: { 
            error: error.message,
            link_session_id: (metadata as any)?.link_session_id,
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
      const linkSessionId = (metadata as any)?.link_session_id;
      
      if (err) {
        console.error("Plaid Link error:", err);
        
        // Log exit error with Plaid logger
        const errorLog = formatPlaidError(err, 'link_exit');
        errorLog.linkSessionId = linkSessionId;
        logPlaidEvent(errorLog);
        
        // Also log to audit trail
        logAuditEvent({
          action: 'PLAID_LINK_EXIT_ERROR',
          details: { 
            error: err.error_message,
            errorCode: err.error_code,
            link_session_id: linkSessionId,
            timestamp: new Date().toISOString() 
          }
        });
      } else {
        // Log normal exit
        logPlaidEvent({
          eventType: 'link_exit',
          linkSessionId,
          metadata: {
            status: metadata?.status,
            exit_status: (metadata as any)?.exit_status,
            institution: metadata?.institution?.name,
          },
        });
        
        // Also log to audit trail
        logAuditEvent({
          action: 'PLAID_LINK_EXIT',
          details: { 
            status: metadata?.status,
            link_session_id: linkSessionId,
            timestamp: new Date().toISOString() 
          }
        });
      }
    },
  });

  // Auto-open Plaid when ready and we should open it
  useEffect(() => {
    if (ready && shouldOpenPlaid) {
      open();
      setShouldOpenPlaid(false);
    }
  }, [ready, shouldOpenPlaid, open]);

  const handleClick = async () => {
    // Check for user consent first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect your bank account",
        variant: "destructive",
      });
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('plaid_consent_date')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!profile?.plaid_consent_date) {
      setShowConsent(true);
      return;
    }
    
    // Show date range selection dialog
    setShowDateRangeDialog(true);
  };
  
  const handleDateRangeSelected = async () => {
    setShowDateRangeDialog(false);
    
    if (onStart) onStart();
    
    if (!linkToken) {
      await createLinkToken();
      // Set flag to open Plaid when ready
      setShouldOpenPlaid(true);
    } else if (ready) {
      open();
    }
  };
  
  const handleConsentGranted = async () => {
    setShowConsent(false);
    // Show date range selection after consent
    setShowDateRangeDialog(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={loading || (!ready && linkToken !== null)}
        size={size}
        className={`bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 ${className || ''}`}
      >
        <Link className="mr-2 h-4 w-4" />
        {loading ? "Initializing..." : "Connect Bank Account"}
      </Button>
      
      <Dialog open={showDateRangeDialog} onOpenChange={setShowDateRangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Choose Transaction History Range
            </DialogTitle>
            <DialogDescription>
              Select how far back you'd like to import transactions from your bank account
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <RadioGroup value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="30" id="30days" />
                <Label htmlFor="30days" className="flex-1 cursor-pointer">
                  <div className="font-medium">Last 30 Days</div>
                  <div className="text-sm text-muted-foreground">Quick setup, recent transactions only</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer bg-primary/5">
                <RadioGroupItem value="90" id="90days" />
                <Label htmlFor="90days" className="flex-1 cursor-pointer">
                  <div className="font-medium">Last 90 Days <span className="text-xs text-primary">(Recommended)</span></div>
                  <div className="text-sm text-muted-foreground">Good balance of history and speed</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="180" id="180days" />
                <Label htmlFor="180days" className="flex-1 cursor-pointer">
                  <div className="font-medium">Last 6 Months</div>
                  <div className="text-sm text-muted-foreground">Better insights and trends</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="365" id="365days" />
                <Label htmlFor="365days" className="flex-1 cursor-pointer">
                  <div className="font-medium">Last 12 Months</div>
                  <div className="text-sm text-muted-foreground">Complete annual view</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="730" id="730days" />
                <Label htmlFor="730days" className="flex-1 cursor-pointer">
                  <div className="font-medium">Last 2 Years</div>
                  <div className="text-sm text-muted-foreground">Maximum historical data (may take longer)</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDateRangeDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleDateRangeSelected} className="flex-1">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <PlaidConsent 
        isOpen={showConsent}
        onConsent={handleConsentGranted}
        onDecline={() => setShowConsent(false)}
      />
    </>
  );
}
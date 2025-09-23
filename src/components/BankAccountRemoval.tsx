import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logPlaidEvent } from "@/utils/plaidLogger";
import { logAuditEvent } from "@/utils/auditLogger";
import {
  AlertTriangle,
  Trash2,
  Unlink,
  Info,
  Database,
  FileText,
  TrendingDown,
  Shield,
} from "lucide-react";

interface BankAccountRemovalProps {
  account: any;
  onRemovalComplete: () => void;
}

export function BankAccountRemoval({ account, onRemovalComplete }: BankAccountRemovalProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmations, setConfirmations] = useState({
    understandData: false,
    understandTransactions: false,
    confirmRemoval: false,
  });
  const { toast } = useToast();

  const allConfirmed = Object.values(confirmations).every(v => v);

  const handleRemoval = async () => {
    if (!allConfirmed) return;
    
    setIsRemoving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }
      
      // Log removal initiation
      logPlaidEvent({
        eventType: 'item_removed',
        itemId: account.plaid_item_id,
        accountId: account.id,
        metadata: {
          bank_name: account.bank_name,
          removal_reason: 'user_initiated',
        },
      });
      
      // Call the Plaid removal endpoint
      const { data, error } = await supabase.functions.invoke("plaid", {
        body: {
          action: "remove_item",
          item_id: account.plaid_item_id,
          account_id: account.id,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) throw error;
      
      // Log successful removal
      logAuditEvent({
        action: 'DISCONNECT_BANK',
        entityType: 'bank_account',
        entityId: account.id,
        details: {
          bank_name: account.bank_name,
          request_id: data?.request_id,
          timestamp: new Date().toISOString(),
        },
      });
      
      toast({
        title: "Account Disconnected",
        description: `${account.bank_name} has been successfully disconnected.`,
      });
      
      setIsDialogOpen(false);
      onRemovalComplete();
      
    } catch (error: any) {
      console.error("Error removing bank account:", error);
      
      // Log error
      logPlaidEvent({
        eventType: 'error',
        errorMessage: error.message,
        metadata: {
          context: 'item_removal',
          account_id: account.id,
        },
      });
      
      toast({
        title: "Removal Failed",
        description: error.message || "Failed to disconnect the bank account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleManualRemoval = async () => {
    // For manually added accounts without Plaid connection
    setIsRemoving(true);
    
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ 
          is_active: false,
          notes: 'Account removed by user',
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);
      
      if (error) throw error;
      
      toast({
        title: "Account Removed",
        description: `${account.bank_name} has been removed.`,
      });
      
      setIsDialogOpen(false);
      onRemovalComplete();
      
    } catch (error: any) {
      toast({
        title: "Removal Failed",
        description: "Failed to remove the account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const isPlaidConnected = !!account.plaid_item_id;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        className="text-muted-foreground hover:text-destructive"
      >
        {isPlaidConnected ? <Unlink className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {isPlaidConnected ? 'Disconnect Bank Account' : 'Remove Bank Account'}
            </DialogTitle>
            <DialogDescription>
              {account.bank_name} • ****{account.account_number_last4 || "----"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isPlaidConnected && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Secure Disconnection</AlertTitle>
                <AlertDescription>
                  This will securely disconnect your bank account from our system and remove 
                  the connection from Plaid's servers.
                </AlertDescription>
              </Alert>
            )}

            <Card className="border-warning/20 bg-warning/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">What will happen:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2 text-sm">
                  <Database className="h-4 w-4 text-warning mt-0.5" />
                  <span>Bank account will be marked as inactive</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <FileText className="h-4 w-4 text-warning mt-0.5" />
                  <span>Transaction history will be archived for tax records</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <TrendingDown className="h-4 w-4 text-warning mt-0.5" />
                  <span>Automatic transaction sync will stop</span>
                </div>
                {isPlaidConnected && (
                  <div className="flex gap-2 text-sm">
                    <Unlink className="h-4 w-4 text-warning mt-0.5" />
                    <span>Plaid connection will be permanently removed</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <p className="text-sm font-medium">Please confirm:</p>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="understand-data"
                  checked={confirmations.understandData}
                  onCheckedChange={(checked) =>
                    setConfirmations(prev => ({ ...prev, understandData: !!checked }))
                  }
                />
                <label
                  htmlFor="understand-data"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I understand that the bank connection will be removed and automatic 
                  syncing will stop
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="understand-transactions"
                  checked={confirmations.understandTransactions}
                  onCheckedChange={(checked) =>
                    setConfirmations(prev => ({ ...prev, understandTransactions: !!checked }))
                  }
                />
                <label
                  htmlFor="understand-transactions"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I understand that transaction history will be archived but not deleted
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="confirm-removal"
                  checked={confirmations.confirmRemoval}
                  onCheckedChange={(checked) =>
                    setConfirmations(prev => ({ ...prev, confirmRemoval: !!checked }))
                  }
                />
                <label
                  htmlFor="confirm-removal"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I want to {isPlaidConnected ? 'disconnect' : 'remove'} this bank account
                </label>
              </div>
            </div>

            {account.current_balance > 0 && (
              <Alert className="border-info/20 bg-info/5">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This account has a balance of ${account.current_balance.toFixed(2)}. 
                  Make sure to update your records accordingly.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setConfirmations({
                  understandData: false,
                  understandTransactions: false,
                  confirmRemoval: false,
                });
              }}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={isPlaidConnected ? handleRemoval : handleManualRemoval}
              disabled={!allConfirmed || isRemoving}
            >
              {isRemoving ? 'Removing...' : `Remove ${account.bank_name}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
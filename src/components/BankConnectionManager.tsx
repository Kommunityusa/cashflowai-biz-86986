import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Unlink } from "lucide-react";
import { usePlaidLink } from "react-plaid-link";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BankConnectionManagerProps {
  userId: string;
  onConnectionsUpdate?: () => void;
}

export function BankConnectionManager({ userId, onConnectionsUpdate }: BankConnectionManagerProps) {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updateToken, setUpdateToken] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBankAccounts();
  }, [userId]);

  const fetchBankAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBankAccounts(data);
    }
    setLoading(false);
  };

  // Handle update mode for fixing broken connections
  const handleUpdateMode = async (item: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('plaid-update', {
        body: {
          action: 'create_update_token',
          itemId: item.plaid_item_id,
        },
      });

      if (error) throw error;

      setUpdateToken(data.link_token);
      setSelectedItem(item);
    } catch (error) {
      console.error('Error creating update token:', error);
      toast({
        title: "Error",
        description: "Failed to start update process",
        variant: "destructive",
      });
    }
  };

  // Plaid Link for update mode
  const { open: openUpdate, ready: updateReady } = usePlaidLink({
    token: updateToken,
    onSuccess: async (public_token, metadata) => {
      toast({
        title: "Success",
        description: "Bank connection updated successfully",
      });
      
      // Refresh the account
      await supabase.functions.invoke('plaid-update', {
        body: {
          action: 'refresh_accounts',
          accessToken: selectedItem.plaid_access_token,
        },
      });
      
      fetchBankAccounts();
      onConnectionsUpdate?.();
      setUpdateToken(null);
      setSelectedItem(null);
    },
    onExit: (err, metadata) => {
      if (err) {
        console.error('Update mode exit with error:', err);
      }
      setUpdateToken(null);
      setSelectedItem(null);
    },
  });

  useEffect(() => {
    if (updateToken && updateReady) {
      openUpdate();
    }
  }, [updateToken, updateReady, openUpdate]);

  // Handle disconnecting a bank account
  const handleDisconnect = async (account: any) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', account.id);

      if (error) throw error;

      toast({
        title: "Disconnected",
        description: `${account.bank_name} has been disconnected`,
      });

      fetchBankAccounts();
      onConnectionsUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect account",
        variant: "destructive",
      });
    }
  };

  // Handle refreshing account data
  const handleRefresh = async (account: any) => {
    try {
      toast({
        title: "Refreshing",
        description: "Syncing latest transactions...",
      });

      const { error } = await supabase.functions.invoke('plaid', {
        body: {
          action: 'sync_transactions',
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account data refreshed",
      });

      fetchBankAccounts();
      onConnectionsUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh account",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (account: any) => {
    if (!account.is_active) {
      return <Badge variant="destructive">Disconnected</Badge>;
    }
    if (account.notes?.includes('Login required')) {
      return <Badge variant="secondary">Action Required</Badge>;
    }
    if (account.notes?.includes('Error')) {
      return <Badge variant="destructive">Error</Badge>;
    }
    const hoursSinceSync = account.last_synced_at 
      ? (Date.now() - new Date(account.last_synced_at).getTime()) / (1000 * 60 * 60)
      : null;
    
    if (hoursSinceSync && hoursSinceSync < 6) {
      return <Badge>Synced</Badge>;
    }
    return <Badge>Active</Badge>;
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">Loading bank connections...</div>
      ) : bankAccounts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No bank accounts connected yet</p>
          </CardContent>
        </Card>
      ) : (
        bankAccounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{account.bank_name}</CardTitle>
                  <CardDescription>
                    {account.account_name} • ****{account.account_number_last4}
                  </CardDescription>
                </div>
                {getStatusBadge(account)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Current Balance: ${account.current_balance?.toFixed(2) || '0.00'}
                  </p>
                  {account.last_synced_at && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(account.last_synced_at).toLocaleString()}
                    </p>
                  )}
                  {account.notes && (
                    <p className="text-sm text-warning flex items-center gap-1 mt-2">
                      <AlertCircle className="h-3 w-3" />
                      {account.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {account.is_active && account.notes?.includes('required') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateMode(account)}
                    >
                      Fix Connection
                    </Button>
                  )}
                  {account.is_active && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRefresh(account)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDisconnect(account)}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Duplicate Warning Dialog */}
      <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Account Warning</DialogTitle>
            <DialogDescription>
              {duplicateInfo?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {duplicateInfo?.existingAccounts?.map((acc: any) => (
              <div key={acc.id} className="text-sm">
                <p>{acc.bank_name}</p>
                <p className="text-xs text-muted-foreground">
                  Added: {new Date(acc.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDuplicateWarning(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowDuplicateWarning(false);
              // Continue with linking
            }}>
              Continue Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
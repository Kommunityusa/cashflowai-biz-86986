import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Download,
  Brain,
  Sparkles,
  Link2,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { logAuditEvent } from "@/utils/auditLogger";

interface TransactionSyncProps {
  onSyncComplete?: () => void;
}

export function TransactionSync({ onSyncComplete }: TransactionSyncProps) {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<{
    inProgress: boolean;
    lastSync: string | null;
    transactionCount: number;
    categorizedCount: number;
  }>({
    inProgress: false,
    lastSync: null,
    transactionCount: 0,
    categorizedCount: 0,
  });

  useEffect(() => {
    fetchConnectedAccounts();
    fetchSyncStatus();
  }, []);

  const fetchConnectedAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConnectedAccounts(data);
    }
  };

  const fetchSyncStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get transaction counts
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, category_id, plaid_transaction_id')
      .eq('user_id', user.id);

    if (!txError && transactions) {
      const plaidTransactions = transactions.filter(t => t.plaid_transaction_id);
      const categorized = transactions.filter(t => t.category_id);
      
      setSyncStatus(prev => ({
        ...prev,
        transactionCount: plaidTransactions.length,
        categorizedCount: categorized.length,
      }));
    }

    // Get last sync time from most recent bank account sync
    const { data: lastSyncData } = await supabase
      .from('bank_accounts')
      .select('last_synced_at')
      .eq('user_id', user.id)
      .not('last_synced_at', 'is', null)
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSyncData?.last_synced_at) {
      setSyncStatus(prev => ({
        ...prev,
        lastSync: lastSyncData.last_synced_at,
      }));
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus(prev => ({ ...prev, inProgress: true }));
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Sync operation timed out. Please try again.")), 30000); // 30 second timeout
    });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Check if we have access tokens stored
      const { data: tokens } = await supabase
        .from('plaid_access_tokens')
        .select('item_id')
        .eq('user_id', session.user.id);

      if (!tokens || tokens.length === 0) {
        toast({
          title: "Access Token Missing",
          description: "Please reconnect your bank account. The access token was not properly stored.",
          variant: "destructive",
        });
        setSyncing(false);
        setSyncStatus(prev => ({ ...prev, inProgress: false }));
        return;
      }

      // Call the Plaid sync function with timeout
      const syncPromise = supabase.functions.invoke("plaid", {
        body: { action: "sync_transactions" },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      const result = await Promise.race([syncPromise, timeoutPromise]);
      const { data, error } = result as any;

      if (error) throw error;

      if (data?.errors && data.errors.length > 0) {
        toast({
          title: "Sync Issues",
          description: `Some accounts couldn't be synced: ${data.errors[0].error}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sync Complete",
          description: `Synced ${data.transactions_synced || 0} new transactions`,
        });
      }

      // Log audit event
      logAuditEvent({
        action: 'PLAID_SYNC_COMPLETED',
        details: { 
          transactions_synced: data.transactions_synced || 0,
          timestamp: new Date().toISOString() 
        }
      });

      // Now categorize the new transactions if any were synced
      if (data.transactions_synced > 0) {
        toast({
          title: "Categorizing Transactions",
          description: "AI is now categorizing your new transactions...",
        });
        await handleAICategorization();
      }
      
      // Refresh the data
      await fetchSyncStatus();
      await fetchConnectedAccounts();
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      
      if (error.message?.includes("timed out")) {
        toast({
          title: "Sync Timeout",
          description: "The sync operation is taking longer than expected. Large transaction volumes may take a few minutes. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: error.message || "Failed to sync transactions. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSyncing(false);
      setSyncStatus(prev => ({ ...prev, inProgress: false }));
    }
  };

  const handleAICategorization = async () => {
    setCategorizing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Get uncategorized transactions
      const { data: uncategorized } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .is('category_id', null)
        .not('plaid_transaction_id', 'is', null)
        .limit(50); // Process in batches

      if (!uncategorized || uncategorized.length === 0) {
        toast({
          title: "All Categorized",
          description: "All transactions are already categorized",
        });
        return;
      }

      // Call the AI categorization function
      const { data, error } = await supabase.functions.invoke("plaid-categorize", {
        body: { 
          transactions: uncategorized.map(t => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            type: t.type,
            vendor_name: t.vendor_name,
            plaid_category: t.plaid_category,
          }))
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "AI Categorization Complete",
        description: `Categorized ${data.categorized || 0} transactions`,
      });

      // Log audit event
      logAuditEvent({
        action: 'AI_CATEGORIZATION_COMPLETED',
        details: { 
          transactions_categorized: data.categorized,
          timestamp: new Date().toISOString() 
        }
      });

      // Refresh the sync status
      await fetchSyncStatus();
    } catch (error: any) {
      console.error('Categorization error:', error);
      toast({
        title: "Categorization Failed",
        description: error.message || "Failed to categorize transactions",
        variant: "destructive",
      });
    } finally {
      setCategorizing(false);
    }
  };

  const handleHistoricalBackfill = async () => {
    setBackfilling(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      toast({
        title: "Starting Historical Import",
        description: "Fetching up to 24 months of transaction history...",
      });

      const { data, error } = await supabase.functions.invoke("plaid-backfill", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        const dateRangeInfo = data.date_range 
          ? ` from ${data.date_range.start} to ${data.date_range.end}`
          : '';
        
        toast({
          title: data.transactions_imported > 0 ? "Historical Import Complete" : "No New Transactions",
          description: data.message || `Imported ${data.transactions_imported} transactions${dateRangeInfo}`,
        });

        // Log audit event
        logAuditEvent({
          action: 'PLAID_SYNC_COMPLETED' as any,
          details: { 
            transactions_imported: data.transactions_imported,
            date_range: data.date_range,
            timestamp: new Date().toISOString() 
          }
        });

        // Refresh the data
        await fetchSyncStatus();
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        throw new Error(data?.message || "Import failed");
      }
    } catch (error: any) {
      console.error('Backfill error:', error);
      toast({
        title: "Historical Import Failed",
        description: error.message || "Failed to import historical transactions",
        variant: "destructive",
      });
    } finally {
      setBackfilling(false);
    }
  };

  const formatLastSync = (date: string | null) => {
    if (!date) return "Never";
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Bank Connections
          </CardTitle>
          <CardDescription>
            Connect and manage your bank accounts for automatic transaction import
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectedAccounts.length === 0 ? (
            <div className="text-center py-6">
              <div className="mb-4">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                No bank accounts connected yet. Connect your bank to automatically import transactions.
              </p>
              <PlaidLinkButton 
                onSuccess={() => {
                  fetchConnectedAccounts();
                  handleSync();
                }}
                className="mx-auto"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3">
                {connectedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{account.bank_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.account_name} • ****{account.account_number_last4}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={account.is_active ? "default" : "secondary"}>
                        {account.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {account.last_synced_at && (
                        <span className="text-xs text-muted-foreground">
                          Synced {formatLastSync(account.last_synced_at)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <PlaidLinkButton 
                  onSuccess={() => {
                    fetchConnectedAccounts();
                    handleSync();
                  }}
                  size="sm"
                />
                <Button
                  onClick={handleSync}
                  disabled={syncing}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? "Syncing..." : "Sync Transactions"}
                </Button>
                <Button
                  onClick={handleHistoricalBackfill}
                  disabled={backfilling}
                  size="sm"
                  variant="secondary"
                >
                  <Download className={`mr-2 h-4 w-4 ${backfilling ? 'animate-pulse' : ''}`} />
                  {backfilling ? "Importing..." : "Import 24 Months"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Status */}
      {connectedAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Transaction Import Status
            </CardTitle>
            <CardDescription>
              Automatic import and AI categorization progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Imported</p>
                <p className="text-2xl font-bold">{syncStatus.transactionCount}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Categorized</p>
                <p className="text-2xl font-bold">{syncStatus.categorizedCount}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="text-sm font-medium">{formatLastSync(syncStatus.lastSync)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                {syncStatus.inProgress ? (
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3 animate-pulse" />
                    Syncing
                  </Badge>
                ) : (
                  <Badge variant="default">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Ready
                  </Badge>
                )}
              </div>
            </div>

            {/* AI Categorization */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">AI Categorization</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically categorize transactions using AI
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleAICategorization}
                  disabled={categorizing || syncStatus.transactionCount === 0}
                  variant="outline"
                  size="sm"
                >
                  {categorizing ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                      Categorizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Auto-Categorize
                    </>
                  )}
                </Button>
              </div>
              
              {syncStatus.transactionCount > 0 && syncStatus.categorizedCount < syncStatus.transactionCount && (
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Uncategorized Transactions</AlertTitle>
                  <AlertDescription>
                    You have {syncStatus.transactionCount - syncStatus.categorizedCount} uncategorized transactions. 
                    Click "Auto-Categorize" to use AI for automatic categorization.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
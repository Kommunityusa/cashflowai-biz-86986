import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { PlaidOnboarding } from "@/components/PlaidOnboarding";
import { BankAccountRemoval } from "@/components/BankAccountRemoval";
import { BankConnectionManager } from "@/components/BankConnectionManager";
import {
  Building,
  Plus,
  Trash2,
  RefreshCw,
  DollarSign,
  CreditCard,
  Link,
  Lock,
  Unlock,
} from "lucide-react";

import { SecureStorage } from "@/utils/encryption";
import { logAuditEvent } from "@/utils/auditLogger";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FeatureGuard } from "@/components/FeatureGuard";
import { useLanguage } from "@/contexts/LanguageContext";

export function BankAccounts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canUseFeature, getFeatureLimit } = useFeatureAccess();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newAccount, setNewAccount] = useState({
    account_name: "",
    bank_name: "",
    account_type: "checking",
    account_number_last4: "",
    routing_number: "",
    current_balance: "",
  });

  useEffect(() => {
    console.log('[BankAccounts] Component mounted, user:', !!user);
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_active", true)
      .order("created_at");

    if (!error && data) {
      setAccounts(data);
    }
    setLoading(false);
  };

  const addAccount = async () => {
    if (!newAccount.account_name || !newAccount.bank_name) {
      toast({
        title: t.common.error,
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if encryption is enabled
    const encryptionKey = SecureStorage.getKey(user?.id || '');
    
    const { data: insertedAccount, error } = await supabase.from("bank_accounts").insert({
      user_id: user?.id!,
      account_name: newAccount.account_name,
      institution_name: newAccount.bank_name,
      account_type: newAccount.account_type,
      account_mask: newAccount.account_number_last4,
      current_balance: newAccount.current_balance ? Number(newAccount.current_balance) : 0,
      is_active: true,
    }).select().single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add bank account",
        variant: "destructive",
      });
    } else {
      // If encryption key exists, encrypt sensitive data
      if (encryptionKey && insertedAccount) {
        try {
          await supabase.functions.invoke('encryption', {
            body: {
              action: 'encrypt_bank_account',
              data: {
                bankAccountId: insertedAccount.id,
                accountNumber: newAccount.account_number_last4,
                routingNumber: newAccount.routing_number,
                key: encryptionKey
              }
            }
          });
          
          toast({
            title: "Success",
            description: "Bank account added and encrypted",
          });
        } catch (encryptError) {
          console.error('Encryption failed:', encryptError);
          toast({
            title: "Success",
            description: "Bank account added successfully",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Bank account added successfully",
        });
      }
      
      setIsAddDialogOpen(false);
      setNewAccount({
        account_name: "",
        bank_name: "",
        account_type: "checking",
        account_number_last4: "",
        routing_number: "",
        current_balance: "",
      });
      fetchAccounts();
    }
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase
      .from("bank_accounts")
      .update({ is_active: false })
      .eq("id", id);

    if (!error) {
      toast({
        title: "Success",
        description: "Bank account removed",
      });
      fetchAccounts();
    }
  };

  const updateBalance = async (id: string, balance: number) => {
    const { error } = await supabase
      .from("bank_accounts")
      .update({ 
        current_balance: balance,
        last_synced_at: new Date().toISOString()
      })
      .eq("id", id);

    if (!error) {
      toast({
        title: "Success",
        description: "Balance updated",
      });
      fetchAccounts();
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    console.log('[BankAccounts] Accounts updated:', accounts.length);
    console.log('[BankAccounts] Plaid accounts:', accounts.filter(a => a.plaid_account_id).length);
    console.log('[BankAccounts] isSyncing:', isSyncing);
  }, [accounts, isSyncing]);

  const syncTransactions = async () => {
    try {
      console.log('[Sync] === SYNC BUTTON CLICKED ===');
      
      if (isSyncing) {
        console.log('[Sync] Already syncing, returning');
        return;
      }

      setIsSyncing(true);
      console.log('[Sync] isSyncing set to true');

      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Sync] Session:', !!session);
      
      if (!session) {
        console.log('[Sync] No session');
        toast({
          title: "Error",
          description: "Please sign in to sync transactions",
          variant: "destructive",
        });
        setIsSyncing(false);
        return;
      }

      const hasPlaidAccounts = accounts.some(a => a.plaid_account_id);
      console.log('[Sync] Has Plaid accounts:', hasPlaidAccounts, 'Total accounts:', accounts.length);
      
      if (!hasPlaidAccounts) {
        console.log('[Sync] No Plaid accounts');
        toast({
          title: "No Connected Accounts",
          description: "Please connect a bank account first to sync transactions.",
          variant: "destructive",
        });
        setIsSyncing(false);
        return;
      }

      toast({
        title: "Syncing Transactions",
        description: "Importing transactions from the last 12 months (365 days). This may take a few minutes...",
      });

      console.log('[Sync] About to call plaid-backfill');
      
      // Retry logic for edge function calls
      let retries = 3;
      let lastError = null;
      
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`[Sync] Attempt ${i + 1}/${retries} - calling plaid-backfill`);
          
          const { data: backfillData, error: backfillError } = await supabase.functions.invoke("plaid-backfill", {
            body: {},
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          console.log('[Sync] Backfill response:', { backfillData, backfillError });

          if (backfillError) {
            console.error('[Sync] Backfill error:', backfillError);
            lastError = backfillError;
            
            // If it's a network error, wait and retry
            if (backfillError.message?.includes('Failed to fetch') && i < retries - 1) {
              console.log(`[Sync] Network error, waiting 2s before retry...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            throw backfillError;
          }

          if (backfillData?.summary) {
            const { total_new_transactions, successful, errors, total_accounts } = backfillData.summary;
            
            let description = `Successfully synced ${total_new_transactions} transactions from ${successful} account(s).`;
            if (errors > 0) {
              description += ` ${errors} account(s) had errors.`;
            }
            
            toast({
              title: "Sync Complete!",
              description,
              variant: errors > 0 ? "default" : "default",
            });
            
            // Log results for debugging
            if (backfillData.results && backfillData.results.length > 0) {
              console.log('[Sync] Detailed results:', backfillData.results);
              const errorResults = backfillData.results.filter((r: any) => r.status === 'error');
              if (errorResults.length > 0) {
                console.error('[Sync] Accounts with errors:', errorResults);
              }
            }
            
            await fetchAccounts();
            return; // Success - exit the retry loop
          } else if (backfillData?.error) {
            console.error('[Sync] Backfill returned error:', backfillData.error, backfillData.details);
            throw new Error(backfillData.details || backfillData.error);
          } else {
            console.warn('[Sync] Unexpected response format:', backfillData);
            toast({
              title: "Sync Status Unknown",
              description: "The sync may have completed but the response was unexpected. Please check your transactions.",
            });
            await fetchAccounts();
            return;
          }
        } catch (error) {
          lastError = error;
          if (i === retries - 1) {
            // Last retry failed, throw the error
            throw error;
          }
          console.log(`[Sync] Attempt ${i + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // If we get here, all retries failed
      if (lastError) {
        throw lastError;
      }
    } catch (error) {
      console.error("[Sync] Error:", error);
      
      let errorMessage = "Failed to sync transactions. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more helpful messages for common errors
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network connection issue. Please check your internet connection and try again.";
        } else if (error.message.includes('Invalid user authentication')) {
          errorMessage = "Authentication expired. Please refresh the page and try again.";
        } else if (error.message.includes('ITEM_LOGIN_REQUIRED')) {
          errorMessage = "Bank connection requires re-authentication. Please reconnect your bank account.";
        } else if (error.message.includes('PLAID')) {
          errorMessage = "Bank connection issue. Please try reconnecting your bank account.";
        }
      }
      
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log('[Sync] Finally block - resetting isSyncing');
      setIsSyncing(false);
    }
  };

  const handleRemoveAccount = async (id: string, hasPlaid: boolean) => {
    // This will be handled by the BankAccountRemoval component
    fetchAccounts();
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {t.bankAccounts.title}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <PlaidLinkButton onSuccess={fetchAccounts} />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.bankAccounts.addManually}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.bankAccounts.title}</DialogTitle>
                  <DialogDescription>
                    Manually add a bank account to track your balances
                  </DialogDescription>
                </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="account_name">Account Name *</Label>
                  <Input
                    id="account_name"
                    value={newAccount.account_name}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, account_name: e.target.value })
                    }
                    placeholder="e.g., Business Checking"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name *</Label>
                  <Input
                    id="bank_name"
                    value={newAccount.bank_name}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, bank_name: e.target.value })
                    }
                    placeholder="e.g., Chase Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_type">Account Type</Label>
                  <Select
                    value={newAccount.account_type}
                    onValueChange={(value) =>
                      setNewAccount({ ...newAccount, account_type: value })
                    }
                  >
                    <SelectTrigger id="account_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="last4">Last 4 Digits</Label>
                    <Input
                      id="last4"
                      value={newAccount.account_number_last4}
                      onChange={(e) =>
                        setNewAccount({
                          ...newAccount,
                          account_number_last4: e.target.value,
                        })
                      }
                      placeholder="1234"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Current Balance</Label>
                    <Input
                      id="balance"
                      type="number"
                      value={newAccount.current_balance}
                      onChange={(e) =>
                        setNewAccount({
                          ...newAccount,
                          current_balance: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routing">Routing Number (Optional)</Label>
                  <Input
                    id="routing"
                    value={newAccount.routing_number}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, routing_number: e.target.value })
                    }
                    placeholder="XXXXXXXXX"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addAccount}>Add Account</Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <PlaidOnboarding onSuccess={fetchAccounts} />
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {t.bankAccounts.totalBalance}
                </span>
                <span className="text-2xl font-bold">
                  ${totalBalance.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <Button 
                variant="outline" 
                onClick={syncTransactions}
                disabled={isSyncing || accounts.filter(a => a.plaid_account_id).length === 0}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? t.bankAccounts.importing : t.bankAccounts.syncAll}
              </Button>
            </div>
            
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {account.account_type === "credit" ? (
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        <p className="text-sm text-muted-foreground">
                      {account.bank_name} • ****{account.account_number_last4 || "----"}
                      {account.plaid_account_id && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          <Link className="inline h-3 w-3 mr-1" />
                          {t.bankAccounts.connected}
                        </span>
                      )}
                    </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        ${Number(account.current_balance || 0).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newBalance = prompt(t.bankAccounts.currentBalance + ":", account.current_balance);
                          if (newBalance) {
                            updateBalance(account.id, Number(newBalance));
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <BankAccountRemoval 
                        account={account} 
                        onRemovalComplete={fetchAccounts} 
                      />
                    </div>
                  </div>
                  {account.last_synced_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t.bankAccounts.lastUpdated}: {new Date(account.last_synced_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
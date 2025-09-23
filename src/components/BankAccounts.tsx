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
import { withRateLimit } from "@/utils/rateLimiter";
import { SecureStorage } from "@/utils/encryption";
import { logAuditEvent } from "@/utils/auditLogger";

export function BankAccounts() {
  const { user } = useAuth();
  const { toast } = useToast();
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
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if encryption is enabled
    const encryptionKey = SecureStorage.getKey(user?.id || '');
    
    const { data: insertedAccount, error } = await supabase.from("bank_accounts").insert({
      user_id: user?.id,
      account_name: newAccount.account_name,
      bank_name: newAccount.bank_name,
      account_type: newAccount.account_type,
      account_number_last4: newAccount.account_number_last4,
      routing_number: newAccount.routing_number,
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

  const syncTransactions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("plaid", {
        body: { action: "sync_transactions" },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!error && data) {
        toast({
          title: "Success",
          description: `Synced ${data.transactions_synced} new transactions`,
        });
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error syncing:", error);
    }
  };

  const removeConnection = async (id: string, hasPlaid: boolean) => {
    if (hasPlaid) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.functions.invoke("plaid", {
          body: { action: "remove_connection", account_id: id },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      } catch (error) {
        console.error("Error removing Plaid connection:", error);
      }
    } else {
      await deleteAccount(id);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Bank Accounts
          </CardTitle>
          <div className="flex gap-2">
            <PlaidLinkButton onSuccess={fetchAccounts} />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manually
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Bank Account</DialogTitle>
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
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No bank accounts added yet</p>
            <p className="text-sm mt-2">Add your first account to start tracking balances</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Balance
                </span>
                <span className="text-2xl font-bold">
                  ${totalBalance.toFixed(2)}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={syncTransactions}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync All Accounts
            </Button>
            
            <div className="space-y-3 mt-4">
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
                          Connected
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
                          const newBalance = prompt("Enter new balance:", account.current_balance);
                          if (newBalance) {
                            updateBalance(account.id, Number(newBalance));
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeConnection(account.id, !!account.plaid_account_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {account.last_synced_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last updated: {new Date(account.last_synced_at).toLocaleDateString()}
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
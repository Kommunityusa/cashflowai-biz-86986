import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/utils/auditLogger";

import { SecureStorage } from "@/utils/encryption";
import { TransactionSync } from "@/components/TransactionSync";
import {
  Plus,
  Download,
  Upload,
  Filter,
  Search,
  Edit,
  Trash2,
  Sparkles,
  Lock,
} from "lucide-react";

export default function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    type: "expense",
    category_id: "",
    transaction_date: new Date().toISOString().split('T')[0],
    notes: "",
  });
  const [isAICategorizing, setIsAICategorizing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchTransactions();
    }
  }, [user]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user?.id)
      .order('name');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        categories:category_id (
          name,
          color
        )
      `)
      .eq('user_id', user?.id)
      .order('transaction_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } else if (data) {
      console.log('Fetched transactions:', data);
      setTransactions(data);
    }
    setLoading(false);
  };

  const handleAICategorize = async () => {
    if (!newTransaction.description || !newTransaction.amount) {
      toast({
        title: "Missing Information",
        description: "Please enter description and amount first",
        variant: "destructive",
      });
      return;
    }

    setIsAICategorizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-categorize', {
        body: {
          description: newTransaction.description,
          amount: newTransaction.amount,
          type: newTransaction.type,
          existingCategories: categories,
        },
      });

      if (error) throw error;

      const suggestedCategory = categories.find(
        cat => cat.name === data.category && cat.type === newTransaction.type
      );

      if (suggestedCategory) {
        setNewTransaction(prev => ({
          ...prev,
          category_id: suggestedCategory.id,
        }));
        
        toast({
          title: "Category Suggested",
          description: `AI suggested: ${data.category}`,
        });
      }
    } catch (error) {
      console.error('Error categorizing:', error);
      toast({
        title: "Error",
        description: "Failed to auto-categorize",
        variant: "destructive",
      });
    } finally {
      setIsAICategorizing(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.category_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if encryption is enabled
      const encryptionKey = SecureStorage.getKey(user?.id || '');
      
      const { data: insertedTransaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          description: newTransaction.description,
          amount: Number(newTransaction.amount),
          type: newTransaction.type,
          category_id: newTransaction.category_id,
          transaction_date: newTransaction.transaction_date,
          notes: newTransaction.notes,
          status: 'completed',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // If encryption key exists, encrypt sensitive data
      if (encryptionKey && insertedTransaction) {
        try {
          await supabase.functions.invoke('encryption', {
            body: {
              action: 'encrypt_transaction',
              data: {
                transactionId: insertedTransaction.id,
                description: newTransaction.description,
                vendorName: null,
                notes: newTransaction.notes,
                key: encryptionKey
              }
            }
          });
        } catch (encryptError) {
          console.error('Encryption failed:', encryptError);
        }
      }

      // Log audit event
      await logAuditEvent({
        action: 'CREATE_TRANSACTION',
        entityType: 'transaction',
        details: {
          amount: Number(newTransaction.amount),
          type: newTransaction.type,
          category_id: newTransaction.category_id,
        }
      });

      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      setIsAddDialogOpen(false);
      setNewTransaction({
        description: "",
        amount: "",
        type: "expense",
        category_id: "",
        transaction_date: new Date().toISOString().split('T')[0],
        notes: "",
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      // Log audit event
      await logAuditEvent({
        action: 'DELETE_TRANSACTION',
        entityType: 'transaction',
        entityId: id,
      });
      
      toast({
        title: "Success",
        description: "Transaction deleted",
      });
      fetchTransactions();
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesCategory = filterCategory === "all" || transaction.category_id === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'],
      ...filteredTransactions.map(t => [
        t.transaction_date,
        t.description,
        t.categories?.name || 'Uncategorized',
        t.type,
        t.amount
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">
              Manage your income and expenses
            </p>
          </div>
        </div>

        {/* Transaction Sync Component */}
        <div className="mb-8">
          <TransactionSync onSyncComplete={fetchTransactions} />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportTransactions}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>
                    Add a new income or expense transaction to your records.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input 
                      id="description" 
                      placeholder="Enter transaction description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      placeholder="0.00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction(prev => ({
                        ...prev,
                        amount: e.target.value
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(value) => setNewTransaction(prev => ({
                        ...prev,
                        type: value,
                        category_id: "",
                      }))}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="category">Category</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAICategorize}
                        disabled={isAICategorizing}
                        className="text-primary"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        {isAICategorizing ? "Categorizing..." : "AI Categorize"}
                      </Button>
                    </div>
                    <Select
                      value={newTransaction.category_id}
                      onValueChange={(value) => setNewTransaction(prev => ({
                        ...prev,
                        category_id: value
                      }))}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(cat => cat.type === newTransaction.type)
                          .map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={newTransaction.transaction_date}
                      onChange={(e) => setNewTransaction(prev => ({
                        ...prev,
                        transaction_date: e.target.value
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input 
                      id="notes" 
                      placeholder="Additional notes"
                      value={newTransaction.notes}
                      onChange={(e) => setNewTransaction(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTransaction}>
                    Add Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No transactions found. Add your first transaction to get started!
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.notes && (
                          <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: transaction.categories?.color + '20',
                          color: transaction.categories?.color || '#888',
                        }}
                      >
                        {transaction.categories?.name || 'Uncategorized'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`capitalize ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/utils/auditLogger";
import { SecureStorage } from "@/utils/encryption";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionStats } from "@/components/transactions/TransactionStats";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { CategoryBreakdown } from "@/components/transactions/CategoryBreakdown";
import { TransactionRules } from "@/components/transactions/TransactionRules";
import { BulkOperations } from "@/components/transactions/BulkOperations";
import { AdvancedSearch, SearchFilters } from "@/components/transactions/AdvancedSearch";
import { TransactionReconciliation } from "@/components/transactions/TransactionReconciliation";
import { TransactionSync } from "@/components/TransactionSync";
import { CSVImport } from "@/components/transactions/CSVImport";
import { exportTransactionsToCSV } from "@/utils/csvExport";
import { TransactionTypeReview } from "@/components/transactions/TransactionTypeReview";
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
  FileUp,
  Check,
  X,
  RefreshCw,
  Settings,
} from "lucide-react";

export default function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilters | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState("");
  const transactionsPerPage = 50;
  
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    type: "expense",
    category_id: "",
    transaction_date: new Date().toISOString().split('T')[0],
    notes: "",
  });
  const [isAICategorizing, setIsAICategorizing] = useState(false);
  const [isBulkCategorizing, setIsBulkCategorizing] = useState(false);

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

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const handleAICategorize = async () => {
    if (!newTransaction.description) {
      toast({
        title: "Error",
        description: "Please enter a description first",
        variant: "destructive",
      });
      return;
    }

    setIsAICategorizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('ai-categorize-transactions', {
        body: {
          transactions: [{
            description: newTransaction.description,
            amount: newTransaction.amount || 0,
            type: newTransaction.type,
          }]
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.results?.[0]?.success) {
        const result = data.results[0];
        const category = categories.find(c => 
          c.name === result.category && c.type === result.type
        );
        
        if (category) {
          setNewTransaction(prev => ({
            ...prev,
            category_id: category.id,
            type: result.type,
          }));
          
          toast({
            title: "Success",
            description: `Categorized as ${result.category}`,
          });
        }
      }
    } catch (error) {
      console.error('AI categorization error:', error);
      toast({
        title: "Error",
        description: "Failed to categorize transaction",
        variant: "destructive",
      });
    }
    setIsAICategorizing(false);
  };

  const handleBulkAICategorize = async () => {
    // Process ALL transactions to improve categorization
    const transactionsToProcess = filteredTransactions;
    
    if (transactionsToProcess.length === 0) {
      toast({
        title: "Info",
        description: "No transactions found to categorize",
      });
      return;
    }

    setIsBulkCategorizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('ai-categorize-transactions', {
        body: {
          transactions: transactionsToProcess.map(t => ({
            id: t.id,
            description: t.description,
            vendor_name: t.vendor_name,
            amount: t.amount,
            transaction_date: t.transaction_date,
          }))
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const successCount = data?.results?.filter((r: any) => r.success).length || 0;
      
      toast({
        title: "Categorization Complete",
        description: `Successfully categorized ${successCount} out of ${transactionsToProcess.length} transactions`,
      });
      
      // Refresh transactions to show updated categories
      await fetchTransactions();
    } catch (error) {
      console.error('Bulk categorization error:', error);
      toast({
        title: "Error",
        description: "Failed to categorize transactions. Please try again.",
        variant: "destructive",
      });
    }
    setIsBulkCategorizing(false);
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
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

  const handleEditCategory = (transactionId: string, currentCategoryId: string) => {
    setEditingCategoryId(transactionId);
    setEditingCategory(currentCategoryId || "");
  };

  const handleSaveCategory = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          category_id: editingCategory || null,
          ai_processed_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated",
      });
      
      setEditingCategoryId(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleTypeChange = async (transactionId: string, type: 'income' | 'expense', isInternalTransfer: boolean) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          type,
          is_internal_transfer: isInternalTransfer
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction type updated",
      });

      fetchTransactions();

      await logAuditEvent({
        action: 'UPDATE_TRANSACTION',
        entityType: 'transaction',
        entityId: transactionId,
        details: {
          type,
          is_internal_transfer: isInternalTransfer
        }
      });
    } catch (error) {
      console.error('Error updating type:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction type",
        variant: "destructive",
      });
    }
  };

  const handleDateChange = async (transactionId: string, newDate: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          transaction_date: newDate
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction date updated",
      });

      fetchTransactions();

      await logAuditEvent({
        action: 'UPDATE_TRANSACTION',
        entityType: 'transaction',
        entityId: transactionId,
        details: {
          transaction_date: newDate
        }
      });
    } catch (error) {
      console.error('Error updating date:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction date",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingCategory("");
  };

  const handleEditDate = (transactionId: string, currentDate: string) => {
    setEditingDateId(transactionId);
    setEditingDate(currentDate);
  };

  const handleSaveDate = async (transactionId: string) => {
    if (editingDate) {
      await handleDateChange(transactionId, editingDate);
      setEditingDateId(null);
      setEditingDate("");
    }
  };

  const handleCancelDateEdit = () => {
    setEditingDateId(null);
    setEditingDate("");
  };

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploadingPDF(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Create FormData and send directly to edge function URL
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-bank-statement`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process PDF');
      }

      const data = await response.json();

      if (data?.transactions && data.transactions.length > 0) {
        // Auto-categorize the imported transactions
        await supabase.functions.invoke('ai-categorize-transactions', {
          body: { transactions: data.transactions },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        toast({
          title: "Success",
          description: `Imported ${data.transactions.length} transactions from PDF`,
        });
        
        fetchTransactions();
      } else {
        toast({
          title: "Warning",
          description: "No transactions found in PDF",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive",
      });
    } finally {
      setUploadingPDF(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCSV(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      // Find column indices
      const dateIdx = headers.findIndex(h => h.includes('date'));
      const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('name') || h.includes('merchant'));
      const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('price'));
      
      if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
        throw new Error('CSV must have date, description, and amount columns');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const transactions = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',').map(c => c.trim().replace(/['"]/g, ''));
        const date = columns[dateIdx];
        const description = columns[descIdx];
        const amountStr = columns[amountIdx];
        
        if (!date || !description || !amountStr) continue;
        
        const amount = Math.abs(parseFloat(amountStr.replace(/[$,]/g, '')));
        if (isNaN(amount)) continue;

        // Parse date
        let formattedDate = date;
        try {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Date parse error:', e);
          continue;
        }

        transactions.push({
          user_id: user.id,
          description,
          vendor_name: description.split(/\s+/).slice(0, 3).join(' '),
          amount,
          type: 'expense',
          transaction_date: formattedDate,
          status: 'pending',
          needs_review: true,
        });
      }

      if (transactions.length === 0) {
        throw new Error('No valid transactions found in CSV');
      }

      // Insert transactions
      const { data: inserted, error: insertError } = await supabase
        .from('transactions')
        .insert(transactions)
        .select();

      if (insertError) throw insertError;

      // Auto-categorize
      if (inserted && inserted.length > 0) {
        await supabase.functions.invoke('ai-categorize-transactions', {
          body: { transactions: inserted },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }

      toast({
        title: "Success",
        description: `Imported ${transactions.length} transactions from CSV`,
      });
      
      fetchTransactions();
    } catch (error) {
      console.error('CSV upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process CSV",
        variant: "destructive",
      });
    } finally {
      setUploadingCSV(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    }
  };

  const handleAdvancedSearch = (filters: SearchFilters) => {
    setAdvancedFilters(filters);
    setCurrentPage(1);
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Basic filters
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesCategory = filterCategory === "all" || transaction.category_id === filterCategory;
    
    // Advanced filters
    if (advancedFilters) {
      const {
        searchTerm: advSearch,
        type: advType,
        categoryId,
        dateFrom,
        dateTo,
        amountMin,
        amountMax,
        vendor,
        hasNotes,
        needsReview,
        taxDeductible,
      } = advancedFilters;
      
      if (advSearch && !transaction.description.toLowerCase().includes(advSearch.toLowerCase())) return false;
      if (advType !== 'all' && transaction.type !== advType) return false;
      if (categoryId !== 'all' && transaction.category_id !== categoryId) return false;
      if (dateFrom && new Date(transaction.transaction_date) < dateFrom) return false;
      if (dateTo && new Date(transaction.transaction_date) > dateTo) return false;
      if (amountMin && Number(transaction.amount) < Number(amountMin)) return false;
      if (amountMax && Number(transaction.amount) > Number(amountMax)) return false;
      if (vendor && (!transaction.vendor_name || !transaction.vendor_name.toLowerCase().includes(vendor.toLowerCase()))) return false;
      if (hasNotes === true && !transaction.notes) return false;
      if (needsReview === true && !transaction.needs_review) return false;
      if (taxDeductible === true && !transaction.tax_deductible) return false;
    }
    
    return matchesSearch && matchesType && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">
            Manage your income and expenses with AI-powered categorization
          </p>
        </div>

        {/* Transaction Statistics */}
        <TransactionStats transactions={filteredTransactions} />
        
        {/* Category Breakdown */}
        <CategoryBreakdown transactions={filteredTransactions} categories={categories} />

        {/* Tabs for Rules and Transactions */}
        <Tabs defaultValue="transactions" className="mt-6">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reconciliation">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reconciliation
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Settings className="mr-2 h-4 w-4" />
              Automation Rules
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reconciliation" className="mt-4">
            <TransactionReconciliation />
          </TabsContent>
          
          <TabsContent value="rules" className="mt-4">
            <TransactionRules />
          </TabsContent>
          
          <TabsContent value="transactions" className="mt-4 space-y-4">
            {/* Bulk Operations */}
            <BulkOperations
              transactions={filteredTransactions}
              categories={categories}
              onRefresh={fetchTransactions}
              selectedIds={selectedTransactionIds}
              onSelectionChange={setSelectedTransactionIds}
            />

            {/* Filters and Actions */}
            <div className="flex flex-wrap gap-4 items-center">
              <TransactionFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterType={filterType}
                setFilterType={setFilterType}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                categories={categories}
              />
              
              <AdvancedSearch
                onSearch={handleAdvancedSearch}
                categories={categories}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 my-6">
              <Button 
                onClick={handleBulkAICategorize}
                disabled={isBulkCategorizing}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isBulkCategorizing ? "Categorizing..." : "Auto Categorize All"}
              </Button>
          
          <Button 
            variant="outline" 
            onClick={() => fetchTransactions()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handlePDFUpload}
            className="hidden"
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPDF}
          >
            <FileUp className="mr-2 h-4 w-4" />
            {uploadingPDF ? "Processing..." : "Upload PDF"}
          </Button>
          
          <CSVImport onImportComplete={fetchTransactions} />
          
          <TransactionTypeReview />
          
          <Button 
            variant="outline" 
            onClick={() => exportTransactionsToCSV(transactions)}
            disabled={!transactions || transactions.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
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
                    <Label htmlFor="category">Category</Label>
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

          {/* Transactions Table */}
          <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTransactionIds.size === currentTransactions.length && currentTransactions.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTransactionIds(new Set(currentTransactions.map(t => t.id)));
                      } else {
                        setSelectedTransactionIds(new Set());
                      }
                    }}
                  />
                </TableHead>
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
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : currentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No transactions found. Add your first transaction to get started!
                  </TableCell>
                </TableRow>
              ) : (
                currentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedTransactionIds.has(transaction.id)}
                        onCheckedChange={(checked) => {
                          const newSelection = new Set(selectedTransactionIds);
                          if (checked) {
                            newSelection.add(transaction.id);
                          } else {
                            newSelection.delete(transaction.id);
                          }
                          setSelectedTransactionIds(newSelection);
                        }}
                      />
                     </TableCell>
                    <TableCell>
                      {editingDateId === transaction.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={editingDate}
                            onChange={(e) => setEditingDate(e.target.value)}
                            className="w-[160px] h-8"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleSaveDate(transaction.id)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleCancelDateEdit}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors group/date"
                          onClick={() => handleEditDate(transaction.id, transaction.transaction_date)}
                        >
                          <span>{new Date(transaction.transaction_date).toLocaleDateString()}</span>
                          <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover/date:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.vendor_name && (
                          <p className="text-sm text-muted-foreground">
                            Vendor: {transaction.vendor_name}
                          </p>
                        )}
                        {transaction.notes && (
                          <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingCategoryId === transaction.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={editingCategory}
                            onValueChange={setEditingCategory}
                          >
                            <SelectTrigger className="w-[150px] h-8">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories
                                .filter(cat => cat.type === transaction.type)
                                .map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleSaveCategory(transaction.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {transaction.category_id && transaction.categories ? (
                            <div className="flex items-center gap-2">
                              <span 
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all"
                                style={{
                                  backgroundColor: `${transaction.categories.color}15`,
                                  color: transaction.categories.color,
                                  border: `1px solid ${transaction.categories.color}30`
                                }}
                              >
                                {transaction.categories.name}
                              </span>
                              {transaction.ai_confidence_score && (
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(transaction.ai_confidence_score * 100)}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              Uncategorized
                            </span>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 hover:bg-secondary"
                            onClick={() => handleEditCategory(transaction.id, transaction.category_id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '↑ Income' : '↓ Expense'}
                        </span>
                        {transaction.tax_deductible && (
                          <span className="text-xs text-blue-600 dark:text-blue-400" title="Tax Deductible">
                            📋
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold text-lg ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {transaction.needs_review && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Review
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return <PaginationEllipsis key={page} />;
                  }
                  return null;
                })}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
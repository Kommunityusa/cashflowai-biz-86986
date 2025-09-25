import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  description: string;
  vendor_name: string | null;
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string;
  category_id: string | null;
  needs_review: boolean;
  ai_confidence_score: number | null;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

export const TransactionReconciliation = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch transactions that need review or have low confidence
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .or('needs_review.eq.true,ai_confidence_score.lt.0.7')
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (transError) throw transError;

      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (catError) throw catError;

      setTransactions((transData as any[]) || []);
      setCategories((catData as any[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions for review",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = async (transactionId: string, newType: 'income' | 'expense') => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          type: newType,
          needs_review: false,
          category_id: null // Reset category when type changes
        })
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, type: newType, needs_review: false, category_id: null }
            : t
        )
      );

      toast({
        title: "Transaction Updated",
        description: `Transaction type changed to ${newType}`,
      });
    } catch (error) {
      console.error('Error updating transaction type:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction type",
        variant: "destructive",
      });
    }
  };

  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          category_id: categoryId,
          needs_review: false,
          ai_confidence_score: 1.0 // User confirmation = 100% confidence
        })
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, category_id: categoryId, needs_review: false, ai_confidence_score: 1.0 }
            : t
        )
      );

      toast({
        title: "Category Updated",
        description: "Transaction category has been updated",
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const markAsReviewed = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          needs_review: false,
          ai_confidence_score: 1.0
        })
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== transactionId));

      toast({
        title: "Transaction Reviewed",
        description: "Transaction marked as reviewed",
      });
    } catch (error) {
      console.error('Error marking as reviewed:', error);
      toast({
        title: "Error",
        description: "Failed to mark transaction as reviewed",
        variant: "destructive",
      });
    }
  };

  const recategorizeAll = async () => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await supabase.functions.invoke('ai-categorize-transactions', {
        body: { transactions },
      });

      if (response.error) throw response.error;

      toast({
        title: "Recategorization Complete",
        description: response.data.message,
      });

      // Refresh the data
      await fetchData();
    } catch (error) {
      console.error('Error recategorizing:', error);
      toast({
        title: "Error",
        description: "Failed to recategorize transactions",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Reconciliation</CardTitle>
        <CardDescription>
          Review and correct transaction categorizations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All transactions have been reviewed! Great job keeping your books accurate.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} need review
                </AlertDescription>
              </Alert>
              <Button 
                onClick={recategorizeAll}
                disabled={processing}
                variant="outline"
              >
                {processing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Recategorize All with AI
              </Button>
            </div>

            <div className="space-y-4">
              {transactions.map((transaction) => {
                const currentCategory = categories.find(c => c.id === transaction.category_id);
                const availableCategories = transaction.type === 'income' ? incomeCategories : expenseCategories;

                return (
                  <div 
                    key={transaction.id} 
                    className="border rounded-lg p-4 space-y-3 bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{transaction.description}</span>
                          {transaction.vendor_name && (
                            <Badge variant="secondary">{transaction.vendor_name}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          ${transaction.amount.toFixed(2)}
                        </div>
                        {transaction.ai_confidence_score && transaction.ai_confidence_score < 0.7 && (
                          <Badge variant="outline" className="text-xs">
                            Low confidence: {(transaction.ai_confidence_score * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={transaction.type}
                        onValueChange={(value: 'income' | 'expense') => 
                          handleTypeChange(transaction.id, value)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <div className="flex items-center gap-2">
                            {transaction.type === 'income' ? (
                              <TrendingUp className="h-4 w-4 text-success" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-destructive" />
                            )}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-success" />
                              Income
                            </div>
                          </SelectItem>
                          <SelectItem value="expense">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-destructive" />
                              Expense
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={transaction.category_id || "uncategorized"}
                        onValueChange={(value) => 
                          value !== "uncategorized" && handleCategoryChange(transaction.id, value)
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select category">
                            {currentCategory ? (
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: currentCategory.color }}
                                />
                                {currentCategory.name}
                              </div>
                            ) : (
                              "Select category"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uncategorized" disabled>
                            Select category
                          </SelectItem>
                          {availableCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={() => markAsReviewed(transaction.id)}
                        size="sm"
                        variant="outline"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
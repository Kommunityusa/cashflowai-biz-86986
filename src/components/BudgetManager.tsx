import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, TrendingUp, AlertTriangle } from "lucide-react";

interface Budget {
  id: string;
  category_id: string | null;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  alert_threshold: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  categories?: {
    name: string;
    type: string;
    color: string;
  };
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
}

export function BudgetManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newBudget, setNewBudget] = useState({
    category_id: "",
    amount: "",
    period: "monthly" as "monthly" | "quarterly" | "yearly",
    start_date: new Date().toISOString().split('T')[0],
    alert_threshold: 80,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch budgets with categories
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select(`
          *,
          categories (
            name,
            type,
            color
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (budgetError) throw budgetError;

      // Fetch categories for dropdown
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'expense')
        .order('name');

      if (categoryError) throw categoryError;

      // Fetch transactions for budget calculations
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'expense');

      if (transactionError) throw transactionError;

      const typedBudgets = (budgetData || []).map(budget => ({
        ...budget,
        period: budget.period as 'monthly' | 'quarterly' | 'yearly'
      }));
      setBudgets(typedBudgets);
      setCategories(categoryData || []);
      setTransactions(transactionData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load budgets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateBudgetSpent = (budget: Budget) => {
    const now = new Date();
    const startDate = new Date(budget.start_date);
    let endDate = new Date();

    // Calculate end date based on period
    switch (budget.period) {
      case 'monthly':
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // Filter transactions for this budget's category and period
    const relevantTransactions = transactions.filter(t => {
      const transDate = new Date(t.transaction_date);
      return (
        (!budget.category_id || t.category_id === budget.category_id) &&
        transDate >= startDate &&
        transDate <= endDate
      );
    });

    const spent = relevantTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const percentage = (spent / budget.amount) * 100;

    return { spent, percentage };
  };

  const handleAddBudget = async () => {
    if (!newBudget.amount || Number(newBudget.amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid budget amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('budgets')
        .insert({
          user_id: user?.id,
          category_id: newBudget.category_id || null,
          amount: Number(newBudget.amount),
          period: newBudget.period,
          start_date: newBudget.start_date,
          alert_threshold: newBudget.alert_threshold,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Budget created successfully",
      });

      setIsAddDialogOpen(false);
      setNewBudget({
        category_id: "",
        amount: "",
        period: "monthly",
        start_date: new Date().toISOString().split('T')[0],
        alert_threshold: 80,
      });
      fetchData();
    } catch (error) {
      console.error('Error adding budget:', error);
      toast({
        title: "Error",
        description: "Failed to create budget",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBudget = async () => {
    if (!editingBudget) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .update({
          amount: editingBudget.amount,
          alert_threshold: editingBudget.alert_threshold,
          is_active: editingBudget.is_active,
        })
        .eq('id', editingBudget.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Budget updated successfully",
      });

      setEditingBudget(null);
      fetchData();
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Budget deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Budget Management</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>
                Set spending limits for categories to track your expenses.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Select
                  value={newBudget.category_id}
                  onValueChange={(value) => setNewBudget(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All expenses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All expenses</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Budget Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="period">Period</Label>
                <Select
                  value={newBudget.period}
                  onValueChange={(value: "monthly" | "quarterly" | "yearly") => 
                    setNewBudget(prev => ({ ...prev, period: value }))
                  }
                >
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newBudget.start_date}
                  onChange={(e) => setNewBudget(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="alert">Alert Threshold (%)</Label>
                <Input
                  id="alert"
                  type="number"
                  min="0"
                  max="100"
                  value={newBudget.alert_threshold}
                  onChange={(e) => setNewBudget(prev => ({ 
                    ...prev, 
                    alert_threshold: Number(e.target.value) 
                  }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBudget}>
                Create Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No budgets created yet. Click "Create Budget" to set spending limits.
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const { spent, percentage } = calculateBudgetSpent(budget);
              const isOverBudget = percentage > 100;
              const isNearLimit = percentage >= budget.alert_threshold && !isOverBudget;

              return (
                <div
                  key={budget.id}
                  className={`p-4 rounded-lg border ${
                    !budget.is_active ? 'opacity-50' : ''
                  } ${
                    isOverBudget ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 
                    isNearLimit ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : 
                    'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {budget.categories?.name || "All Expenses"}
                        {isOverBudget && (
                          <span className="text-red-600 text-sm flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Over budget!
                          </span>
                        )}
                        {isNearLimit && (
                          <span className="text-yellow-600 text-sm flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Near limit
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} budget
                        {!budget.is_active && " (Inactive)"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingBudget(budget)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-destructive/10"
                        onClick={() => handleDeleteBudget(budget.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Spent</span>
                      <span className="font-medium">
                        ${spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-2 ${
                        isOverBudget ? '[&>div]:bg-red-600' : 
                        isNearLimit ? '[&>div]:bg-yellow-600' : 
                        ''
                      }`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Start: {new Date(budget.start_date).toLocaleDateString()}</span>
                      <span>{percentage.toFixed(1)}% used</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      {editingBudget && (
        <Dialog open={!!editingBudget} onOpenChange={() => setEditingBudget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
              <DialogDescription>
                Update budget settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Budget Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editingBudget.amount}
                  onChange={(e) => setEditingBudget(prev => 
                    prev ? { ...prev, amount: Number(e.target.value) } : null
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-alert">Alert Threshold (%)</Label>
                <Input
                  id="edit-alert"
                  type="number"
                  min="0"
                  max="100"
                  value={editingBudget.alert_threshold}
                  onChange={(e) => setEditingBudget(prev => 
                    prev ? { ...prev, alert_threshold: Number(e.target.value) } : null
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editingBudget.is_active}
                  onChange={(e) => setEditingBudget(prev => 
                    prev ? { ...prev, is_active: e.target.checked } : null
                  )}
                  className="rounded"
                />
                <Label htmlFor="edit-active" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingBudget(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateBudget}>
                Update Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Tag, FileText, MoreHorizontal, ArrowLeftRight } from "lucide-react";

interface BulkOperationsProps {
  transactions: any[];
  categories: any[];
  onRefresh: () => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function BulkOperations({
  transactions,
  categories,
  onRefresh,
  selectedIds,
  onSelectionChange
}: BulkOperationsProps) {
  const { toast } = useToast();
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [bulkType, setBulkType] = useState<string>("");
  const [bulkIsInternalTransfer, setBulkIsInternalTransfer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(transactions.map(t => t.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectTransaction = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedIds);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    onSelectionChange(newSelection);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deleted ${selectedIds.size} transactions`,
      });
      
      onSelectionChange(new Set());
      onRefresh();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete transactions",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCategorize = async () => {
    if (selectedIds.size === 0 || !bulkCategoryId) return;
    
    setIsProcessing(true);
    try {
      const category = categories.find(c => c.id === bulkCategoryId);
      
      const { error } = await supabase
        .from('transactions')
        .update({ 
          category_id: bulkCategoryId,
          type: category?.type || 'expense'
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Categorized ${selectedIds.size} transactions`,
      });
      
      onSelectionChange(new Set());
      setBulkCategoryId("");
      onRefresh();
    } catch (error) {
      console.error('Bulk categorize error:', error);
      toast({
        title: "Error",
        description: "Failed to categorize transactions",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkChangeType = async () => {
    if (selectedIds.size === 0 || !bulkType) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          type: bulkType,
          is_internal_transfer: bulkIsInternalTransfer
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${selectedIds.size} transactions`,
      });
      
      onSelectionChange(new Set());
      setBulkType("");
      setBulkIsInternalTransfer(false);
      onRefresh();
    } catch (error) {
      console.error('Bulk type change error:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction types",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = () => {
    const selectedTransactions = transactions.filter(t => selectedIds.has(t.id));
    
    const csv = [
      ['Date', 'Description', 'Category', 'Type', 'Amount', 'Notes'],
      ...selectedTransactions.map(t => [
        t.transaction_date,
        t.description,
        t.categories?.name || 'Uncategorized',
        t.type,
        t.amount,
        t.notes || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDetectTransfers = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      toast({
        title: "Detecting transfers...",
        description: "This may take a moment",
      });

      const { data, error } = await supabase.functions.invoke('auto-reconcile', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Found ${data.transfersFound || 0} transfer pairs and ${data.duplicatesFound || 0} duplicates`,
      });

      onRefresh();
    } catch (error) {
      console.error('Detect transfers error:', error);
      toast({
        title: "Error",
        description: "Failed to detect transfers",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={selectedIds.size === transactions.length && transactions.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedIds.size > 0 
              ? `${selectedIds.size} selected` 
              : 'Select all'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDetectTransfers}
            disabled={isProcessing}
            size="sm"
            variant="outline"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Detect Transfers
          </Button>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={bulkType} onValueChange={setBulkType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Change type" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={bulkIsInternalTransfer}
                onCheckedChange={(checked) => setBulkIsInternalTransfer(checked as boolean)}
              />
              <span className="whitespace-nowrap">Internal Transfer</span>
            </label>

            <Button
              onClick={handleBulkChangeType}
              disabled={!bulkType || isProcessing}
              size="sm"
              variant="outline"
            >
              Update Type
            </Button>
            
            <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={handleBulkCategorize}
              disabled={!bulkCategoryId || isProcessing}
              size="sm"
            >
              <Tag className="mr-2 h-4 w-4" />
              Categorize
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleBulkExport}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleBulkDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Selection Checkboxes for Table */}
      {transactions.map(transaction => (
        <div key={transaction.id} className="hidden">
          <Checkbox
            id={`select-${transaction.id}`}
            checked={selectedIds.has(transaction.id)}
            onCheckedChange={(checked) => 
              handleSelectTransaction(transaction.id, checked as boolean)
            }
          />
        </div>
      ))}
    </div>
  );
}
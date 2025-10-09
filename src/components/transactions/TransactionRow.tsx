import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Check, X, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionRowProps {
  transaction: any;
  categories: any[];
  onEdit: (transaction: any) => void;
  onDelete: (id: string) => void;
  onCategoryChange: (transactionId: string, categoryId: string) => void;
  onTypeChange: (transactionId: string, type: 'income' | 'expense', isInternalTransfer: boolean) => void;
  onDateChange: (transactionId: string, newDate: string) => void;
}

export function TransactionRow({
  transaction,
  categories,
  onEdit,
  onDelete,
  onCategoryChange,
  onTypeChange,
  onDateChange,
}: TransactionRowProps) {
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(transaction.category_id || "");
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>(transaction.type);
  const [isInternalTransfer, setIsInternalTransfer] = useState(transaction.is_internal_transfer || false);
  const [selectedDate, setSelectedDate] = useState(transaction.transaction_date);

  const handleSaveCategory = () => {
    onCategoryChange(transaction.id, selectedCategory);
    setIsEditingCategory(false);
  };

  const handleSaveType = () => {
    onTypeChange(transaction.id, selectedType, isInternalTransfer);
    setIsEditingType(false);
  };

  const handleCancelEdit = () => {
    setSelectedCategory(transaction.category_id || "");
    setIsEditingCategory(false);
  };

  const handleCancelTypeEdit = () => {
    setSelectedType(transaction.type);
    setIsInternalTransfer(transaction.is_internal_transfer || false);
    setIsEditingType(false);
  };

  const handleSaveDate = () => {
    if (selectedDate && selectedDate !== transaction.transaction_date) {
      onDateChange(transaction.id, selectedDate);
    }
    setIsEditingDate(false);
  };

  const handleCancelDateEdit = () => {
    setSelectedDate(transaction.transaction_date);
    setIsEditingDate(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <TableRow className="group hover:bg-muted/50 transition-colors">
      <TableCell className="font-medium">
        {isEditingDate ? (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[160px]"
            />
            <Button size="icon" variant="ghost" onClick={handleSaveDate}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancelDateEdit}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <div 
            className="flex items-center gap-2 cursor-pointer group/date"
            onClick={() => setIsEditingDate(true)}
          >
            {transaction.type === 'income' ? (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">IN</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-xs text-red-600 font-medium">OUT</span>
              </div>
            )}
            <span className="text-muted-foreground text-sm">
              {formatDate(transaction.transaction_date)}
            </span>
            <Calendar className="h-3 w-3 text-muted-foreground opacity-0 group-hover/date:opacity-100 transition-opacity" />
          </div>
        )}
      </TableCell>
      
      <TableCell>
        <div>
          <p className="font-medium">{transaction.description}</p>
          {transaction.vendor_name && (
            <p className="text-sm text-muted-foreground">{transaction.vendor_name}</p>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        {isEditingCategory ? (
          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
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
            <Button size="icon" variant="ghost" onClick={handleSaveCategory}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <div 
            className="flex items-center gap-2 cursor-pointer group/category"
            onClick={() => setIsEditingCategory(true)}
          >
            {transaction.categories ? (
              <Badge 
                variant="outline" 
                className={cn(
                  "group-hover/category:bg-muted transition-colors",
                  transaction.type === 'income' ? 'border-green-600/50' : 'border-red-600/50'
                )}
              >
                {transaction.categories.name}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Uncategorized
              </Badge>
            )}
            <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover/category:opacity-100 transition-opacity" />
          </div>
        )}
      </TableCell>
      
      <TableCell>
        {isEditingType ? (
          <div className="flex items-center gap-2">
            <Select value={selectedType} onValueChange={(value: 'income' | 'expense') => setSelectedType(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
              <input 
                type="checkbox" 
                checked={isInternalTransfer}
                onChange={(e) => setIsInternalTransfer(e.target.checked)}
                className="rounded"
              />
              Transfer
            </label>
            <Button size="icon" variant="ghost" onClick={handleSaveType}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancelTypeEdit}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <div 
            className="flex items-center gap-2 cursor-pointer group/type"
            onClick={() => setIsEditingType(true)}
          >
            {transaction.is_internal_transfer ? (
              <Badge variant="outline" className="border-blue-600/50">
                Transfer
              </Badge>
            ) : (
              <Badge 
                variant={transaction.type === 'income' ? 'default' : 'destructive'}
                className="flex items-center gap-1 w-fit"
              >
                {transaction.type === 'income' ? (
                  <>
                    <span className="text-xs">↓</span> Income
                  </>
                ) : (
                  <>
                    <span className="text-xs">↑</span> Expense
                  </>
                )}
              </Badge>
            )}
            <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover/type:opacity-100 transition-opacity" />
          </div>
        )}
      </TableCell>
      
      <TableCell className="text-right">
        <span className={cn(
          "font-semibold flex items-center justify-end gap-1",
          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
        )}>
          {transaction.type === 'income' ? '+' : '-'}
          ${Math.abs(Number(transaction.amount)).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </span>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(transaction)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(transaction.id)}
            className="hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
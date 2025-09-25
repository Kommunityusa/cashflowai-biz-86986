import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Check, X, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionRowProps {
  transaction: any;
  categories: any[];
  onEdit: (transaction: any) => void;
  onDelete: (id: string) => void;
  onCategoryChange: (transactionId: string, categoryId: string) => void;
}

export function TransactionRow({
  transaction,
  categories,
  onEdit,
  onDelete,
  onCategoryChange,
}: TransactionRowProps) {
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(transaction.category_id || "");

  const handleSaveCategory = () => {
    onCategoryChange(transaction.id, selectedCategory);
    setIsEditingCategory(false);
  };

  const handleCancelEdit = () => {
    setSelectedCategory(transaction.category_id || "");
    setIsEditingCategory(false);
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
        <div className="flex items-center gap-2">
          {transaction.type === 'income' ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className="text-muted-foreground text-sm">
            {formatDate(transaction.transaction_date)}
          </span>
        </div>
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
        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
          {transaction.type}
        </Badge>
      </TableCell>
      
      <TableCell className="text-right">
        <span className={cn(
          "font-semibold",
          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
        )}>
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownUp, Check, X } from "lucide-react";

export const TransactionTypeReview = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch potentially misclassified transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transaction-type-review'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories:category_id (name, type)
        `)
        .or('description.ilike.%venmo%,description.ilike.%transfer%,description.ilike.%payment%')
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const flipTypeMutation = useMutation({
    mutationFn: async ({ id, currentType }: { id: string; currentType: string }) => {
      const newType = currentType === 'income' ? 'expense' : 'income';
      
      const { error } = await supabase
        .from('transactions')
        .update({ 
          type: newType,
          needs_review: false,
          category_id: null // Clear category so it can be re-categorized
        })
        .eq('id', id);

      if (error) throw error;
      return { id, newType };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-type-review'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Success",
        description: "Transaction type updated. Re-categorize to apply correct category.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  const markCorrectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .update({ needs_review: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-type-review'] });
      toast({
        title: "Success",
        description: "Transaction marked as correct",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowDownUp className="mr-2 h-4 w-4" />
          Review Transaction Types
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Transaction Types</DialogTitle>
          <DialogDescription>
            Review transactions that might be misclassified. Venmo, transfers, and payments often need manual review.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Loading transactions...</div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions to review
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Venmo/Transfer transactions:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Income</strong> = Money coming INTO your account</li>
                <li><strong>Expense</strong> = Money going OUT of your account</li>
              </ul>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Current Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.vendor_name && (
                          <p className="text-sm text-muted-foreground">
                            {transaction.vendor_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${transaction.amount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.categories ? (
                        <Badge variant="outline">{transaction.categories.name}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markCorrectMutation.mutate(transaction.id)}
                          disabled={markCorrectMutation.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Correct
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => flipTypeMutation.mutate({ 
                            id: transaction.id, 
                            currentType: transaction.type 
                          })}
                          disabled={flipTypeMutation.isPending}
                        >
                          <ArrowDownUp className="h-3 w-3 mr-1" />
                          Flip to {transaction.type === 'income' ? 'Expense' : 'Income'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

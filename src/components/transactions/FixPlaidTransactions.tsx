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
import { Loader2, WrenchIcon } from "lucide-react";

export const FixPlaidTransactions = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFix = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-transaction-types');

      if (error) throw error;

      setResults(data);
      
      toast({
        title: "Analysis Complete",
        description: data.message,
      });
    } catch (error) {
      console.error('Fix error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <WrenchIcon className="mr-2 h-4 w-4" />
          Fix Plaid Types
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fix Plaid Transaction Types</DialogTitle>
          <DialogDescription>
            Analyze and correct transaction type classifications based on Plaid's categorization.
            This will review all Plaid-imported transactions and fix any that are incorrectly classified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!results ? (
            <div className="text-center py-8">
              <Button onClick={handleFix} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <WrenchIcon className="mr-2 h-4 w-4" />
                    Analyze & Fix Transactions
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Click to scan all Plaid transactions and correct any misclassifications
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Results</h3>
                <p className="text-sm">Total Transactions: {results.total_transactions}</p>
                <p className="text-sm">Fixes Made: {results.fixes_made}</p>
              </div>

              {results.fixes && results.fixes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Fixed Transactions</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Original Type</TableHead>
                        <TableHead>Corrected Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.fixes.map((fix: any) => (
                        <TableRow key={fix.id}>
                          <TableCell className="font-medium">{fix.description}</TableCell>
                          <TableCell>
                            <Badge variant={fix.from === 'income' ? 'default' : 'destructive'}>
                              {fix.from}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={fix.to === 'income' ? 'default' : 'destructive'}>
                              {fix.to}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {results.analysis && results.analysis.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Transactions That Needed Fixing</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Was</TableHead>
                        <TableHead>Should Be</TableHead>
                        <TableHead>Plaid Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.analysis.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell>${item.amount}</TableCell>
                          <TableCell>
                            <Badge variant={item.current_type === 'income' ? 'default' : 'destructive'}>
                              {item.current_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.should_be === 'income' ? 'default' : 'destructive'}>
                              {item.should_be}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.plaid_primary}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Button onClick={() => {
                setResults(null);
                setOpen(false);
                window.location.reload();
              }}>
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, Table } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { format } from "date-fns";

export function BankAccounts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      if (file.type === "application/pdf") {
        await handlePDFUpload(file);
      } else if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        await handleCSVUpload(file);
      } else {
        toast({
          title: "Error",
          description: "Please upload a PDF or CSV file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handlePDFUpload = async (file: File) => {
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
      toast({
        title: "Success",
        description: `Imported ${data.transactions.length} transactions from PDF`,
      });
      
      // Refresh the page to show new transactions
      window.location.reload();
    } else {
      toast({
        title: "Warning",
        description: "No transactions found in PDF",
        variant: "destructive",
      });
    }
  };

  const handleCSVUpload = async (file: File) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const rows = results.data as any[];
            
            // Extract and transform transaction data
            const transactions = rows
              .filter((row: any) => {
                const dateField = row.Date || row.date || row.Transaction_Date || row['Transaction Date'];
                const amountField = row.Amount || row.amount || row.Debit || row.Credit;
                return dateField && amountField;
              })
              .map((row: any) => {
                const dateStr = row.Date || row.date || row.Transaction_Date || row['Transaction Date'];
                const description = row.Description || row.description || row.Memo || row.memo || row.Merchant || 'No description';
                const amountStr = row.Amount || row.amount || row.Debit || row.Credit || '0';
                const amount = parseFloat(String(amountStr).replace(/[^0-9.-]/g, ''));
                
                // Parse date
                let transactionDate: string;
                try {
                  const parsedDate = new Date(dateStr);
                  transactionDate = format(parsedDate, 'yyyy-MM-dd');
                } catch {
                  transactionDate = new Date().toISOString().split('T')[0];
                }
                
                // Determine type based on amount
                const type = amount >= 0 ? 'income' : 'expense';
                
                return {
                  user_id: user!.id,
                  transaction_date: transactionDate,
                  description: description.substring(0, 255),
                  amount: Math.abs(amount),
                  type,
                  status: 'completed',
                };
              })
              .filter(t => t.amount > 0 && new Date(t.transaction_date).getFullYear() === 2025);

            if (transactions.length === 0) {
              throw new Error("No valid transactions found for 2025");
            }

            // Check for duplicates
            const { data: existingTransactions } = await supabase
              .from('transactions')
              .select('transaction_date, description, amount')
              .eq('user_id', user!.id);

            const uniqueTransactions = transactions.filter(newTx => {
              return !existingTransactions?.some(existing => 
                existing.transaction_date === newTx.transaction_date &&
                existing.description === newTx.description &&
                Math.abs(Number(existing.amount) - newTx.amount) < 0.01
              );
            });

            if (uniqueTransactions.length === 0) {
              toast({
                title: "Info",
                description: "All transactions already exist in the database",
              });
              resolve([]);
              return;
            }

            // Insert transactions
            const { error } = await supabase
              .from("transactions")
              .insert(uniqueTransactions);
            
            if (error) throw error;

            toast({
              title: "Success",
              description: `Imported ${uniqueTransactions.length} new transactions from CSV`,
            });

            // Refresh the page
            window.location.reload();
            
            resolve(uniqueTransactions);
          } catch (error) {
            console.error('CSV processing error:', error);
            reject(error);
          }
        },
        error: reject,
      });
    });
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Bank Statements
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Import transactions from PDF or CSV bank statements
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-1">Upload PDF Statement</h3>
                <p className="text-sm text-muted-foreground">
                  Bank statement in PDF format
                </p>
              </div>
            </label>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors text-center">
                <Table className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-1">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground">
                  Transaction data in CSV format
                </p>
              </div>
            </label>
          </div>

          {uploading && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Processing file...</p>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-sm">CSV Format Requirements:</h4>
            <p className="text-xs text-muted-foreground">
              Your CSV should include columns: Date, Description, Amount
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, Table } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";

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
    const { data, error } = await supabase.functions.invoke("parse-bank-statement", {
      body: { file: await fileToBase64(file) },
    });

    if (error) {
      throw error;
    }

    toast({
      title: "Success",
      description: `Imported ${data?.count || 0} transactions from PDF`,
    });
  };

  const handleCSVUpload = async (file: File) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            const transactions = results.data
              .filter((row: any) => row.Date && row.Amount)
              .map((row: any) => ({
                user_id: user!.id,
                transaction_date: row.Date,
                description: row.Description || row.Memo || "No description",
                amount: parseFloat(row.Amount),
                type: parseFloat(row.Amount) >= 0 ? "income" : "expense",
                status: "cleared",
              }));

            if (transactions.length > 0) {
              const { error } = await supabase.from("transactions").insert(transactions);
              
              if (error) throw error;

              toast({
                title: "Success",
                description: `Imported ${transactions.length} transactions from CSV`,
              });
              resolve(transactions);
            } else {
              throw new Error("No valid transactions found in CSV");
            }
          } catch (error) {
            reject(error);
          }
        },
        error: reject,
      });
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
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
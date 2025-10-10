import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

interface CSVTransaction {
  "Date (UTC)"?: string;
  date?: string;
  Date?: string;
  Description?: string;
  description?: string;
  Amount?: string;
  amount?: string;
  Category?: string;
  category?: string;
  type?: string;
  Type?: string;
  "Bank Description"?: string;
  Reference?: string;
}

export const CSVImport = ({ onImportComplete }: { onImportComplete?: () => void }) => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");

          const transactions = results.data
            .map((row: CSVTransaction) => {
              // Parse date from Mercury format (MM-DD-YYYY) or standard formats
              const dateStr = row["Date (UTC)"] || row.date || row.Date || new Date().toISOString().split('T')[0];
              let parsedDate = dateStr;
              
              // Convert MM-DD-YYYY to YYYY-MM-DD
              if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
                const [month, day, year] = dateStr.split('-');
                parsedDate = `${year}-${month}-${day}`;
              }
              
              // Parse amount - Mercury format: POSITIVE = income (received), NEGATIVE = expense (sent)
              const rawAmount = parseFloat(row.Amount || row.amount || "0");
              const amount = Math.abs(rawAmount);
              
              // Determine transaction type based on Mercury's sign convention
              let type = row.type || row.Type;
              if (!type) {
                // In Mercury CSV: positive amount = money IN (income), negative = money OUT (expense)
                type = rawAmount > 0 ? "income" : "expense";
              }
              
              // Get description from Mercury columns
              const description = row.Description || row.description || 
                                row["Bank Description"] || "Imported transaction";
              
              // Enhanced internal transfer detection
              const isInternalTransfer = Boolean(
                description.toLowerCase().includes("transfer from mercury") ||
                description.toLowerCase().includes("transfer to mercury") ||
                description.toLowerCase().includes("send money transaction") ||
                description.toLowerCase().includes("transfer between accounts") ||
                description.toLowerCase().includes("internal transfer") ||
                description.toLowerCase().includes("account transfer") ||
                (row.Reference && row.Reference.toLowerCase().includes("transfer"))
              );
              
              // Get category from Mercury's Category column
              const mercuryCategory = row.Category || row.category;
              
              return {
                user_id: user.id,
                transaction_date: parsedDate,
                description,
                amount,
                type,
                status: "completed",
                is_internal_transfer: isInternalTransfer,
                vendor_name: row.Description || null,
                notes: mercuryCategory ? `Mercury Category: ${mercuryCategory}` : null
              };
            })
            // Filter to only include 2025 transactions
            .filter(tx => {
              const year = new Date(tx.transaction_date).getFullYear();
              return year === 2025;
            });

          // Check for duplicates before inserting
          const { data: existingTransactions } = await supabase
            .from("transactions")
            .select("transaction_date, description, amount")
            .eq("user_id", user.id);

          // Filter out duplicates
          const uniqueTransactions = transactions.filter(newTx => {
            return !existingTransactions?.some(existing => 
              existing.transaction_date === newTx.transaction_date &&
              existing.description === newTx.description &&
              Math.abs(Number(existing.amount) - newTx.amount) < 0.01
            );
          });

          if (uniqueTransactions.length === 0) {
            toast({
              title: "No new transactions",
              description: "All transactions in the CSV already exist.",
            });
            onImportComplete?.();
            return;
          }

          const { error } = await supabase
            .from("transactions")
            .insert(uniqueTransactions);

          if (error) throw error;

          // After import, run auto-reconcile to detect transfers between accounts
          console.log('Running auto-reconcile to detect transfers...');
          const { error: reconcileError } = await supabase.functions.invoke('auto-reconcile', {
            body: { user_id: user.id }
          });
          
          if (reconcileError) {
            console.warn('Auto-reconcile warning:', reconcileError);
            // Don't fail the import if reconcile has issues
          }

          const skippedCount = transactions.length - uniqueTransactions.length;
          
          toast({
            title: "Success",
            description: `Imported ${uniqueTransactions.length} transactions${skippedCount > 0 ? `, skipped ${skippedCount} duplicates` : ''}`,
          });

          onImportComplete?.();
        } catch (error) {
          console.error("Import error:", error);
          toast({
            title: "Error",
            description: "Failed to import transactions",
            variant: "destructive",
          });
        } finally {
          setIsImporting(false);
          event.target.value = "";
        }
      },
      error: (error) => {
        console.error("Parse error:", error);
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
        setIsImporting(false);
      }
    });
  };

  return (
    <div>
      <Input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        disabled={isImporting}
        className="hidden"
        id="csv-upload"
      />
      <label htmlFor="csv-upload">
        <Button
          variant="outline"
          disabled={isImporting}
          asChild
        >
          <span>
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? "Importing..." : "Import CSV"}
          </span>
        </Button>
      </label>
    </div>
  );
};

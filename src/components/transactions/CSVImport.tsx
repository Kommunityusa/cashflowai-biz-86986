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

          const transactions = results.data.map((row: CSVTransaction) => {
            // Parse date from Mercury format (MM-DD-YYYY) or standard formats
            const dateStr = row["Date (UTC)"] || row.date || row.Date || new Date().toISOString().split('T')[0];
            let parsedDate = dateStr;
            
            // Convert MM-DD-YYYY to YYYY-MM-DD
            if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
              const [month, day, year] = dateStr.split('-');
              parsedDate = `${year}-${month}-${day}`;
            }
            
            // Parse amount - Mercury uses negative for outgoing, positive for incoming
            const rawAmount = parseFloat(row.Amount || row.amount || "0");
            const amount = Math.abs(rawAmount);
            
            // Determine transaction type
            let type = row.type || row.Type;
            if (!type) {
              type = rawAmount < 0 ? "expense" : "income";
            }
            
            // Get description from Mercury columns
            const description = row.Description || row.description || 
                              row["Bank Description"] || "Imported transaction";
            
            // Detect internal transfers
            const isInternalTransfer = Boolean(
              description.includes("Transfer from Mercury to another bank account") ||
              description.includes("Transfer to Mercury from another bank account") ||
              description.includes("Send Money transaction initiated on Mercury") ||
              (row.Reference && row.Reference.includes("Transfer"))
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
          });

          const { error } = await supabase
            .from("transactions")
            .insert(transactions);

          if (error) throw error;

          toast({
            title: "Success",
            description: `Imported ${transactions.length} transactions`,
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

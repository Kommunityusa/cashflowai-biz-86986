import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

interface CSVTransaction {
  date: string;
  description: string;
  amount: string;
  type?: string;
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

          const transactions = results.data.map((row: any) => {
            const amount = Math.abs(parseFloat(row.amount || row.Amount || "0"));
            const type = row.type || row.Type || (parseFloat(row.amount || row.Amount || "0") < 0 ? "expense" : "income");
            
            return {
              user_id: user.id,
              transaction_date: row.date || row.Date || new Date().toISOString().split('T')[0],
              description: row.description || row.Description || "Imported transaction",
              amount,
              type,
              status: "completed"
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

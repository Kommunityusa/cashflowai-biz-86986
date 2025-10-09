import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const RestoreCategoryButton = () => {
  const [isRestoring, setIsRestoring] = useState(false);
  const { toast } = useToast();

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('restore-category');
      
      if (error) throw error;

      toast({
        title: "Category Restored",
        description: data.message || "Account Transfer category has been restored successfully.",
      });

      // Refresh the page to show the restored category
      window.location.reload();
    } catch (error) {
      console.error('Error restoring category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore category",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Button
      onClick={handleRestore}
      disabled={isRestoring}
      variant="outline"
    >
      {isRestoring ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Restoring...
        </>
      ) : (
        "Restore Account Transfer Category"
      )}
    </Button>
  );
};

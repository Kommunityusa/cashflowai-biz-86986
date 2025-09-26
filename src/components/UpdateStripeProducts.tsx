import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function UpdateStripeProducts() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      
      const { data, error } = await supabase.functions.invoke('update-stripe-products');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Stripe product names have been updated to Cash Flow AI",
      });
      
      console.log('Update results:', data);
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update product names",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card p-4 rounded-lg shadow-lg border">
      <p className="text-sm mb-2">Update Stripe Product Names</p>
      <Button 
        onClick={handleUpdate} 
        disabled={isUpdating}
        variant="gradient"
        size="sm"
      >
        {isUpdating ? "Updating..." : "Update to Cash Flow AI"}
      </Button>
    </div>
  );
}
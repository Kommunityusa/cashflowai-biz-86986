import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SecureStorage } from "@/utils/encryption";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Key, 
  Lock, 
  RefreshCw, 
  Database,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";

export function EncryptionSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasEncryptionKey, setHasEncryptionKey] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkEncryptionStatus();
  }, []);

  const checkEncryptionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const storedKey = SecureStorage.getKey(user.id);
      setHasEncryptionKey(!!storedKey);

      const response = await supabase.functions.invoke('encryption', {
        body: { action: 'get_encryption_status' }
      });

      if (response.data) {
        setEncryptionStatus(response.data);
      }
    } catch (error) {
      console.error('Error checking encryption status:', error);
    }
  };

  const generateEncryptionKey = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await supabase.functions.invoke('encryption', {
        body: { action: 'generate_key' }
      });

      if (response.data?.key) {
        SecureStorage.setKey(user.id, response.data.key);
        setHasEncryptionKey(true);
        
        toast({
          title: "Encryption Key Generated",
          description: "Your encryption key has been securely generated",
        });

        await checkEncryptionStatus();
      }
    } catch (error) {
      console.error('Error generating encryption key:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate encryption key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Data Encryption
        </CardTitle>
        <CardDescription>
          Protect your sensitive financial data with encryption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Encryption Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasEncryptionKey ? (
                <Badge variant="outline" className="bg-primary/10">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  No Key
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Protected Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Bank Accounts: {encryptionStatus?.encryptedBankAccounts || 0}/{encryptionStatus?.totalBankAccounts || 0}
                </span>
              </div>
              <div className="text-sm">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Transactions: {encryptionStatus?.encryptedTransactions || 0}/{encryptionStatus?.totalTransactions || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {!hasEncryptionKey && (
          <Button onClick={generateEncryptionKey} disabled={isLoading} className="w-full">
            <Key className="h-4 w-4 mr-2" />
            Generate Encryption Key
          </Button>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Encryption protects your sensitive data. Your key is stored securely in your browser session.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Lock, 
  Database,
  CreditCard,
  FileText,
  CheckCircle2,
  Info
} from "lucide-react";

export function EncryptionSettings() {
  const [encryptionStatus, setEncryptionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkEncryptionStatus();
  }, []);

  const checkEncryptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('auto-encrypt', {
        body: { action: 'get_encryption_status' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.data) {
        setEncryptionStatus(response.data);
      }
    } catch (error) {
      console.error('Error checking encryption status:', error);
      toast({
        title: "Error",
        description: "Failed to check encryption status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          Your sensitive financial data is automatically protected with enterprise-grade encryption
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
              <Badge variant="outline" className="bg-success/10">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Always Active
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                System-managed AES-256 encryption
              </p>
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
                  Bank Accounts: {loading ? "..." : encryptionStatus?.encryptedBankAccounts || 0}/{loading ? "..." : encryptionStatus?.totalBankAccounts || 0}
                </span>
              </div>
              <div className="text-sm">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Transactions: {loading ? "..." : encryptionStatus?.encryptedTransactions || 0}/{loading ? "..." : encryptionStatus?.totalTransactions || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Automatic Protection</p>
              <p className="text-xs text-muted-foreground">
                All sensitive data including account numbers, routing numbers, and personal information 
                is automatically encrypted when stored and decrypted only when needed for authorized access.
              </p>
            </div>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Enterprise-Grade Security:</strong> Your data is protected using AES-256 encryption, 
            the same standard used by banks and government agencies. Encryption keys are managed securely 
            by the platform and are never exposed to browsers or external services.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">What's Protected:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Bank account numbers and routing numbers
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Plaid access tokens and credentials
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Transaction descriptions and vendor information
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Personal notes and custom data
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
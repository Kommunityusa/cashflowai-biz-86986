import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SecureStorage } from "@/utils/encryption";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function EncryptionStatus() {
  const [encryptionStatus, setEncryptionStatus] = useState<any>(null);
  const [hasKey, setHasKey] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkEncryptionStatus();
  }, []);

  const checkEncryptionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const storedKey = SecureStorage.getKey(user.id);
      setHasKey(!!storedKey);

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

  const overallPercentage = encryptionStatus ? 
    Math.round(((encryptionStatus.bankAccountsPercentage || 0) + 
                (encryptionStatus.transactionsPercentage || 0)) / 2) : 0;

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Data Encryption
        </CardTitle>
        {hasKey ? (
          <Badge variant="outline" className="bg-primary/10">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Not Active
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">{overallPercentage}%</span>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <Progress value={overallPercentage} className="h-2" />
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Bank Accounts: {encryptionStatus?.encryptedBankAccounts || 0}/{encryptionStatus?.totalBankAccounts || 0}</p>
            <p>Transactions: {encryptionStatus?.encryptedTransactions || 0}/{encryptionStatus?.totalTransactions || 0}</p>
          </div>
          
          {!hasKey && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => navigate('/settings?tab=security')}
            >
              Enable Encryption
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default EncryptionStatus;
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Unlock, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { encryptData, decryptData, SecureStorage, generateEncryptionKey } from "@/utils/encryption";

export function EncryptionSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState({
    sensitive_data_encrypted: false,
    encryption_version: 1,
    last_encrypted_at: null as string | null,
  });
  const [autoEncrypt, setAutoEncrypt] = useState(true);

  useEffect(() => {
    fetchEncryptionStatus();
  }, []);

  const fetchEncryptionStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const response = await fetch(
        `https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/encryption`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'get_encryption_status',
            data: {},
          }),
        }
      );

      if (response.ok) {
        const { status } = await response.json();
        setEncryptionStatus(status);
      }
    } catch (error) {
      console.error('Error fetching encryption status:', error);
    }
  };

  const handleEncryptData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to encrypt data",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Get profile data to encrypt
      const { data: profile } = await supabase
        .from('profiles')
        .select('tax_id, phone')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.tax_id || profile?.phone) {
        const response = await fetch(
          `https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/encryption`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: 'encrypt_profile_data',
              data: {
                taxId: profile.tax_id || '',
                phone: profile.phone || '',
              },
            }),
          }
        );

        if (response.ok) {
          toast({
            title: "Success",
            description: "Your sensitive data has been encrypted",
          });
          fetchEncryptionStatus();
        } else {
          throw new Error('Failed to encrypt data');
        }
      } else {
        toast({
          title: "Info",
          description: "No sensitive data to encrypt",
        });
      }
    } catch (error) {
      console.error('Encryption error:', error);
      toast({
        title: "Error",
        description: "Failed to encrypt data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLocalKey = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const key = generateEncryptionKey();
      SecureStorage.setKey(user.id, key);
      toast({
        title: "Success",
        description: "Local encryption key generated and stored securely",
      });
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
          Manage encryption settings for sensitive financial data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Encryption Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {encryptionStatus.sensitive_data_encrypted ? (
              <Lock className="h-5 w-5 text-green-500" />
            ) : (
              <Unlock className="h-5 w-5 text-yellow-500" />
            )}
            <div>
              <p className="font-medium">
                {encryptionStatus.sensitive_data_encrypted 
                  ? "Data is Encrypted" 
                  : "Data is Not Encrypted"}
              </p>
              {encryptionStatus.last_encrypted_at && (
                <p className="text-sm text-muted-foreground">
                  Last encrypted: {new Date(encryptionStatus.last_encrypted_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={handleEncryptData}
            disabled={loading || encryptionStatus.sensitive_data_encrypted}
            variant={encryptionStatus.sensitive_data_encrypted ? "secondary" : "default"}
          >
            {loading ? "Encrypting..." : "Encrypt Now"}
          </Button>
        </div>

        {/* Auto-Encryption Setting */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-encrypt">Automatic Encryption</Label>
            <p className="text-sm text-muted-foreground">
              Automatically encrypt sensitive data when added
            </p>
          </div>
          <Switch
            id="auto-encrypt"
            checked={autoEncrypt}
            onCheckedChange={setAutoEncrypt}
          />
        </div>

        {/* Encryption Details */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>What gets encrypted:</strong>
            <ul className="mt-2 ml-4 list-disc text-sm">
              <li>Tax IDs and SSNs</li>
              <li>Bank account access tokens</li>
              <li>Sensitive transaction notes</li>
              <li>Uploaded financial documents</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Local Encryption Key */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Client-Side Encryption</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Generate a local encryption key for additional security
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateLocalKey}
          >
            Generate Local Key
          </Button>
        </div>

        {/* Encryption Status Indicator */}
        {encryptionStatus.sensitive_data_encrypted && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your sensitive data is protected with AES-256 encryption
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
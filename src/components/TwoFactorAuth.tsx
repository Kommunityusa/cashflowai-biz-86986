import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, ShieldOff, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import { logAuditEvent } from "@/utils/auditLogger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function TwoFactorAuth() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: factors } = await supabase.auth.mfa.listFactors();
      
      if (factors?.totp && factors.totp.length > 0) {
        setIs2FAEnabled(true);
        setFactorId(factors.totp[0].id);
      }
    } catch (error) {
      console.error('Error checking 2FA status');
    }
  };

  const enrollTwoFactor = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No user found");
      }

      // Enroll a new TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: user.email || 'Cash Flow AI Account'
      });

      if (error) throw error;

      if (data) {
        // Generate QR code from the URI
        const qrCodeUrl = await QRCode.toDataURL(data.totp.qr_code);
        setQrCode(qrCodeUrl);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setShowEnrollDialog(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll 2FA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || !factorId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: verificationCode
      });

      if (error) throw error;

      setIs2FAEnabled(true);
      setShowEnrollDialog(false);
      setVerificationCode("");
      
      // Log 2FA enablement
      await logAuditEvent({ action: 'ENABLE_2FA' });
      
      toast({
        title: "2FA Enabled!",
        description: "Two-factor authentication has been successfully enabled for your account."
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!factorId) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorId
      });

      if (error) throw error;

      setIs2FAEnabled(false);
      setFactorId(null);
      
      // Log 2FA disablement
      await logAuditEvent({ action: 'DISABLE_2FA' });
      
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disable 2FA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Secret key copied to clipboard"
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account using an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {is2FAEnabled ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Two-factor authentication is currently <strong>enabled</strong> for your account.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-orange-500/50 bg-orange-500/10">
              <ShieldOff className="h-4 w-4 text-orange-500" />
              <AlertDescription>
                Two-factor authentication is currently <strong>disabled</strong>. Enable it to protect your account.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to scan the QR code.
            </p>
          </div>

          {is2FAEnabled ? (
            <Button
              variant="destructive"
              onClick={disableTwoFactor}
              disabled={loading}
            >
              {loading ? "Disabling..." : "Disable 2FA"}
            </Button>
          ) : (
            <Button
              variant="gradient"
              onClick={enrollTwoFactor}
              disabled={loading}
            >
              {loading ? "Setting up..." : "Enable 2FA"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {qrCode && (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>

                <div className="w-full">
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Or enter this secret key manually:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={secret}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copySecret}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="verification-code">
                Enter the 6-digit code from your authenticator app
              </Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEnrollDialog(false);
                setVerificationCode("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={verifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? "Verifying..." : "Verify and Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

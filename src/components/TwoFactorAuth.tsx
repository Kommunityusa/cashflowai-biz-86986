import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ShieldOff } from "lucide-react";
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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [serviceSid, setServiceSid] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('two_factor_enabled')
        .eq('user_id', user.id)
        .single();

      setIs2FAEnabled(profile?.two_factor_enabled || false);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const enrollTwoFactor = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('twilio-2fa-enroll', {
        body: { phoneNumber }
      });

      if (error) throw error;

      setServiceSid(data.serviceSid);
      setVerificationSent(true);
      toast({
        title: "Success",
        description: "Verification code sent to your phone!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive"
      });
      return;
    }

    if (!serviceSid) {
      toast({
        title: "Error",
        description: "No verification service found",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('twilio-2fa-verify', {
        body: { 
          phoneNumber, 
          code: verificationCode,
          serviceSid 
        }
      });

      if (error) throw error;

      if (data.verified) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ 
              two_factor_enabled: true,
              two_factor_phone: phoneNumber 
            })
            .eq('user_id', user.id);
        }

        setIs2FAEnabled(true);
        setShowEnrollDialog(false);
        setVerificationCode("");
        setPhoneNumber("");
        setVerificationSent(false);
        toast({
          title: "Success",
          description: "Two-factor authentication enabled successfully!"
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid verification code",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ 
          two_factor_enabled: false,
          two_factor_phone: null 
        })
        .eq('user_id', user.id);

      setIs2FAEnabled(false);
      toast({
        title: "Success",
        description: "Two-factor authentication disabled"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disable two-factor authentication",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = () => {
    setShowEnrollDialog(true);
    setVerificationSent(false);
    setPhoneNumber("");
    setVerificationCode("");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using SMS verification
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
              Receive verification codes via SMS to your phone when signing in.
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
              onClick={startEnrollment}
              disabled={loading}
            >
              Enable 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your phone number to receive a verification code via SMS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!verificationSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone-number">Phone Number</Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>

                <Button
                  onClick={enrollTwoFactor}
                  disabled={loading || !phoneNumber}
                  className="w-full"
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </Button>
              </>
            ) : (
              <>
                <Alert>
                  <AlertDescription>
                    Verification code sent to {phoneNumber}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>

                <Button
                  onClick={verifyAndEnable}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify and Enable"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Lock, Info, FileText, Eye, Database } from "lucide-react";

interface PlaidConsentProps {
  onConsent: () => void;
  onDecline: () => void;
  isOpen: boolean;
}

export function PlaidConsent({ onConsent, onDecline, isOpen }: PlaidConsentProps) {
  const [consents, setConsents] = useState({
    dataSharing: false,
    dataStorage: false,
    privacyPolicy: false,
    termsOfService: false,
  });
  const [hasStoredConsent, setHasStoredConsent] = useState(false);

  useEffect(() => {
    checkStoredConsent();
  }, []);

  const checkStoredConsent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('plaid_consent_date, plaid_consent_version')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.plaid_consent_date) {
      setHasStoredConsent(true);
    }
  };

  const handleConsent = async () => {
    if (!Object.values(consents).every(v => v)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Store consent in database
    await supabase
      .from('profiles')
      .update({
        plaid_consent_date: new Date().toISOString(),
        plaid_consent_version: '1.0',
        plaid_consent_details: {
          data_sharing: true,
          data_storage: true,
          privacy_policy: true,
          terms_of_service: true,
          ip_address: window.location.hostname,
          user_agent: navigator.userAgent,
        },
      })
      .eq('user_id', user.id);

    // Log consent in audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'PLAID_CONSENT_GRANTED' as any,
      details: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        consents,
      } as any,
    });

    onConsent();
  };

  // If user already consented, don't show dialog
  if (hasStoredConsent && !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onDecline()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Bank Connection Authorization
          </DialogTitle>
          <DialogDescription>
            Please review and consent to the following terms to connect your bank account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="border-primary/20 bg-primary/5">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Your financial data is encrypted and secured using bank-level security. 
              We use Plaid, a trusted financial services provider used by thousands of apps.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data We Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>When you connect your bank account, we will access:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account balances and details</li>
                <li>Transaction history (up to 2 years)</li>
                <li>Account and routing numbers (stored encrypted)</li>
                <li>Institution information</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                How We Use Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc pl-5 space-y-1">
                <li>Categorize transactions for bookkeeping</li>
                <li>Generate financial reports and insights</li>
                <li>Track cash flow and account balances</li>
                <li>Identify tax-deductible expenses</li>
                <li>Provide AI-powered financial recommendations</li>
              </ul>
              <p className="mt-3 text-muted-foreground">
                We never sell your data or share it with third parties for marketing purposes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Data Retention & Removal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                • Transaction data is retained for 7 years for tax compliance<br/>
                • You can disconnect your bank account at any time<br/>
                • You can request complete data deletion<br/>
                • Archived data is automatically purged after retention period
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3 pt-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="data-sharing"
                checked={consents.dataSharing}
                onCheckedChange={(checked) =>
                  setConsents(prev => ({ ...prev, dataSharing: !!checked }))
                }
              />
              <label htmlFor="data-sharing" className="text-sm cursor-pointer">
                I authorize Cash Flow AI to retrieve my financial data through Plaid
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="data-storage"
                checked={consents.dataStorage}
                onCheckedChange={(checked) =>
                  setConsents(prev => ({ ...prev, dataStorage: !!checked }))
                }
              />
              <label htmlFor="data-storage" className="text-sm cursor-pointer">
                I consent to the secure storage and processing of my financial data
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy-policy"
                checked={consents.privacyPolicy}
                onCheckedChange={(checked) =>
                  setConsents(prev => ({ ...prev, privacyPolicy: !!checked }))
                }
              />
              <label htmlFor="privacy-policy" className="text-sm cursor-pointer">
                I have read and agree to the{" "}
                <a href="/privacy" target="_blank" className="underline text-primary">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={consents.termsOfService}
                onCheckedChange={(checked) =>
                  setConsents(prev => ({ ...prev, termsOfService: !!checked }))
                }
              />
              <label htmlFor="terms" className="text-sm cursor-pointer">
                I have read and agree to the{" "}
                <a href="/terms" target="_blank" className="underline text-primary">
                  Terms of Service
                </a>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDecline}>
            Cancel
          </Button>
          <Button 
            onClick={handleConsent}
            disabled={!Object.values(consents).every(v => v)}
          >
            <Shield className="mr-2 h-4 w-4" />
            Authorize Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
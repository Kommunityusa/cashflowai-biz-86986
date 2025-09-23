import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlaidSetupGuide() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <InfoIcon className="h-5 w-5" />
          Plaid Configuration Guide
        </CardTitle>
        <CardDescription>
          How to properly configure Plaid for transaction access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>OAuth Configuration (Optional)</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            <p>
              Most banks work without OAuth configuration. However, some institutions (like Chase, Wells Fargo) require OAuth.
            </p>
            <p className="font-semibold">
              If you see an OAuth error, follow these steps:
            </p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Log into your Plaid Dashboard</li>
              <li>Navigate to Team Settings → API</li>
              <li>Add this redirect URI: <code className="bg-muted px-1 py-0.5 rounded text-xs">{window.location.origin}/plaid/oauth/callback</code></li>
              <li>Save your changes</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Transaction Access Requirements</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="text-sm">
                <strong>Transactions Product:</strong> Already configured for up to 24 months of transaction history
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="text-sm">
                <strong>Webhook URL:</strong> Automatically configured for real-time updates
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="text-sm">
                <strong>Environment:</strong> Using Production environment for live bank data
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Supported Features</h3>
          <ul className="space-y-1 text-sm">
            <li>• Transaction categorization for bookkeeping</li>
            <li>• Real-time balance updates</li>
            <li>• Merchant information extraction</li>
            <li>• 90-day transaction history sync</li>
            <li>• Automatic transaction reconciliation</li>
          </ul>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://plaid.com/docs/transactions/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Transactions API Docs
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://dashboard.plaid.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Plaid Dashboard
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
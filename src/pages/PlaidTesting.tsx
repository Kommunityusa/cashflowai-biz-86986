import { Header } from "@/components/layout/Header";
import { PlaidTestingSuite } from "@/components/PlaidTestingSuite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PlaidTesting() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Plaid Integration Testing</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive testing suite for production Plaid integration
            </p>
          </div>

          {/* Production Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Production Readiness Checklist</CardTitle>
              <CardDescription>
                Verify all requirements are met before going live
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Production credentials configured</span>
                  <Badge>Complete</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Application profile completed</span>
                  <Badge>Complete</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Security questionnaire submitted</span>
                  <Badge>Complete</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Webhook endpoint configured</span>
                  <Badge>Active</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Business categorization enabled</span>
                  <Badge>Active</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Update mode implemented</span>
                  <Badge>Ready</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span>OAuth redirect testing</span>
                  <Badge variant="secondary">Test Required</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OAuth Banks Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>OAuth-Required Banks</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>The following banks require OAuth authentication:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">Chase</Badge>
                <Badge variant="outline">Wells Fargo</Badge>
                <Badge variant="outline">Bank of America</Badge>
                <Badge variant="outline">Capital One</Badge>
                <Badge variant="outline">US Bank</Badge>
                <Badge variant="outline">USAA</Badge>
                <Badge variant="outline">American Express</Badge>
                <Badge variant="outline">Charles Schwab</Badge>
              </div>
              <p className="text-sm mt-3">
                OAuth banks will redirect users to their bank's website for authentication. 
                On mobile devices, this will open the bank's app if installed.
              </p>
            </AlertDescription>
          </Alert>

          {/* Testing Suite */}
          <PlaidTestingSuite />

          {/* Testing Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-2">1. OAuth Flow Testing</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Run OAuth Tests" and try connecting with Chase or Wells Fargo. 
                    The system will handle the OAuth redirect automatically.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">2. Update Mode Testing</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect a test account first, then run update mode tests to simulate 
                    credential changes. This ensures users can fix broken connections.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">3. Webhook Testing</h3>
                  <p className="text-sm text-muted-foreground">
                    Verifies that webhooks are properly configured and can receive events 
                    from Plaid for real-time transaction updates.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">4. Sync & Categorization Testing</h3>
                  <p className="text-sm text-muted-foreground">
                    Tests the business categorization engine and reconciliation features 
                    to ensure transactions are properly categorized for bookkeeping.
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> For production testing, use real bank credentials 
                  with small test accounts. Plaid's production environment doesn't support 
                  test credentials like sandbox mode.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
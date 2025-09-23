import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlaidLink } from "react-plaid-link";

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'warning';
  message: string;
  details?: any;
}

export function PlaidTestingSuite() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [testMode, setTestMode] = useState<'oauth' | 'update' | 'webhook' | 'sync'>('oauth');
  const { toast } = useToast();

  // OAuth Test Flow
  const runOAuthTest = async () => {
    setTestResults([]);
    setIsRunning(true);

    const tests: TestResult[] = [];

    // Test 1: Create Link Token with OAuth
    tests.push({ 
      name: 'Create OAuth Link Token', 
      status: 'running', 
      message: 'Creating link token for OAuth test...' 
    });
    setTestResults([...tests]);

    try {
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('plaid', {
        body: { action: 'create_link_token' }
      });

      if (tokenError) throw tokenError;

      tests[0] = {
        ...tests[0],
        status: 'success',
        message: 'Link token created successfully',
        details: { token: tokenData.link_token?.substring(0, 20) + '...' }
      };
      setLinkToken(tokenData.link_token);
      setTestResults([...tests]);

      // Test 2: Check OAuth redirect configuration
      tests.push({
        name: 'OAuth Redirect Configuration',
        status: 'running',
        message: 'Verifying OAuth redirect URI...'
      });
      setTestResults([...tests]);

      const redirectUri = `${window.location.origin}/auth/callback`;
      const isHttps = window.location.protocol === 'https:';
      
      tests[1] = {
        ...tests[1],
        status: isHttps ? 'success' : 'warning',
        message: isHttps 
          ? `OAuth redirect configured: ${redirectUri}`
          : 'OAuth works best with HTTPS in production',
        details: { redirectUri, protocol: window.location.protocol }
      };
      setTestResults([...tests]);

      // Test 3: Mobile Detection
      tests.push({
        name: 'Mobile OAuth Support',
        status: 'running',
        message: 'Checking mobile OAuth support...'
      });
      setTestResults([...tests]);

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      tests[2] = {
        ...tests[2],
        status: 'success',
        message: isMobile 
          ? 'Mobile device detected - OAuth redirect will be handled'
          : 'Desktop detected - OAuth will use popup',
        details: { isMobile, userAgent: navigator.userAgent }
      };
      setTestResults([...tests]);

    } catch (error: any) {
      tests[tests.length - 1] = {
        ...tests[tests.length - 1],
        status: 'failed',
        message: `Error: ${error.message}`,
        details: error
      };
      setTestResults([...tests]);
    }

    setIsRunning(false);
  };

  // Update Mode Test
  const runUpdateModeTest = async () => {
    setTestResults([]);
    setIsRunning(true);

    const tests: TestResult[] = [];

    // Test 1: Get existing accounts
    tests.push({
      name: 'Fetch Connected Accounts',
      status: 'running',
      message: 'Getting connected bank accounts...'
    });
    setTestResults([...tests]);

    try {
      const { data: accounts, error: accountsError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .not('plaid_item_id', 'is', null);

      if (accountsError) throw accountsError;

      tests[0] = {
        ...tests[0],
        status: accounts.length > 0 ? 'success' : 'warning',
        message: accounts.length > 0 
          ? `Found ${accounts.length} connected account(s)`
          : 'No connected accounts found for update mode test',
        details: { accountCount: accounts.length }
      };
      setTestResults([...tests]);

      if (accounts.length > 0) {
        // Test 2: Create update token
        tests.push({
          name: 'Create Update Token',
          status: 'running',
          message: 'Creating update mode token...'
        });
        setTestResults([...tests]);

        const { data: updateData, error: updateError } = await supabase.functions.invoke('plaid-update', {
          body: {
            action: 'create_update_token',
            itemId: accounts[0].plaid_item_id
          }
        });

        if (updateError) throw updateError;

        tests[1] = {
          ...tests[1],
          status: 'success',
          message: 'Update token created successfully',
          details: { 
            bankName: updateData.bank_name,
            tokenPreview: updateData.link_token?.substring(0, 20) + '...'
          }
        };
        setTestResults([...tests]);
      }

    } catch (error: any) {
      tests[tests.length - 1] = {
        ...tests[tests.length - 1],
        status: 'failed',
        message: `Error: ${error.message}`,
        details: error
      };
      setTestResults([...tests]);
    }

    setIsRunning(false);
  };

  // Webhook Test
  const runWebhookTest = async () => {
    setTestResults([]);
    setIsRunning(true);

    const tests: TestResult[] = [];

    // Test 1: Verify webhook endpoint
    tests.push({
      name: 'Webhook Endpoint',
      status: 'running',
      message: 'Verifying webhook endpoint...'
    });
    setTestResults([...tests]);

    const webhookUrl = `https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/plaid-webhook`;

    try {
      // Test webhook is accessible
      const response = await fetch(webhookUrl, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      tests[0] = {
        ...tests[0],
        status: response.ok ? 'success' : 'warning',
        message: response.ok 
          ? 'Webhook endpoint is accessible'
          : 'Webhook endpoint returned non-200 status',
        details: { 
          webhookUrl,
          status: response.status,
          corsEnabled: response.headers.has('access-control-allow-origin')
        }
      };
      setTestResults([...tests]);

      // Test 2: Simulate webhook event
      tests.push({
        name: 'Webhook Processing',
        status: 'running',
        message: 'Testing webhook processing...'
      });
      setTestResults([...tests]);

      const { data: simulateData, error: simulateError } = await supabase.functions.invoke('plaid-webhook', {
        body: {
          webhook_type: 'ITEM',
          webhook_code: 'WEBHOOK_UPDATE_ACKNOWLEDGED',
          item_id: 'test_item_id',
          environment: 'production'
        }
      });

      tests[1] = {
        ...tests[1],
        status: simulateError ? 'failed' : 'success',
        message: simulateError 
          ? `Webhook processing failed: ${simulateError.message}`
          : 'Webhook processing successful',
        details: simulateData || simulateError
      };
      setTestResults([...tests]);

    } catch (error: any) {
      tests[tests.length - 1] = {
        ...tests[tests.length - 1],
        status: 'failed',
        message: `Error: ${error.message}`,
        details: error
      };
      setTestResults([...tests]);
    }

    setIsRunning(false);
  };

  // Transaction Sync Test
  const runSyncTest = async () => {
    setTestResults([]);
    setIsRunning(true);

    const tests: TestResult[] = [];

    // Test 1: Check sync function
    tests.push({
      name: 'Transaction Sync Function',
      status: 'running',
      message: 'Testing transaction sync...'
    });
    setTestResults([...tests]);

    try {
      const { data: syncData, error: syncError } = await supabase.functions.invoke('plaid-sync', {
        body: { test: true }
      });

      tests[0] = {
        ...tests[0],
        status: syncError ? 'warning' : 'success',
        message: syncError 
          ? 'Sync function needs active accounts'
          : 'Sync function operational',
        details: syncData || syncError
      };
      setTestResults([...tests]);

      // Test 2: Check categorization
      tests.push({
        name: 'Business Categorization',
        status: 'running',
        message: 'Testing categorization engine...'
      });
      setTestResults([...tests]);

      const { data: catData, error: catError } = await supabase.functions.invoke('plaid-categorize', {
        body: {
          transaction: {
            transaction_id: 'test_123',
            name: 'Office Depot Purchase',
            amount: 125.50,
            category: ['SHOPS', 'OFFICE_SUPPLIES'],
            merchant_name: 'Office Depot'
          }
        }
      });

      tests[1] = {
        ...tests[1],
        status: catError ? 'failed' : 'success',
        message: catError 
          ? `Categorization failed: ${catError.message}`
          : `Categorized as: ${catData?.categoryName || 'Unknown'}`,
        details: {
          taxDeductible: catData?.isTaxDeductible,
          vendor: catData?.vendorName,
          category: catData?.categoryName
        }
      };
      setTestResults([...tests]);

      // Test 3: Check reconciliation
      tests.push({
        name: 'Reconciliation Engine',
        status: 'running',
        message: 'Testing reconciliation function...'
      });
      setTestResults([...tests]);

      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (accounts) {
        const { data: reconData, error: reconError } = await supabase.functions.invoke('plaid-reconcile', {
          body: {
            accountId: accounts.id,
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
          }
        });

        tests[2] = {
          ...tests[2],
          status: reconError ? 'failed' : 'success',
          message: reconError 
            ? `Reconciliation failed: ${reconError.message}`
            : 'Reconciliation engine operational',
          details: reconData?.reconciliation || reconError
        };
      } else {
        tests[2] = {
          ...tests[2],
          status: 'warning',
          message: 'No accounts available for reconciliation test',
          details: null
        };
      }
      setTestResults([...tests]);

    } catch (error: any) {
      tests[tests.length - 1] = {
        ...tests[tests.length - 1],
        status: 'failed',
        message: `Error: ${error.message}`,
        details: error
      };
      setTestResults([...tests]);
    }

    setIsRunning(false);
  };

  // Plaid Link configuration for OAuth test
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      toast({
        title: "OAuth Test Successful",
        description: `Connected to ${metadata.institution?.name}`,
      });
      
      // Add test result
      setTestResults(prev => [...prev, {
        name: 'OAuth Connection',
        status: 'success',
        message: `Successfully connected to ${metadata.institution?.name}`,
        details: metadata
      }]);
    },
    onExit: (err, metadata) => {
      if (err) {
        setTestResults(prev => [...prev, {
          name: 'OAuth Connection',
          status: 'failed',
          message: `Connection failed: ${err.error_message}`,
          details: err
        }]);
      }
    },
  });

  useEffect(() => {
    if (linkToken && ready && testMode === 'oauth') {
      open();
    }
  }, [linkToken, ready, open, testMode]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plaid Integration Testing Suite</CardTitle>
        <CardDescription>
          Test OAuth, webhooks, update mode, and transaction sync
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={testMode} onValueChange={(v: any) => setTestMode(v)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="oauth">OAuth</TabsTrigger>
            <TabsTrigger value="update">Update Mode</TabsTrigger>
            <TabsTrigger value="webhook">Webhooks</TabsTrigger>
            <TabsTrigger value="sync">Sync & Categorization</TabsTrigger>
          </TabsList>

          <TabsContent value="oauth" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tests OAuth flow with banks like Chase and Wells Fargo that require OAuth authentication.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={runOAuthTest} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running OAuth Tests...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run OAuth Tests
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="update" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tests update mode for fixing broken connections when credentials change.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={runUpdateModeTest} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Update Mode Tests...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Update Mode Tests
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="webhook" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tests webhook endpoint accessibility and event processing.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={runWebhookTest} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Webhook Tests...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Webhook Tests
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tests transaction sync, business categorization, and reconciliation.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={runSyncTest} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Sync Tests...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Sync Tests
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold">Test Results:</h3>
            {testResults.map((test, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <p className="font-medium">{test.name}</p>
                  <p className="text-sm text-muted-foreground">{test.message}</p>
                  {test.details && (
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  )}
                </div>
                <Badge variant={
                  test.status === 'success' ? 'default' :
                  test.status === 'failed' ? 'destructive' :
                  test.status === 'warning' ? 'secondary' : 'outline'
                }>
                  {test.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
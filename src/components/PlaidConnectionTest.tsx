import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlaidStatus {
  environment?: string;
  isConfigured: boolean;
  hasCredentials: boolean;
  connectionStatus: 'checking' | 'connected' | 'error' | 'not-configured';
  errorMessage?: string;
  lastChecked?: string;
}

export function PlaidConnectionTest() {
  const { toast } = useToast();
  const [status, setStatus] = useState<PlaidStatus>({
    isConfigured: false,
    hasCredentials: false,
    connectionStatus: 'checking'
  });
  const [isLoading, setIsLoading] = useState(false);

  const checkPlaidStatus = async () => {
    setIsLoading(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setStatus({
          isConfigured: false,
          hasCredentials: false,
          connectionStatus: 'error',
          errorMessage: 'No active session. Please log in to test Plaid connection.'
        });
        return;
      }

      // Test Plaid configuration by attempting to create a link token
      const { data, error } = await supabase.functions.invoke("plaid", {
        body: {
          action: "create_link_token"
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('[Plaid Test] Error:', error);
        
        // Check if it's a configuration error
        if (error.message?.includes('PLAID_CLIENT_ID') || error.message?.includes('PLAID_SECRET')) {
          setStatus({
            isConfigured: false,
            hasCredentials: false,
            connectionStatus: 'not-configured',
            errorMessage: 'Plaid credentials are not configured. Please add PLAID_CLIENT_ID and PLAID_SECRET to your Supabase secrets.',
            lastChecked: new Date().toISOString()
          });
        } else {
          setStatus({
            isConfigured: true,
            hasCredentials: true,
            connectionStatus: 'error',
            errorMessage: error.message || 'Failed to connect to Plaid',
            lastChecked: new Date().toISOString()
          });
        }
        
        toast({
          title: "Plaid Connection Issue",
          description: error.message || "Failed to verify Plaid connection",
          variant: "destructive",
        });
      } else if (data?.link_token) {
        // Successfully created a link token
        setStatus({
          isConfigured: true,
          hasCredentials: true,
          connectionStatus: 'connected',
          environment: data.environment || 'unknown',
          lastChecked: new Date().toISOString()
        });
        
        toast({
          title: "Plaid Connected",
          description: `Successfully connected to Plaid ${data.environment || 'environment'}`,
        });
      } else {
        setStatus({
          isConfigured: false,
          hasCredentials: false,
          connectionStatus: 'error',
          errorMessage: 'No link token received from Plaid',
          lastChecked: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error('[Plaid Test] Unexpected error:', err);
      setStatus({
        isConfigured: false,
        hasCredentials: false,
        connectionStatus: 'error',
        errorMessage: err.message || 'Unexpected error occurred',
        lastChecked: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkPlaidStatus();
  }, []);

  const getStatusColor = () => {
    switch (status.connectionStatus) {
      case 'connected':
        return 'text-success';
      case 'error':
        return 'text-destructive';
      case 'not-configured':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    switch (status.connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'not-configured':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <RefreshCw className="h-5 w-5 animate-spin" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Plaid Connection Status
        </CardTitle>
        <CardDescription>
          Verify your Plaid integration is properly configured and working
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">Connection Status</p>
              <p className={`text-sm ${getStatusColor()}`}>
                {status.connectionStatus === 'checking' && 'Checking connection...'}
                {status.connectionStatus === 'connected' && 'Connected and working'}
                {status.connectionStatus === 'error' && 'Connection error'}
                {status.connectionStatus === 'not-configured' && 'Not configured'}
              </p>
            </div>
          </div>
          <Badge variant={status.connectionStatus === 'connected' ? 'default' : 'secondary'}>
            {status.connectionStatus === 'connected' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Environment Info */}
        {status.environment && (
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Environment</p>
            <p className="font-medium capitalize">{status.environment}</p>
          </div>
        )}

        {/* Error Message */}
        {status.errorMessage && (
          <Alert variant={status.connectionStatus === 'not-configured' ? 'default' : 'destructive'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {status.errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Steps for Not Configured */}
        {status.connectionStatus === 'not-configured' && (
          <div className="space-y-3">
            <h4 className="font-medium">Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Sign up for a Plaid account at <a href="https://dashboard.plaid.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dashboard.plaid.com</a></li>
              <li>Get your Client ID and Secret from the Plaid Dashboard</li>
              <li>Add these as Supabase secrets:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">PLAID_CLIENT_ID</code></li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">PLAID_SECRET</code></li>
                  <li><code className="text-xs bg-muted px-1 py-0.5 rounded">PLAID_ENV</code> (sandbox/development/production)</li>
                </ul>
              </li>
              <li>Restart your edge functions after adding secrets</li>
            </ol>
          </div>
        )}

        {/* Last Checked */}
        {status.lastChecked && (
          <p className="text-xs text-muted-foreground">
            Last checked: {new Date(status.lastChecked).toLocaleString()}
          </p>
        )}

        {/* Test Button */}
        <Button 
          onClick={checkPlaidStatus} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Plaid Connection
            </>
          )}
        </Button>

        {/* Additional Info */}
        {status.connectionStatus === 'connected' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your Plaid integration is properly configured. You can now connect bank accounts and sync transactions.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
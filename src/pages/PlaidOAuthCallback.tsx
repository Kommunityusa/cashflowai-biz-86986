import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PlaidOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Get OAuth parameters from URL
      const publicToken = searchParams.get('public_token');
      const accountId = searchParams.get('account_id');
      const linkSessionId = searchParams.get('link_session_id');
      const institutionId = searchParams.get('institution_id');
      const institutionName = searchParams.get('institution_name');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth errors
      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'OAuth authentication failed');
        
        toast({
          title: "Connection Failed",
          description: errorDescription || error,
          variant: "destructive",
        });

        // Log the error
        await supabase.from('audit_logs').insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'PLAID_OAUTH_ERROR',
          entity_type: 'oauth',
          details: { error, errorDescription, institutionId }
        });

        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      // Handle successful OAuth
      if (publicToken) {
        setMessage('Exchanging tokens and setting up your account...');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated");
        }

        // Exchange public token
        const { data, error: exchangeError } = await supabase.functions.invoke("plaid", {
          body: {
            action: "exchange_public_token",
            public_token: publicToken,
            metadata: {
              institution: {
                institution_id: institutionId,
                name: institutionName
              },
              link_session_id: linkSessionId,
              accounts: accountId ? [{ id: accountId }] : []
            }
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (exchangeError) throw exchangeError;

        setStatus('success');
        setMessage(`Successfully connected to ${institutionName || 'your bank'}`);

        toast({
          title: "Success",
          description: `Connected to ${institutionName || 'your bank'} successfully`,
        });

        // Sync transactions
        await supabase.functions.invoke("plaid", {
          body: { action: "sync_transactions" },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        // Redirect to dashboard
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        // Handle Plaid Link continuation
        setMessage('Continuing authentication process...');
        
        // Store OAuth state for Link continuation
        sessionStorage.setItem('plaid_oauth_state', JSON.stringify({
          linkSessionId,
          institutionId,
          institutionName,
          timestamp: Date.now()
        }));

        // Redirect to dashboard to continue Link flow
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to complete authentication');
      
      toast({
        title: "Error",
        description: error.message || 'Failed to complete authentication',
        variant: "destructive",
      });

      setTimeout(() => navigate('/dashboard'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Bank Connection</CardTitle>
          <CardDescription>
            Completing your bank authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            {status === 'processing' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-center font-medium">{message}</p>
                <p className="text-center text-sm text-muted-foreground">
                  Redirecting to dashboard...
                </p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-red-500" />
                <p className="text-center font-medium">Connection Failed</p>
                <p className="text-center text-sm text-muted-foreground">{message}</p>
                <p className="text-center text-xs text-muted-foreground">
                  Redirecting to dashboard...
                </p>
              </>
            )}
          </div>

          {status === 'processing' && (
            <Alert>
              <AlertDescription>
                Please wait while we securely connect to your bank account. This may take a few moments.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
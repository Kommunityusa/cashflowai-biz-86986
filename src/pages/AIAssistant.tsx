import React from 'react';
import { Header } from "@/components/layout/Header";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, ArrowLeft, Sparkles, MessageSquare, TrendingUp, Shield } from 'lucide-react';
import AIChat from '@/components/AIChat';

const AIAssistant = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Bookkeeping Assistant</h1>
              <p className="text-muted-foreground">Your expert partner for bookkeeping and financial management</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AIChat />
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Capabilities
                </CardTitle>
                <CardDescription>
                  How I can help you today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Transaction Management</p>
                    <p className="text-sm text-muted-foreground">
                      Record, categorize, and reconcile transactions
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Financial Statements</p>
                    <p className="text-sm text-muted-foreground">
                      Understand P&L, balance sheets, and cash flow
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Tax & Compliance</p>
                    <p className="text-sm text-muted-foreground">
                      Tax prep guidance and record keeping standards
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  • Ask about chart of accounts setup
                </p>
                <p className="text-sm text-muted-foreground">
                  • Get help with bank reconciliation
                </p>
                <p className="text-sm text-muted-foreground">
                  • Learn double-entry bookkeeping
                </p>
                <p className="text-sm text-muted-foreground">
                  • Understand financial ratios and KPIs
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm">Privacy Notice</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Your conversations are private and secure. The AI assistant doesn't have access to your actual financial data unless you explicitly share it in the chat.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
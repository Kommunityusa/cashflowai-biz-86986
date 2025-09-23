import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { 
  Shield, 
  TrendingUp, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Lock,
  Building,
  Clock,
  CreditCard,
  DollarSign,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/utils/auditLogger";

interface PlaidOnboardingProps {
  onSuccess?: () => void;
  showBenefits?: boolean;
  variant?: 'default' | 'compact';
}

export function PlaidOnboarding({ onSuccess, showBenefits = true, variant = 'default' }: PlaidOnboardingProps) {
  const { toast } = useToast();
  const [hasViewedBenefits, setHasViewedBenefits] = useState(false);

  const benefits = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Automatic Transaction Import",
      description: "Save hours by automatically importing all your transactions"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Real-time Balance Updates",
      description: "Always know your current cash position across all accounts"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Bank-Level Security",
      description: "Your credentials are never stored and all data is encrypted"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Instant Categorization",
      description: "AI automatically categorizes transactions for accurate reporting"
    }
  ];

  const supportedBanks = [
    "Chase", "Bank of America", "Wells Fargo", "Citibank", 
    "Capital One", "US Bank", "PNC", "TD Bank", "and 12,000+ more"
  ];

  const handleBenefitView = () => {
    if (!hasViewedBenefits) {
      setHasViewedBenefits(true);
      // Log conversion funnel event
      logAuditEvent({
        action: 'PLAID_BENEFITS_VIEWED',
        details: { timestamp: new Date().toISOString() }
      });
    }
  };

  const handleLinkStart = () => {
    // Log conversion funnel event
    logAuditEvent({
      action: 'PLAID_LINK_INITIATED',
      details: { 
        variant,
        benefitsViewed: hasViewedBenefits,
        timestamp: new Date().toISOString() 
      }
    });
  };

  const handleLinkSuccess = () => {
    // Log successful conversion
    logAuditEvent({
      action: 'PLAID_LINK_SUCCESS',
      details: { 
        variant,
        timestamp: new Date().toISOString() 
      }
    });
    
    toast({
      title: "🎉 Bank Connected Successfully!",
      description: "Your transactions will start syncing automatically",
    });
    
    if (onSuccess) onSuccess();
    
    // Schedule follow-up reminder for additional accounts
    setTimeout(() => {
      toast({
        title: "💡 Pro Tip",
        description: "Connect all your business accounts for complete financial visibility",
        action: (
          <Button size="sm" variant="outline" onClick={handleLinkStart}>
            Add Another
          </Button>
        ),
      });
    }, 30000); // Show after 30 seconds
  };

  if (variant === 'compact') {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Connect Your Bank Account
              </h3>
              <p className="text-sm text-muted-foreground">
                Securely import transactions in seconds
              </p>
            </div>
            <PlaidLinkButton 
              onSuccess={handleLinkSuccess}
              onStart={handleLinkStart}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 shadow-glow">
      <CardHeader className="text-center pb-4">
        <Badge className="mx-auto mb-4 px-4 py-1" variant="secondary">
          <Lock className="h-3 w-3 mr-1" />
          Bank-Level Encryption
        </Badge>
        <CardTitle className="text-2xl">
          Connect Your Bank Account
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Join 10,000+ businesses saving 10 hours per week on bookkeeping
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6" onMouseEnter={handleBenefitView}>
        {showBenefits && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-3">
                  <div className="text-primary mt-1">{benefit.icon}</div>
                  <div>
                    <p className="font-medium text-sm">{benefit.title}</p>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Alert className="border-primary/20 bg-primary/5">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>How it works:</strong> Plaid securely connects to your bank using read-only access. 
                Your login credentials are never stored on our servers.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-sm font-medium text-center">Supported Banks</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {supportedBanks.map((bank, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {bank}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="space-y-3">
          <PlaidLinkButton 
            onSuccess={handleLinkSuccess}
            onStart={handleLinkStart}
            size="lg"
            className="w-full"
          />
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-green-500" />
            No credit card required
            <span className="mx-1">•</span>
            <CheckCircle className="h-3 w-3 text-green-500" />
            Cancel anytime
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-center text-muted-foreground">
            By connecting your account, you agree to our{" "}
            <a href="/terms" className="underline">Terms of Service</a> and{" "}
            <a href="/privacy" className="underline">Privacy Policy</a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, CreditCard, Calendar, Shield } from "lucide-react";

interface SubscriptionSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  isLoading: boolean;
  plan?: string;
}

export function TrialSignupModal({ isOpen, onClose, onSubmit, isLoading, plan = "Professional" }: SubscriptionSignupModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  // Get price based on plan (case-insensitive)
  const getPlanDetails = () => {
    const planLower = plan.toLowerCase();
    switch(planLower) {
      case "starter":
        return { price: "$10" };
      case "professional":
        return { price: "$10" };
      case "business":
        return { price: "$25" };
      default:
        return { price: "$10" };
    }
  };

  const { price } = getPlanDetails();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    onSubmit(email);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Subscribe to {plan}</DialogTitle>
          <DialogDescription className="text-base">
            Get instant access to all features.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Instant access</p>
                <p className="text-muted-foreground">Start using all {plan} features immediately</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Credit card required</p>
                <p className="text-muted-foreground">Billing starts immediately</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">{price}/month subscription</p>
                <p className="text-muted-foreground">Cancel anytime, no questions asked</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Secure checkout</p>
                <p className="text-muted-foreground">Powered by Stripe</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full"
            />
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isLoading}>
              {isLoading ? "Processing..." : "Continue to Checkout"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
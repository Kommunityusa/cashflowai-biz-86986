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

interface TrialSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  isLoading: boolean;
  plan?: string;
}

export function TrialSignupModal({ isOpen, onClose, onSubmit, isLoading, plan = "Professional" }: TrialSignupModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  // Get trial days and price based on plan
  const getPlanDetails = () => {
    switch(plan) {
      case "Starter":
        return { days: 7, price: "$19" };
      case "Professional":
        return { days: 14, price: "$49" };
      case "Business":
        return { days: 30, price: "$99" };
      default:
        return { days: 14, price: "$49" };
    }
  };

  const { days, price } = getPlanDetails();

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
          <DialogTitle className="text-2xl">Start Your {days}-Day Free Trial</DialogTitle>
          <DialogDescription className="text-base">
            No commitment. Cancel anytime during your trial.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Full access for {days} days</p>
                <p className="text-muted-foreground">Try all {plan} features risk-free</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Credit card required</p>
                <p className="text-muted-foreground">Auto-bills after trial unless canceled</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">{price}/month after trial</p>
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
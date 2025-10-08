import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calculator, DollarSign, Calendar, Percent, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoanCalculatorProps {
  showAsPopup?: boolean;
  onClose?: () => void;
}

export function LoanCalculator({ showAsPopup = false, onClose }: LoanCalculatorProps) {
  const { toast } = useToast();
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState("");
  const [calculatorUnlocked, setCalculatorUnlocked] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);
  
  // Calculator state
  const [loanAmount, setLoanAmount] = useState(50000);
  const [interestRate, setInterestRate] = useState(7.5);
  const [loanTerm, setLoanTerm] = useState(5);
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);
  const [totalInterest, setTotalInterest] = useState<number | null>(null);
  const [totalPayment, setTotalPayment] = useState<number | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      // If authenticated, unlock calculator immediately
      if (session) {
        setCalculatorUnlocked(true);
        calculateLoan();
      }
    };
    
    checkAuth();
    
    // Check localStorage for previous email submission
    const hasSubmittedEmail = localStorage.getItem('loan_calculator_email_submitted');
    const popupShowCount = parseInt(localStorage.getItem('loan_calculator_popup_count') || '0');
    
    if (hasSubmittedEmail) {
      setCalculatorUnlocked(true);
      calculateLoan();
    }
    
    // Handle popup logic
    if (showAsPopup && !hasSubmittedEmail && !isAuthenticated) {
      // Show popup on initial load after 3 seconds
      if (popupShowCount === 0) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          setHasSeenPopup(true);
          localStorage.setItem('loan_calculator_popup_count', '1');
        }, 3000);
        
        return () => clearTimeout(timer);
      }
      
      // Set up exit intent detection for second show
      if (popupShowCount === 1) {
        const handleExitIntent = (e: MouseEvent) => {
          if (e.clientY <= 0 && !hasSeenPopup) {
            setIsOpen(true);
            setHasSeenPopup(true);
            localStorage.setItem('loan_calculator_popup_count', '2');
          }
        };
        
        document.addEventListener('mouseleave', handleExitIntent);
        
        return () => {
          document.removeEventListener('mouseleave', handleExitIntent);
        };
      }
    }
  }, [showAsPopup, isAuthenticated, hasSeenPopup]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Store email submission in localStorage
    localStorage.setItem('loan_calculator_email_submitted', 'true');
    localStorage.setItem('loan_calculator_email', email);
    
    // Here you would typically save the email to your database
    // For now, we'll just unlock the calculator
    setCalculatorUnlocked(true);
    setShowEmailCapture(false);
    setIsOpen(false);
    calculateLoan();
    
    toast({
      title: "Calculator Unlocked!",
      description: "You now have full access to the business loan calculator",
    });
    
    if (onClose) {
      onClose();
    }
  };

  const calculateLoan = () => {
    const principal = loanAmount;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // Calculate monthly payment using the formula
    const monthlyPaymentCalc = 
      principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    const totalPaymentCalc = monthlyPaymentCalc * numberOfPayments;
    const totalInterestCalc = totalPaymentCalc - principal;
    
    setMonthlyPayment(monthlyPaymentCalc);
    setTotalPayment(totalPaymentCalc);
    setTotalInterest(totalInterestCalc);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleClosePopup = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // If showing as popup, return the dialog version
  if (showAsPopup) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClosePopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unlock Free Loan Calculator</DialogTitle>
            <DialogDescription>
              Enter your email to get instant access to our business loan calculator and receive 
              financial tips for growing your business.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="gradient" className="w-full">
              Unlock Calculator
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Regular section display
  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Free Business{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Loan Calculator
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Calculate your monthly payments and total interest for business loans. 
              Get instant results to make informed financial decisions.
            </p>
          </div>

          <Card className="p-8 bg-card border-border">
            {!calculatorUnlocked ? (
              <div className="relative">
                <div className="blur-sm pointer-events-none">
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div>
                      <Label>Loan Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          value={loanAmount}
                          className="pl-10"
                          disabled
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Interest Rate (%)</Label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          value={interestRate}
                          className="pl-10"
                          disabled
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Loan Term (Years)</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          value={loanTerm}
                          className="pl-10"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Show inline email capture if not authenticated and hasn't submitted email */}
                {!isAuthenticated && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                    <div className="p-6 max-w-sm w-full">
                      <h3 className="text-lg font-semibold mb-2">Unlock Calculator</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Enter your email to access the free calculator
                      </p>
                      <form onSubmit={handleEmailSubmit} className="space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                        <Button type="submit" variant="gradient" className="w-full">
                          Unlock Now
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div>
                    <Label htmlFor="loanAmount">Loan Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="loanAmount"
                        type="number" 
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        onBlur={calculateLoan}
                        className="pl-10"
                        min="1000"
                        max="10000000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="interestRate">Interest Rate (%)</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="interestRate"
                        type="number" 
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        onBlur={calculateLoan}
                        className="pl-10"
                        min="0.1"
                        max="50"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="loanTerm">Loan Term (Years)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="loanTerm"
                        type="number" 
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                        onBlur={calculateLoan}
                        className="pl-10"
                        min="1"
                        max="30"
                      />
                    </div>
                  </div>
                </div>

                {monthlyPayment !== null && (
                  <div className="grid md:grid-cols-3 gap-6 p-6 bg-primary/5 rounded-lg">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">Monthly Payment</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(monthlyPayment)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">Total Interest</p>
                      <p className="text-3xl font-bold text-foreground">
                        {formatCurrency(totalInterest!)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">Total Payment</p>
                      <p className="text-3xl font-bold text-foreground">
                        {formatCurrency(totalPayment!)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-8 p-6 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-3">Ready to streamline your bookkeeping?</h3>
                  <p className="text-muted-foreground mb-4">
                    Join thousands of businesses using CashFlow AI to automate their financial management.
                  </p>
                  <Button 
                    variant="gradient" 
                    onClick={() => window.location.href = '#pricing'}
                  >
                    Get Started
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
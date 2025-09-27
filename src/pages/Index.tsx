import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { LoanCalculator } from "@/components/landing/LoanCalculator";
import { NewsletterSection } from "@/components/landing/NewsletterSection";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import { TestEmailSender } from "@/components/TestEmailSender";

const Index = () => {
  const { user, loading } = useAuth(false); // Don't require auth on landing
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);
  const [showLoanCalculatorPopup, setShowLoanCalculatorPopup] = useState(false);

  useEffect(() => {
    // If user is logged in and not loading, redirect to dashboard
    if (!loading && user) {
      setRedirecting(true);
      // Small delay to show the redirect message
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // Check if we should show loan calculator popup for non-authenticated users
    if (!loading && !user) {
      const hasSubmittedEmail = localStorage.getItem('loan_calculator_email_submitted');
      const popupShowCount = parseInt(localStorage.getItem('loan_calculator_popup_count') || '0');
      
      // Only show popup if user hasn't submitted email and hasn't seen it twice
      if (!hasSubmittedEmail && popupShowCount < 2) {
        setShowLoanCalculatorPopup(true);
      }
    }
  }, [user, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // If user is logged in, show redirect message with manual button
  if (user || redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h2 className="text-2xl font-semibold">Welcome back!</h2>
            <p className="text-muted-foreground">Redirecting to your dashboard...</p>
          </div>
          
          <div className="pt-4">
            <Button 
              size="lg"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="group"
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Go to Dashboard Now
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            If you're not redirected automatically, click the button above
          </p>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <TestEmailSender />
        <LoanCalculator />
        <Features />
        <NewsletterSection />
        <Pricing />
      </main>
      <Footer />
      
      {/* Loan Calculator Popup - only shows when conditions are met */}
      {showLoanCalculatorPopup && (
        <LoanCalculator 
          showAsPopup={true} 
          onClose={() => setShowLoanCalculatorPopup(false)} 
        />
      )}
    </div>
  );
};

export default Index;

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Play, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Hero() {
  const { user } = useAuth(false);
  const navigate = useNavigate();
  
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4 mr-2" />
              AI-Powered Financial Management
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Bookkeeping Made{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Effortless
              </span>{" "}
              with AI
            </h1>
            
            <p className="text-xl text-muted-foreground">
              Automate your bookkeeping, connect your bank accounts, and generate professional 
              reports in seconds. Let AI handle the numbers while you focus on growing your business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Button size="xl" variant="gradient" className="group">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="xl" variant="gradient" className="group">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
              <Button 
                size="xl" 
                variant="outline" 
                className="group"
                onClick={() => navigate('/demo')}
              >
                <Play className="mr-2 h-5 w-5" />
                View Demo
              </Button>
            </div>
            
            <div className="pt-4 space-y-3">
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success mr-3" />
                No credit card required
              </div>
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success mr-3" />
                14-day free trial
              </div>
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success mr-3" />
                Cancel anytime
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20"></div>
            <img 
              src="/hero-dashboard.png" 
              alt="Cash Flow AI Dashboard" 
              className="relative rounded-2xl shadow-2xl border border-border"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
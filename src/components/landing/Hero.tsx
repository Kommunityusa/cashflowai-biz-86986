import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Monitor, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

export function Hero() {
  const { user } = useAuth(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4 mr-2" />
              {t.hero.title.split(' ').slice(0, 3).join(' ')}
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Pennsylvania's Smart Bookkeeping Solution for Small Businesses
            </h1>
            
            <p className="text-xl text-muted-foreground">
              Built for PA business owners who need accurate, IRS-compliant books without the hassle. Automated categorization, tax-ready reports, and PA-specific insights—all in one platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Button size="xl" variant="gradient" className="group">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    {t.nav.dashboard}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link to="/checkout">
                  <Button size="xl" variant="gradient" className="group">
                    {t.hero.cta}
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
                <Monitor className="mr-2 h-5 w-5" />
                {t.hero.ctaSecondary}
              </Button>
            </div>
            
            <div className="pt-4 space-y-3">
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success mr-3" />
                IRS Publication 334 Compliant Categories
              </div>
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success mr-3" />
                Trusted by Pennsylvania Businesses
              </div>
              <div className="flex items-center text-muted-foreground">
                <CheckCircle className="h-5 w-5 text-success mr-3" />
                Bank-Level Security & Encryption
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
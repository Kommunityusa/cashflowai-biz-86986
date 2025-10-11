import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { TrustedBy } from "@/components/landing/TrustedBy";
import { Pricing } from "@/components/landing/Pricing";
import { NewsletterSection } from "@/components/landing/NewsletterSection";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";

const Index = () => {
  const { user, loading } = useAuth(false); // Don't require auth on landing
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // Show landing page for all users (authenticated or not)
  return (
    <>
      <SEO
        title="Pennsylvania Small Business Bookkeeping Software | Cash Flow AI"
        description="AI-powered bookkeeping for Pennsylvania businesses. Automated tax categorization, IRS-compliant reports, and real-time insights. Built for PA entrepreneurs."
        keywords={['Pennsylvania bookkeeping software', 'PA small business accounting', 'Pennsylvania tax software', 'bookkeeping Philadelphia', 'Pittsburgh small business accounting', 'Pennsylvania financial management', 'PA business bookkeeping']}
      />
      <div className="min-h-screen bg-background">
        <Header />
      <main>
        <Hero />
        <TrustedBy />
        <Features />
        <NewsletterSection />
        <Pricing />
      </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;

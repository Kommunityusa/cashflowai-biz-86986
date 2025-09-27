import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Sparkles } from "lucide-react";

export function NewsletterSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Join 10,000+ Business Owners</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Get Expert Financial Insights
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Weekly tips on bookkeeping, tax strategies, and business growth. 
            Unsubscribe anytime.
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <NewsletterSignup />
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">95%</div>
            <p className="text-sm text-muted-foreground">Open Rate</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">2x</div>
            <p className="text-sm text-muted-foreground">Tax Savings on Average</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">10K+</div>
            <p className="text-sm text-muted-foreground">Active Subscribers</p>
          </div>
        </div>
      </div>
    </section>
  );
}
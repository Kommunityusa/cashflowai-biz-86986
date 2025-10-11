import { Header } from "@/components/layout/Header";
import { TaxAdvisorChat } from "@/components/tax/TaxAdvisorChat";
import { MessageCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function TaxCenter() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Philadelphia Tax Advisor - AI Tax Center Powered by IRS Publication 334"
        description="Get instant tax advice for your Philadelphia business. AI tax advisor trained on IRS Publication 334 provides accurate, compliant guidance for small business tax questions."
        keywords={['Philadelphia tax advisor', 'AI tax help', 'IRS Publication 334', 'small business tax guidance', 'tax categorization']}
      />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            Philadelphia Tax Advisor - AI-Powered Tax Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Chat with John, your AI tax advisor powered by IRS Publication 334
          </p>
        </div>

        <TaxAdvisorChat />
      </div>
    </div>
  );
}

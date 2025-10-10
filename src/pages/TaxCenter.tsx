import { Header } from "@/components/layout/Header";
import { TaxAdvisorChat } from "@/components/tax/TaxAdvisorChat";
import { MessageCircle } from "lucide-react";

export default function TaxCenter() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            Tax Center
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

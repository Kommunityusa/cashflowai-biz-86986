import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaxInsights } from "@/components/tax/TaxInsights";
import { TaxAdvisorChat } from "@/components/tax/TaxAdvisorChat";
import { FileText, MessageCircle, Settings } from "lucide-react";

export default function TaxCenter() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tax Center</h1>
          <p className="text-muted-foreground mt-2">
            Track deductions, get AI-powered tax guidance based on IRS Publication 334
          </p>
        </div>

        <Tabs defaultValue="insights" className="space-y-4">
          <TabsList>
            <TabsTrigger value="insights">
              <FileText className="h-4 w-4 mr-2" />
              Tax Insights
            </TabsTrigger>
            <TabsTrigger value="advisor">
              <MessageCircle className="h-4 w-4 mr-2" />
              AI Tax Advisor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights">
            <TaxInsights />
          </TabsContent>

          <TabsContent value="advisor">
            <TaxAdvisorChat />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

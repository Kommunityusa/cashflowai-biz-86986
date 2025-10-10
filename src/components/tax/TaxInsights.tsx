import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FileText, DollarSign, AlertCircle, CheckCircle, Download, Sparkles, Lightbulb } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface DeductibleCategory {
  name: string;
  amount: number;
  count: number;
  irs_code: string | null;
}

export function TaxInsights() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deductibleExpenses, setDeductibleExpenses] = useState<DeductibleCategory[]>([]);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [aiInsights, setAiInsights] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchTaxInsights();
    }
  }, [user, taxYear]);

  const fetchTaxInsights = async () => {
    try {
      setLoading(true);

      // Fetch all transactions for the tax year with their categories
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select(`
          *,
          categories (
            name,
            type,
            is_tax_deductible,
            irs_category_code
          )
        `)
        .eq("user_id", user?.id)
        .gte("transaction_date", `${taxYear}-01-01`)
        .lte("transaction_date", `${taxYear}-12-31`)
        .eq("type", "expense");

      if (error) throw error;

      // Group by tax-deductible categories
      const deductibleMap = new Map<string, DeductibleCategory>();
      let total = 0;

      transactions?.forEach((t) => {
        if (t.categories?.is_tax_deductible) {
          const key = t.categories.name;
          if (!deductibleMap.has(key)) {
            deductibleMap.set(key, {
              name: t.categories.name,
              amount: 0,
              count: 0,
              irs_code: t.categories.irs_category_code || null,
            });
          }
          const category = deductibleMap.get(key)!;
          category.amount += Number(t.amount);
          category.count += 1;
          total += Number(t.amount);
        }
      });

      setDeductibleExpenses(Array.from(deductibleMap.values()).sort((a, b) => b.amount - a.amount));
      setTotalDeductions(total);
    } catch (error) {
      console.error("Error fetching tax insights:", error);
      toast({
        title: "Error",
        description: "Failed to load tax insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTaxReport = () => {
    // Generate CSV for tax deductions
    const headers = ["Category", "IRS Code", "Amount", "Transaction Count"];
    const rows = deductibleExpenses.map((d) => [
      d.name,
      d.irs_code || "N/A",
      d.amount.toFixed(2),
      d.count.toString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
      "",
      `Total Deductible Expenses,,,${totalDeductions.toFixed(2)}`,
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-deductions-${taxYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Tax report downloaded",
    });
  };

  const generateAIInsights = async () => {
    try {
      setAiLoading(true);
      
      const { data, error } = await supabase.functions.invoke('tax-insights');
      
      if (error) throw error;
      
      setAiInsights(data.insights);
      setSummary(data.summary);
      
      toast({
        title: "Success",
        description: "AI tax insights generated",
      });
    } catch (error) {
      console.error("Error generating AI insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };


  return (
    <div className="space-y-4">
      {/* AI Insights Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Tax Insights
              </CardTitle>
              <CardDescription className="mt-2">
                Get personalized tax advice based on IRS Publication 334 and your financial data
              </CardDescription>
            </div>
            <Button 
              onClick={generateAIInsights} 
              disabled={aiLoading || loading}
              variant="gradient"
            >
              {aiLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiInsights ? (
            <div className="space-y-4">
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total Income</p>
                      <p className="text-xl font-bold text-primary">
                        ${summary.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        ${summary.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Deductible</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        ${summary.deductibleExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Est. Savings</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ${summary.potentialSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{aiInsights}</ReactMarkdown>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Lightbulb className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No insights generated yet</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Click "Generate Insights" to get AI-powered tax advice based on your financial data and IRS Publication 334
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deductions Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tax Deductions Summary - {taxYear}
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(Number(e.target.value))}
                className="border rounded px-3 py-1 text-sm"
              >
                {[2024, 2023, 2022, 2021, 2020].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <Button onClick={downloadTaxReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Deductible</p>
                    <p className="text-2xl font-bold text-primary">
                      ${totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Deductible Categories</p>
                    <p className="text-2xl font-bold">{deductibleExpenses.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">IRS Reference</p>
                    <p className="text-sm font-medium">Publication 334</p>
                    <a
                      href="/irs-guidance/p334-tax-guide.pdf"
                      target="_blank"
                      className="text-xs text-primary hover:underline"
                    >
                      View Guide
                    </a>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Deductible Expense Breakdown</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : deductibleExpenses.length > 0 ? (
              deductibleExpenses.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{category.name}</p>
                      {category.irs_code && (
                        <Badge variant="outline" className="text-xs">
                          {category.irs_code}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{category.count} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      ${category.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No tax-deductible expenses found for {taxYear}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mark categories as tax-deductible in Settings
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

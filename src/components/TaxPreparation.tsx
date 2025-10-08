import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/utils/auditLogger";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  FileText,
  Download,
  Calculator,
  Receipt,
  DollarSign,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Building,
  Calendar,
  PieChart,
  FileSpreadsheet,
} from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface TaxSummary {
  totalIncome: number;
  totalExpenses: number;
  totalDeductible: number;
  estimatedTaxSavings: number;
  netTaxableIncome: number;
  categorizedDeductions: { category: string; amount: number; percentage: number }[];
  quarterlyEstimates: { quarter: string; amount: number }[];
  forms: string[];
}

export function TaxPreparation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [year, setYear] = useState(new Date().getFullYear());
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [taxRate, setTaxRate] = useState(25); // Default tax rate

  useEffect(() => {
    if (user) {
      generateTaxReport();
    }
  }, [user, year]);

  const generateTaxReport = async () => {
    setLoading(true);

    // Log tax report generation
    await logAuditEvent({
      action: 'GENERATE_TAX_REPORT',
      entityType: 'tax_report',
      details: { year }
    });

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*, categories!transactions_category_id_fkey(name, type)")
      .eq("user_id", user?.id)
      .gte("transaction_date", startDate.toISOString().split("T")[0])
      .lte("transaction_date", endDate.toISOString().split("T")[0])
      .order("transaction_date");

    if (transactions) {
      // Calculate totals
      const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalDeductible = transactions
        .filter(t => t.tax_deductible && t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Categorize deductible expenses
      const deductibleByCategory = new Map<string, number>();
      transactions
        .filter(t => t.tax_deductible && t.type === "expense")
        .forEach(t => {
          const category = t.categories?.name || "Uncategorized";
          deductibleByCategory.set(
            category,
            (deductibleByCategory.get(category) || 0) + Number(t.amount)
          );
        });

      const categorizedDeductions = Array.from(deductibleByCategory.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: (amount / totalDeductible) * 100
        }))
        .sort((a, b) => b.amount - a.amount);

      // Calculate quarterly estimates
      const quarterlyData = new Map<string, { income: number; deductible: number }>();
      transactions.forEach(t => {
        const quarter = `Q${Math.floor(new Date(t.transaction_date).getMonth() / 3) + 1} ${year}`;
        const current = quarterlyData.get(quarter) || { income: 0, deductible: 0 };
        
        if (t.type === "income") {
          current.income += Number(t.amount);
        } else if (t.tax_deductible) {
          current.deductible += Number(t.amount);
        }
        
        quarterlyData.set(quarter, current);
      });

      const quarterlyEstimates = Array.from(quarterlyData.entries())
        .map(([quarter, data]) => ({
          quarter,
          amount: (data.income - data.deductible) * (taxRate / 100) / 4
        }));

      const netTaxableIncome = totalIncome - totalDeductible;
      const estimatedTaxSavings = totalDeductible * (taxRate / 100);

      // Determine likely forms needed
      const forms = ["1040"]; // Always needed
      if (totalIncome > 0) forms.push("Schedule C"); // Business income
      if (totalDeductible > 0) forms.push("Schedule A"); // Itemized deductions
      if (quarterlyEstimates.some(q => q.amount > 0)) forms.push("1040-ES"); // Estimated tax

      setTaxSummary({
        totalIncome,
        totalExpenses,
        totalDeductible,
        estimatedTaxSavings,
        netTaxableIncome,
        categorizedDeductions,
        quarterlyEstimates,
        forms,
      });
    }

    setLoading(false);
  };

  const exportTaxReport = async (format: "pdf" | "csv") => {
    if (!taxSummary) return;

    if (format === "pdf") {
      const element = document.getElementById("tax-report");
      if (element) {
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`tax-report-${year}.pdf`);
      }
    } else {
      // Generate CSV
      let csv = "Tax Report " + year + "\n\n";
      csv += "Summary\n";
      csv += `Total Income,${taxSummary.totalIncome.toFixed(2)}\n`;
      csv += `Total Expenses,${taxSummary.totalExpenses.toFixed(2)}\n`;
      csv += `Total Deductible,${taxSummary.totalDeductible.toFixed(2)}\n`;
      csv += `Net Taxable Income,${taxSummary.netTaxableIncome.toFixed(2)}\n`;
      csv += `Estimated Tax Savings,${taxSummary.estimatedTaxSavings.toFixed(2)}\n\n`;
      
      csv += "Deductible Categories\n";
      csv += "Category,Amount,Percentage\n";
      taxSummary.categorizedDeductions.forEach(cat => {
        csv += `${cat.category},${cat.amount.toFixed(2)},${cat.percentage.toFixed(1)}%\n`;
      });
      
      csv += "\nQuarterly Estimates\n";
      csv += "Quarter,Estimated Tax\n";
      taxSummary.quarterlyEstimates.forEach(q => {
        csv += `${q.quarter},${q.amount.toFixed(2)}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tax-report-${year}.csv`;
      a.click();
    }

    toast({
      title: "Tax Report Exported",
      description: `Your ${year} tax report has been exported as ${format.toUpperCase()}`,
    });
  };

  const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" id="tax-report">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${taxSummary?.totalIncome.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Gross revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${taxSummary?.totalExpenses.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">All business expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Deductible</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${taxSummary?.totalDeductible.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Eligible deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${taxSummary?.estimatedTaxSavings.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">At {taxRate}% tax rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Taxable</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${taxSummary?.netTaxableIncome.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">After deductions</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="deductions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deductions">Deductions</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          <TabsTrigger value="forms">Tax Forms</TabsTrigger>
          <TabsTrigger value="tips">Tax Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="deductions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deductible Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={taxSummary?.categorizedDeductions || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {taxSummary?.categorizedDeductions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name, props) => [
                        `$${value.toFixed(2)} (${props.payload.percentage.toFixed(1)}%)`,
                        props.payload.category
                      ]} 
                    />
                  </RePieChart>
                </ResponsiveContainer>

                <div className="space-y-2">
                  {taxSummary?.categorizedDeductions.slice(0, 10).map((cat, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          ${cat.amount.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Tax Estimates</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taxSummary?.quarterlyEstimates || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {taxSummary?.quarterlyEstimates.map((q, index) => (
                  <div key={index} className="text-center">
                    <p className="text-sm text-muted-foreground">{q.quarter}</p>
                    <p className="text-lg font-semibold">${q.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Required Tax Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taxSummary?.forms.map((form, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{form}</p>
                        <p className="text-xs text-muted-foreground">
                          {form === "1040" && "Individual Income Tax Return"}
                          {form === "Schedule C" && "Profit or Loss from Business"}
                          {form === "Schedule A" && "Itemized Deductions"}
                          {form === "1040-ES" && "Estimated Tax for Individuals"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Required</Badge>
                  </div>
                ))}
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    These are the typical forms based on your transaction data. 
                    Please consult with a tax professional for your specific situation.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Optimization Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Maximize Your Deductions:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Track all business-related mileage and vehicle expenses</li>
                      <li>• Keep receipts for all business meals (50% deductible)</li>
                      <li>• Document home office expenses if you work from home</li>
                      <li>• Include professional development and training costs</li>
                      <li>• Don't forget about software subscriptions and tools</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Building className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Business Structure Considerations:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Consider forming an LLC or S-Corp for liability protection</li>
                      <li>• S-Corp election may reduce self-employment taxes</li>
                      <li>• Keep business and personal expenses separate</li>
                      <li>• Maintain proper documentation for all business activities</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Important Deadlines:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Q1 Estimated Tax: April 15</li>
                      <li>• Q2 Estimated Tax: June 15</li>
                      <li>• Q3 Estimated Tax: September 15</li>
                      <li>• Q4 Estimated Tax: January 15</li>
                      <li>• Annual Tax Return: April 15</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {taxSummary && taxSummary.totalDeductible < taxSummary.totalExpenses * 0.3 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Low Deduction Rate Detected</p>
                      <p className="text-sm mt-1">
                        Only {((taxSummary.totalDeductible / taxSummary.totalExpenses) * 100).toFixed(1)}% 
                        of your expenses are marked as tax-deductible. Review your transactions to ensure 
                        all eligible expenses are properly categorized.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Actions */}
      <div className="flex gap-2">
        <Button onClick={() => exportTaxReport("pdf")}>
          <FileText className="mr-2 h-4 w-4" />
          Export PDF Report
        </Button>
        <Button onClick={() => exportTaxReport("csv")} variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export CSV Data
        </Button>
      </div>
    </div>
  );
}
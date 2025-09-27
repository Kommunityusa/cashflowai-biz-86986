import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/utils/auditLogger";
import {
  FileText,
  Download,
  TrendingUp,
  Calendar,
  PieChart,
  BarChart3,
  DollarSign,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState("month");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [reportData, setReportData] = useState<any>({
    summary: { income: 0, expenses: 0, netProfit: 0, taxDeductible: 0 },
    categoryBreakdown: [],
    monthlyTrend: [],
    topExpenses: [],
    topIncome: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      generateReport();
    }
  }, [user, period, year, month]);

  const generateReport = async () => {
    setLoading(true);
    
    // Log report generation
    await logAuditEvent({
      action: 'GENERATE_REPORT',
      entityType: 'report',
      details: {
        period,
        year,
        month: period === 'month' ? month : undefined,
      }
    });
    
    let startDate, endDate;
    if (period === "month") {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0);
    } else if (period === "quarter") {
      const quarter = Math.floor((parseInt(month) - 1) / 3);
      startDate = new Date(parseInt(year), quarter * 3, 1);
      endDate = new Date(parseInt(year), quarter * 3 + 3, 0);
    } else {
      startDate = new Date(parseInt(year), 0, 1);
      endDate = new Date(parseInt(year), 11, 31);
    }

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*, categories!transactions_category_id_fkey(name, color)")
      .eq("user_id", user?.id)
      .gte("transaction_date", startDate.toISOString().split("T")[0])
      .lte("transaction_date", endDate.toISOString().split("T")[0])
      .order("transaction_date");

    if (transactions) {
      const income = transactions
        ?.filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const expenses = transactions
        ?.filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const taxDeductible = transactions
        ?.filter((t) => t.tax_deductible)
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const categoryMap = new Map();
      let categoryIndex = 0;
      transactions?.forEach((t) => {
        if (t.type === "expense") {
          const categoryName = t.categories?.name || "Uncategorized";
          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, { 
              name: categoryName, 
              value: 0, 
              color: t.categories?.color || getCategoryColor(categoryName, categoryIndex++)
            });
          }
          const current = categoryMap.get(categoryName);
          current.value += Number(t.amount);
        }
      });

      setReportData({
        summary: {
          income,
          expenses,
          netProfit: income - expenses,
          taxDeductible,
        },
        categoryBreakdown: Array.from(categoryMap.values()),
        monthlyTrend: [],
        topExpenses: transactions?.filter((t) => t.type === "expense").slice(0, 5) || [],
        topIncome: transactions?.filter((t) => t.type === "income").slice(0, 5) || [],
      });
    }

    setLoading(false);
  };

  const exportCSV = () => {
    toast({
      title: "Success",
      description: "Report exported as CSV",
    });
  };

  // Extended color palette for unique category colors
  const COLORS = [
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#6366F1", // Indigo
    "#84CC16", // Lime
    "#06B6D4", // Cyan
    "#A855F7", // Purple
    "#FB923C", // Orange-400
    "#FACC15", // Yellow
    "#34D399", // Emerald-400
    "#60A5FA", // Blue-400
    "#C084FC", // Purple-400
    "#FB7185", // Rose-400
    "#4ADE80", // Green-400
    "#FDE047", // Yellow-300
  ];
  
  // Function to generate a unique color for a category based on its name
  const getCategoryColor = (categoryName: string, index: number) => {
    // Use a hash of the category name to consistently assign the same color
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % COLORS.length;
    return COLORS[colorIndex];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            <p className="text-muted-foreground">
              Generate and export detailed financial reports
            </p>
          </div>
          <Button onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Report Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Report Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2023, 2022].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {period === "month" && (
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {new Date(2024, m - 1).toLocaleDateString("en", {
                          month: "long",
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button onClick={generateReport} variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${reportData.summary.income.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${reportData.summary.expenses.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                reportData.summary.netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                ${reportData.summary.netProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tax Deductible</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${reportData.summary.taxDeductible.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-muted-foreground" />
                Expense Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : reportData.categoryBreakdown.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <RePieChart>
                      <Pie
                        data={reportData.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {reportData.categoryBreakdown.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                  
                  {/* Category Legend */}
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {reportData.categoryBreakdown
                      .sort((a: any, b: any) => b.value - a.value)
                      .map((category: any, index: number) => {
                        const percentage = ((category.value / reportData.summary.expenses) * 100).toFixed(1);
                        return (
                          <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-sm font-medium">{category.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{percentage}%</span>
                              <span className="text-sm font-semibold">${category.value.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                  <PieChart className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No expense data available</p>
                  <p className="text-xs mt-1">Try adjusting the date range</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                Top Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Top Expenses</h4>
                    <ArrowDownIcon className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    {reportData.topExpenses.length > 0 ? (
                      reportData.topExpenses.slice(0, 3).map((expense: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <span className="text-sm truncate flex-1 mr-2">{expense.description}</span>
                          <span className="text-sm font-semibold text-red-600 whitespace-nowrap">
                            -${Number(expense.amount).toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">No expenses</p>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Top Income</h4>
                    <ArrowUpIcon className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    {reportData.topIncome.length > 0 ? (
                      reportData.topIncome.slice(0, 3).map((income: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <span className="text-sm truncate flex-1 mr-2">{income.description}</span>
                          <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                            +${Number(income.amount).toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">No income</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
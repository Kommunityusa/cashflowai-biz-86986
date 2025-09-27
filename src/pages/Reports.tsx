import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Calendar,
  RefreshCw,
  DollarSign,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { ProfitLossStatement } from "@/components/reports/ProfitLossStatement";
import { BalanceSheet } from "@/components/reports/BalanceSheet";
import { CashFlowStatement } from "@/components/reports/CashFlowStatement";

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState("month");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("profit-loss");
  
  // Financial data states
  const [profitLossData, setProfitLossData] = useState<any>({
    revenue: { total: 0, breakdown: [] },
    expenses: { total: 0, breakdown: [] },
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    period: "",
  });
  
  const [balanceSheetData, setBalanceSheetData] = useState<any>({
    assets: {
      current: [],
      fixed: [],
      totalCurrent: 0,
      totalFixed: 0,
      total: 0,
    },
    liabilities: {
      current: [],
      longTerm: [],
      totalCurrent: 0,
      totalLongTerm: 0,
      total: 0,
    },
    equity: {
      items: [],
      total: 0,
    },
    date: "",
  });
  
  const [cashFlowData, setCashFlowData] = useState<any>({
    operating: { inflows: [], outflows: [], netCash: 0 },
    investing: { inflows: [], outflows: [], netCash: 0 },
    financing: { inflows: [], outflows: [], netCash: 0 },
    beginningCash: 0,
    endingCash: 0,
    netChange: 0,
    period: "",
  });

  useEffect(() => {
    if (user) {
      generateReport();
      checkLastSync();
    }
  }, [user, period, year, month]);

  const checkLastSync = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("last_report_sync")
      .eq("user_id", user?.id)
      .single();
    
    if (profile?.last_report_sync) {
      setLastSyncTime(new Date(profile.last_report_sync));
    }
  };

  const syncTransactions = async () => {
    setSyncing(true);
    try {
      // Call the plaid-auto-sync edge function to sync latest transactions
      const { error } = await supabase.functions.invoke('plaid-auto-sync', {
        body: { autoSync: true }
      });
      
      if (error) throw error;
      
      // Update last sync time
      await supabase
        .from("profiles")
        .update({ last_report_sync: new Date().toISOString() })
        .eq("user_id", user?.id);
      
      toast({
        title: "Success",
        description: "Transactions synced successfully",
      });
      
      // Regenerate report with fresh data
      await generateReport();
      checkLastSync();
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Error",
        description: "Failed to sync transactions",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

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
        reportType: activeTab,
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

    // Fetch transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*, categories!transactions_category_id_fkey(name, color, type)")
      .eq("user_id", user?.id)
      .gte("transaction_date", startDate.toISOString().split("T")[0])
      .lte("transaction_date", endDate.toISOString().split("T")[0])
      .order("transaction_date");

    // Fetch bank accounts for balance sheet
    const { data: bankAccounts } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_active", true);

    if (transactions) {
      // Process Profit & Loss data
      const revenueByCategory = new Map<string, number>();
      const expensesByCategory = new Map<string, number>();
      
      transactions.forEach((t) => {
        const categoryName = t.categories?.name || "Uncategorized";
        const amount = Number(t.amount);
        
        if (t.type === "income") {
          revenueByCategory.set(categoryName, (revenueByCategory.get(categoryName) || 0) + amount);
        } else if (t.type === "expense") {
          expensesByCategory.set(categoryName, (expensesByCategory.get(categoryName) || 0) + amount);
        }
      });
      
      const totalRevenue = Array.from(revenueByCategory.values()).reduce((sum, val) => sum + val, 0);
      const totalExpenses = Array.from(expensesByCategory.values()).reduce((sum, val) => sum + val, 0);
      const netProfit = totalRevenue - totalExpenses;
      
      setProfitLossData({
        revenue: {
          total: totalRevenue,
          breakdown: Array.from(revenueByCategory.entries()).map(([category, amount]) => ({
            category,
            amount,
          })),
        },
        expenses: {
          total: totalExpenses,
          breakdown: Array.from(expensesByCategory.entries()).map(([category, amount]) => ({
            category,
            amount,
          })),
        },
        grossProfit: totalRevenue,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      });

      // Process Balance Sheet data
      const totalCash = bankAccounts?.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0) || 0;
      const accountsReceivable = transactions
        .filter(t => t.type === "income" && t.status === "pending")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      setBalanceSheetData({
        assets: {
          current: [
            { name: "Cash and Bank", amount: totalCash },
            { name: "Accounts Receivable", amount: accountsReceivable },
          ],
          fixed: [
            { name: "Equipment", amount: 0 },
            { name: "Property", amount: 0 },
          ],
          totalCurrent: totalCash + accountsReceivable,
          totalFixed: 0,
          total: totalCash + accountsReceivable,
        },
        liabilities: {
          current: [
            { name: "Accounts Payable", amount: 0 },
            { name: "Credit Cards", amount: 0 },
          ],
          longTerm: [
            { name: "Loans", amount: 0 },
          ],
          totalCurrent: 0,
          totalLongTerm: 0,
          total: 0,
        },
        equity: {
          items: [
            { name: "Owner's Capital", amount: totalCash + accountsReceivable },
            { name: "Retained Earnings", amount: netProfit },
          ],
          total: totalCash + accountsReceivable + netProfit,
        },
        date: endDate.toLocaleDateString(),
      });

      // Process Cash Flow data
      const operatingInflows = transactions
        .filter(t => t.type === "income" && t.categories?.name !== "Investment Income")
        .map(t => ({ name: t.description, amount: Number(t.amount) }));
      
      const operatingOutflows = transactions
        .filter(t => t.type === "expense" && !["Equipment", "Property"].includes(t.categories?.name || ""))
        .map(t => ({ name: t.description, amount: Number(t.amount) }));
      
      const investingInflows = transactions
        .filter(t => t.type === "income" && t.categories?.name === "Investment Income")
        .map(t => ({ name: t.description, amount: Number(t.amount) }));
      
      const investingOutflows = transactions
        .filter(t => t.type === "expense" && ["Equipment", "Property"].includes(t.categories?.name || ""))
        .map(t => ({ name: t.description, amount: Number(t.amount) }));
      
      const operatingNet = operatingInflows.reduce((sum, i) => sum + i.amount, 0) - 
                          operatingOutflows.reduce((sum, o) => sum + o.amount, 0);
      const investingNet = investingInflows.reduce((sum, i) => sum + i.amount, 0) - 
                          investingOutflows.reduce((sum, o) => sum + o.amount, 0);
      
      setCashFlowData({
        operating: {
          inflows: operatingInflows.slice(0, 5),
          outflows: operatingOutflows.slice(0, 5),
          netCash: operatingNet,
        },
        investing: {
          inflows: investingInflows,
          outflows: investingOutflows,
          netCash: investingNet,
        },
        financing: {
          inflows: [],
          outflows: [],
          netCash: 0,
        },
        beginningCash: totalCash - netProfit,
        endingCash: totalCash,
        netChange: netProfit,
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      });
    }

    setLoading(false);
  };

  const exportCSV = () => {
    // Export the current statement as CSV
    let csvContent = "";
    const statementType = activeTab.replace("-", " ").toUpperCase();
    
    if (activeTab === "profit-loss") {
      csvContent = "PROFIT & LOSS STATEMENT\n";
      csvContent += `Period: ${profitLossData.period}\n\n`;
      csvContent += "Category,Amount\n";
      csvContent += "REVENUE\n";
      profitLossData.revenue.breakdown.forEach((item: any) => {
        csvContent += `${item.category},${item.amount}\n`;
      });
      csvContent += `Total Revenue,${profitLossData.revenue.total}\n\n`;
      csvContent += "EXPENSES\n";
      profitLossData.expenses.breakdown.forEach((item: any) => {
        csvContent += `${item.category},${item.amount}\n`;
      });
      csvContent += `Total Expenses,${profitLossData.expenses.total}\n\n`;
      csvContent += `Net Profit,${profitLossData.netProfit}\n`;
      csvContent += `Profit Margin,${profitLossData.profitMargin}%\n`;
    }
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${statementType}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    
    toast({
      title: "Success",
      description: `${statementType} exported as CSV`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Financial Statements</h1>
            <p className="text-muted-foreground">
              Professional accounting reports with automatic data sync
            </p>
            {lastSyncTime && (
              <p className="text-sm text-muted-foreground mt-1">
                Last synced: {lastSyncTime.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={syncTransactions} variant="outline" disabled={syncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
            <Button onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
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

        {/* Financial Statements Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profit-loss" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Profit & Loss
            </TabsTrigger>
            <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Balance Sheet
            </TabsTrigger>
            <TabsTrigger value="cash-flow" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cash Flow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profit-loss" className="mt-6">
            <ProfitLossStatement data={profitLossData} loading={loading} />
          </TabsContent>

          <TabsContent value="balance-sheet" className="mt-6">
            <BalanceSheet data={balanceSheetData} loading={loading} />
          </TabsContent>

          <TabsContent value="cash-flow" className="mt-6">
            <CashFlowStatement data={cashFlowData} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
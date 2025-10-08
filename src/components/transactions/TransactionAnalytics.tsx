import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  PiggyBank,
  Receipt,
  Target,
  Activity,
  DollarSign,
  Calendar,
  Info
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string;
  category_id: string | null;
  tax_deductible: boolean;
  vendor_name: string | null;
  is_internal_transfer?: boolean;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

interface AnalyticsProps {
  transactions: Transaction[];
  categories: Category[];
}

export const TransactionAnalytics = ({ transactions, categories }: AnalyticsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [insights, setInsights] = useState<any[]>([]);

  // Exclude internal transfers from financial calculations
  const financialTransactions = transactions.filter(t => !t.is_internal_transfer);

  // Calculate key metrics
  const totalIncome = financialTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = financialTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netIncome = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : '0';

  const taxDeductibleExpenses = financialTransactions
    .filter(t => t.type === 'expense' && t.tax_deductible)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Prepare trend data for last 6 months (excluding internal transfers)
  const trendData = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = endOfMonth(subMonths(new Date(), i));
    
    const monthTransactions = financialTransactions.filter(t => {
      const transDate = new Date(t.transaction_date);
      return transDate >= monthStart && transDate <= monthEnd;
    });

    const monthIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthExpenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    trendData.push({
      month: format(monthStart, 'MMM'),
      income: monthIncome,
      expenses: monthExpenses,
      net: monthIncome - monthExpenses,
    });
  }

  // Category breakdown data (excluding internal transfers)
  const categoryBreakdown = categories.map(cat => {
    const catTransactions = financialTransactions.filter(t => t.category_id === cat.id);
    const total = catTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      name: cat.name,
      value: total,
      color: cat.color,
      type: cat.type,
      count: catTransactions.length,
    };
  }).filter(cat => cat.value > 0)
    .sort((a, b) => b.value - a.value);

  // Top vendors analysis (excluding internal transfers)
  const vendorSpending = financialTransactions
    .filter(t => t.type === 'expense' && t.vendor_name)
    .reduce((acc, t) => {
      const vendor = t.vendor_name!;
      if (!acc[vendor]) {
        acc[vendor] = { amount: 0, count: 0 };
      }
      acc[vendor].amount += Number(t.amount);
      acc[vendor].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

  const topVendors = Object.entries(vendorSpending)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Generate insights
  useEffect(() => {
    const newInsights = [];

    // Spending trend insight
    if (trendData.length >= 2) {
      const currentMonth = trendData[trendData.length - 1];
      const previousMonth = trendData[trendData.length - 2];
      const expenseChange = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses * 100).toFixed(0);
      
      if (Math.abs(Number(expenseChange)) > 10) {
        newInsights.push({
          type: Number(expenseChange) > 0 ? 'warning' : 'success',
          title: 'Spending Trend',
          description: `Your expenses ${Number(expenseChange) > 0 ? 'increased' : 'decreased'} by ${Math.abs(Number(expenseChange))}% compared to last month.`,
        });
      }
    }

    // Savings rate insight
    if (Number(savingsRate) < 10 && totalIncome > 0) {
      newInsights.push({
        type: 'warning',
        title: 'Low Savings Rate',
        description: `You're only saving ${savingsRate}% of your income. Consider reviewing your expenses to increase savings.`,
      });
    } else if (Number(savingsRate) > 30) {
      newInsights.push({
        type: 'success',
        title: 'Great Savings!',
        description: `You're saving ${savingsRate}% of your income. Keep up the excellent financial discipline!`,
      });
    }

    // Tax deduction opportunity
    if (taxDeductibleExpenses > 0) {
      const potentialSavings = (taxDeductibleExpenses * 0.25).toFixed(2);
      newInsights.push({
        type: 'info',
        title: 'Tax Deductions Available',
        description: `You have $${taxDeductibleExpenses.toFixed(2)} in tax-deductible expenses, potentially saving $${potentialSavings} in taxes.`,
      });
    }

    // Uncategorized transactions
    const uncategorized = transactions.filter(t => !t.category_id).length;
    if (uncategorized > 0) {
      newInsights.push({
        type: 'info',
        title: 'Uncategorized Transactions',
        description: `You have ${uncategorized} uncategorized transaction${uncategorized > 1 ? 's' : ''}. Categorizing them helps with better insights.`,
      });
    }

    setInsights(newInsights);
  }, [transactions, savingsRate, taxDeductibleExpenses]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${netIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Profit/Loss
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <PiggyBank className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savingsRate}%</div>
            <Progress 
              value={Number(savingsRate)} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Financial Insights</h3>
          {insights.map((insight, index) => (
            <Alert key={index} className={`
              ${insight.type === 'success' ? 'border-success' : ''}
              ${insight.type === 'warning' ? 'border-warning' : ''}
              ${insight.type === 'info' ? 'border-info' : ''}
            `}>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{insight.title}:</strong> {insight.description}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="vendors">Top Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses Trend</CardTitle>
              <CardDescription>
                Monthly comparison over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1"
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="2"
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Net Income Trend</CardTitle>
              <CardDescription>
                Your profit/loss over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income Categories</CardTitle>
                <CardDescription>
                  Distribution of income sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown.filter(c => c.type === 'income')}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryBreakdown
                        .filter(c => c.type === 'income')
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>
                  Where your money goes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown.filter(c => c.type === 'expense')}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryBreakdown
                        .filter(c => c.type === 'expense')
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Categories by Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryBreakdown.slice(0, 10).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium">{cat.name}</span>
                      <Badge variant="secondary">{cat.count} transactions</Badge>
                    </div>
                    <span className="font-semibold">${cat.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Vendors by Spending</CardTitle>
              <CardDescription>
                Your most frequent merchants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topVendors.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topVendors}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="amount" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No vendor data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topVendors.map((vendor) => (
                  <div key={vendor.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.count} transaction{vendor.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${vendor.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        Avg: ${(vendor.amount / vendor.count).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Information</CardTitle>
          <CardDescription>
            Summary of tax-deductible expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">${taxDeductibleExpenses.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                Total tax-deductible expenses
              </p>
            </div>
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Based on a 25% tax rate, you could save approximately ${(taxDeductibleExpenses * 0.25).toFixed(2)} in taxes.
              Consult with a tax professional for accurate calculations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
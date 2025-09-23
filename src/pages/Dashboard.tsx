import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { AIInsights } from "@/components/AIInsights";
import { BankAccounts } from "@/components/BankAccounts";
import { SecurityMonitor } from "@/components/SecurityMonitor";
import { RateLimitStatus } from "@/components/RateLimitStatus";
import { EncryptionStatus } from "@/components/EncryptionStatus";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { logAuditEvent } from "@/utils/auditLogger";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DollarSign,
  TrendingUp,
  Activity,
  CreditCard,
  Download,
  Plus,
  Calendar,
  FileText,
  Briefcase,
  Bot,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  useSessionTimeout();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactionCount: 0,
    monthlyGrowth: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchDashboardData();
      logAuditEvent({
        action: 'VIEW_DASHBOARD',
        details: { timestamp: new Date().toISOString() }
      });
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch transactions with categories
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*, categories(name, color, icon)')
        .eq('user_id', user?.id)
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      if (transactions) {
        // Calculate stats
        const revenue = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const expenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Calculate monthly growth
        const currentMonth = new Date().getMonth();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        
        const currentMonthRevenue = transactions
          .filter(t => t.type === 'income' && new Date(t.transaction_date).getMonth() === currentMonth)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const lastMonthRevenue = transactions
          .filter(t => t.type === 'income' && new Date(t.transaction_date).getMonth() === lastMonth)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const monthlyGrowth = lastMonthRevenue > 0 
          ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : 0;

        setStats({
          totalRevenue: revenue,
          totalExpenses: expenses,
          netProfit: revenue - expenses,
          transactionCount: transactions.length,
          monthlyGrowth: monthlyGrowth,
        });

        // Set recent transactions (top 10)
        setRecentTransactions(transactions.slice(0, 10));

        // Prepare chart data (last 30 days)
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const chartPoints = last30Days.map(date => {
          const dayTransactions = transactions.filter(
            t => t.transaction_date === date
          );
          const revenue = dayTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          const expenses = dayTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue,
            expenses,
            profit: revenue - expenses,
          };
        });

        setChartData(chartPoints);

        // Prepare category data
        const categoryMap = new Map();
        transactions.forEach(t => {
          if (t.categories) {
            const key = t.categories.name;
            if (!categoryMap.has(key)) {
              categoryMap.set(key, {
                name: key,
                value: 0,
                color: t.categories.color || '#8884d8',
                type: t.type,
              });
            }
            const cat = categoryMap.get(key);
            cat.value += Number(t.amount);
          }
        });

        setCategoryData(Array.from(categoryMap.values()));

        // Prepare monthly comparison data
        const monthlyMap = new Map();
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            year: date.getFullYear(),
            key: `${date.getFullYear()}-${date.getMonth()}`,
          };
        }).reverse();

        last6Months.forEach(({ month, key }) => {
          monthlyMap.set(key, { month, income: 0, expense: 0 });
        });

        transactions.forEach(t => {
          const date = new Date(t.transaction_date);
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          if (monthlyMap.has(key)) {
            const monthData = monthlyMap.get(key);
            if (t.type === 'income') {
              monthData.income += Number(t.amount);
            } else {
              monthData.expense += Number(t.amount);
            }
          }
        });

        setMonthlyData(Array.from(monthlyMap.values()));
      }
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading skeleton
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/ai-assistant')}>
              <Bot className="mr-2 h-4 w-4" />
              AI Assistant
            </Button>
            <Button variant="outline" onClick={() => navigate('/reports')}>
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button onClick={() => navigate('/transactions')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                <ArrowDownIcon className="inline h-3 w-3 text-red-500" />
                All business expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.netProfit >= 0 ? (
                  <span className="text-green-500">Profitable</span>
                ) : (
                  <span className="text-red-500">Loss</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transactionCount}</div>
              <p className="text-xs text-muted-foreground">
                Total recorded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.transactionCount > 0 
                  ? formatCurrency((stats.totalRevenue + stats.totalExpenses) / stats.transactionCount)
                  : '$0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Per transaction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <AIInsights />

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="space-y-4 mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={false}
                      name="Expenses"
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      name="Profit"
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
                  <CardTitle>Income by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData.filter(c => c.type === 'income')}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData
                          .filter(c => c.type === 'income')
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData.filter(c => c.type === 'expense')}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData
                          .filter(c => c.type === 'expense')
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="hsl(var(--primary))" name="Income" />
                    <Bar dataKey="expense" fill="hsl(var(--destructive))" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bank Accounts */}
        <BankAccounts />

        {/* Security Monitor */}
        <SecurityMonitor />

        {/* Recent Transactions */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/transactions')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.categories?.name || 'Uncategorized'} • {new Date(transaction.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(Number(transaction.amount))}
                  </span>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No transactions yet. Start tracking your finances!
                  </p>
                  <Button onClick={() => navigate('/transactions')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Transaction
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* AI Assistant Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Financial Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Get instant help with financial planning, budgeting advice, and business insights powered by AI.
            </p>
            <Button onClick={() => navigate('/ai-assistant')} className="w-full">
              <Bot className="mr-2 h-4 w-4" />
              Chat with AI Assistant
            </Button>
          </CardContent>
        </Card>
        
        {/* Security Status Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <EncryptionStatus />
          <RateLimitStatus />
        </div>
      </main>
    </div>
  );
}
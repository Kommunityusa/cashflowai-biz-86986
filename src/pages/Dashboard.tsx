import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { BankAccounts } from "@/components/BankAccounts";

import { NewsletterBanner } from "@/components/NewsletterBanner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { logAuditEvent } from "@/utils/auditLogger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
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

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactionCount: 0,
    monthlyGrowth: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    // Check for checkout success parameter
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');
    
    if (checkoutStatus === 'success' && user) {
      // Fire Google Analytics conversion event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion_event_purchase', {
          value: 10.00,
          currency: 'USD',
          transaction_id: `sub_${user.id}_${Date.now()}`,
        });
      }
      
      toast({
        title: "Subscription Active!",
        description: "Your subscription is now active. Explore all premium features!",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [user, toast]);

  useEffect(() => {
    // Only fetch data when we have a user and auth is not loading
    if (!authLoading && user) {
      fetchDashboardData();
      logAuditEvent({
        action: 'VIEW_DASHBOARD',
        details: { timestamp: new Date().toISOString() }
      });
    } else if (!authLoading && !user) {
      // Don't redirect if we're waiting for checkout redirect
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutStatus = urlParams.get('checkout');
      if (checkoutStatus !== 'success') {
        navigate("/auth");
      }
    }
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch transactions with categories
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*, categories!transactions_category_id_fkey(name, color, icon)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) {
        // If it's an RLS error, show a helpful message
        if (error.code === '42501') {
          // Silent fail - RLS policies might not be set up yet
        }
        setLoading(false);
        return;
      }

      if (transactions) {
        // Filter out internal transfers - they don't affect business profit/loss
        const financialTransactions = transactions.filter(t => !t.is_internal_transfer);
        
        // Calculate stats (excluding internal transfers for accurate business metrics)
        const revenue = financialTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const expenses = financialTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        // Calculate monthly growth
        const currentMonth = new Date().getMonth();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        
        const currentMonthRevenue = financialTransactions
          .filter(t => t.type === 'income' && new Date(t.transaction_date).getMonth() === currentMonth)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const lastMonthRevenue = financialTransactions
          .filter(t => t.type === 'income' && new Date(t.transaction_date).getMonth() === lastMonth)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const monthlyGrowth = lastMonthRevenue > 0 
          ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : 0;

        setStats({
          totalRevenue: revenue,
          totalExpenses: expenses,
          netProfit: revenue - expenses,
          transactionCount: financialTransactions.length,
          monthlyGrowth: monthlyGrowth,
        });

        // Prepare chart data (last 30 days)
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const chartPoints = last30Days.map(date => {
          const dayTransactions = financialTransactions.filter(
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

        // Prepare category data (exclude internal transfers)
        const categoryMap = new Map();
        financialTransactions.forEach(t => {
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

        financialTransactions.forEach(t => {
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
  if (authLoading) {
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

  // If not authenticated after loading
  if (!authLoading && !user) {
    return null; // The useAuth hook will redirect to /auth
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.ceil(amount));
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Don't render anything while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  // If no user after auth loading completes
  if (!user) {
    return null; // useAuth will redirect to /auth
  }


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Financial Dashboard - {t.ui.welcomeBack}, {user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              {t.ui.financialOverview} {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/reports')}>
              <FileText className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t.nav.reports}</span>
            </Button>
            <Button onClick={() => navigate('/transactions')}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t.transactions.addManually}</span>
              <span className="sm:hidden">{t.common.add}</span>
            </Button>
          </div>
        </div>

        {/* Main Dashboard Content */}
        {!loading && stats.transactionCount === 0 ? (
          <div className="space-y-6">
            {/* Quick Actions for New Users */}
            <Card className="border-dashed border-2">
              <CardContent className="py-12">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">{t.ui.letsGetStarted}</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {t.ui.dashboardReady}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button 
                      size="lg" 
                      onClick={() => navigate('/transactions')}
                      className="group"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      {t.ui.addFirstTransaction}
                      <ArrowUpIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          // Generate sample data
                          const sampleTransactions = [
                            { description: "Office Rent", amount: 2500, type: "expense", category: "Rent" },
                            { description: "Client Payment - ABC Corp", amount: 5000, type: "income", category: "Sales" },
                            { description: "Software Subscription", amount: 299, type: "expense", category: "Software" },
                            { description: "Consulting Services", amount: 3500, type: "income", category: "Services" },
                            { description: "Office Supplies", amount: 150, type: "expense", category: "Office Supplies" },
                          ];

                          for (const transaction of sampleTransactions) {
                            // Find the category
                            const { data: categories } = await supabase
                              .from('categories')
                              .select('id')
                              .eq('user_id', user?.id)
                              .eq('name', transaction.category)
                              .maybeSingle();

                            // Create transaction
                            await supabase.from('transactions').insert({
                              user_id: user?.id,
                              description: transaction.description,
                              amount: transaction.amount,
                              type: transaction.type,
                              category_id: categories?.id,
                              transaction_date: new Date().toISOString().split('T')[0],
                              status: 'completed'
                            });
                          }

                          toast({
                            title: t.common.success,
                            description: "We've added some sample transactions to get you started.",
                          });
                          
                          // Refresh the dashboard
                          await fetchDashboardData();
                        } catch (error) {
                          console.error('Error generating sample data:', error);
                          toast({
                            title: t.common.error,
                            description: "Failed to generate sample data. Please try again.",
                            variant: "destructive"
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      <Activity className="mr-2 h-5 w-5" />
                      {t.ui.generateSampleData}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Connected Accounts Section */}
            <BankAccounts />
            
            {/* Getting Started Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Started Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <CreditCard className="h-5 w-5" />
                      <h3 className="font-medium">Connect Your Bank</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Link your business accounts for automatic transaction imports and real-time balance updates.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Bot className="h-5 w-5" />
                      <h3 className="font-medium">Monica - AI Assistant</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get instant insights and answers about your finances from Monica, your AI-powered bookkeeping assistant.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <FileText className="h-5 w-5" />
                      <h3 className="font-medium">Generate Reports</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Create professional financial reports for taxes, investors, or business planning.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Newsletter Banner - Shows once per user */}
            <NewsletterBanner storageKey="dashboard-newsletter-dismissed" />
            
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.ui.totalRevenue}</CardTitle>
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
              <CardTitle className="text-sm font-medium">{t.ui.totalExpenses}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                <ArrowDownIcon className="inline h-3 w-3 text-red-500" />
                {t.tax.allBusinessExpenses}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.ui.netProfit}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.netProfit >= 0 ? (
                  <span className="text-green-500">{t.ui.profitable}</span>
                ) : (
                  <span className="text-red-500">{t.ui.loss}</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.nav.transactions}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transactionCount}</div>
              <p className="text-xs text-muted-foreground">
                {t.ui.recorded}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.ui.avgTransaction}</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.transactionCount > 0 
                  ? formatCurrency((stats.totalRevenue + stats.totalExpenses) / stats.transactionCount)
                  : '$0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.ui.perTransaction}
              </p>
            </CardContent>
          </Card>
            </div>

            {/* Charts Section - Only show if there's data */}
            {stats.transactionCount > 0 && (
              <Tabs defaultValue="overview" className="space-y-4 mb-8">
                <TabsList>
                  <TabsTrigger value="overview">{t.ui.overview}</TabsTrigger>
                  <TabsTrigger value="monthly">{t.ui.monthly}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <Card>
              <CardHeader>
                <CardTitle>{t.ui.financialOverviewLast30}</CardTitle>
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
          
          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.ui.monthlyIncomeVsExpenses}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
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
            )}

            {/* Bank Accounts */}
            <BankAccounts />

      </>
        )}
      </main>
    </div>
  );
}
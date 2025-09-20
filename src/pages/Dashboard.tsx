import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  Activity,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const metrics = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1%",
      trend: "up",
      icon: DollarSign,
      description: "from last month"
    },
    {
      title: "Total Expenses",
      value: "$12,234.45",
      change: "-5.4%",
      trend: "down",
      icon: CreditCard,
      description: "from last month"
    },
    {
      title: "Net Profit",
      value: "$32,997.44",
      change: "+32.4%",
      trend: "up",
      icon: TrendingUp,
      description: "from last month"
    },
    {
      title: "Active Clients",
      value: "248",
      change: "+12",
      trend: "up",
      icon: Users,
      description: "new this month"
    }
  ];

  const recentTransactions = [
    { id: 1, description: "Payment from Client ABC", amount: "+$2,500.00", date: "Today", type: "income" },
    { id: 2, description: "Office Supplies", amount: "-$234.50", date: "Yesterday", type: "expense" },
    { id: 3, description: "Software Subscription", amount: "-$99.00", date: "Mar 15", type: "expense" },
    { id: 4, description: "Consulting Fee", amount: "+$5,000.00", date: "Mar 14", type: "income" },
    { id: 5, description: "Internet Bill", amount: "-$89.99", date: "Mar 13", type: "expense" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back {user?.email}! Here's your financial overview.</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="p-6 hover:shadow-soft transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <metric.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  metric.trend === 'up' ? 'text-success' : 'text-destructive'
                }`}>
                  {metric.change}
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 ml-1" />
                  )}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">{metric.value}</h3>
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </Card>
          ))}
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Revenue Overview</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Week</Button>
                <Button variant="ghost" size="sm">Month</Button>
                <Button variant="ghost" size="sm">Year</Button>
              </div>
            </div>
            {/* Chart placeholder */}
            <div className="h-64 bg-gradient-subtle rounded-lg flex items-center justify-center">
              <Activity className="h-12 w-12 text-muted-foreground/30" />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Transactions</h2>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                  <span className={`text-sm font-medium ${
                    transaction.type === 'income' ? 'text-success' : 'text-foreground'
                  }`}>
                    {transaction.amount}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4">
              View All Transactions
            </Button>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6 p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start">
              <DollarSign className="h-4 w-4 mr-2" />
              Record Income
            </Button>
            <Button variant="outline" className="justify-start">
              <CreditCard className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
            <Button variant="outline" className="justify-start">
              <Activity className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
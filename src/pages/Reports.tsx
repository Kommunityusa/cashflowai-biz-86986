import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  TrendingUp,
  Calendar,
  PieChart,
  BarChart3,
  LineChart,
  FileSpreadsheet
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Reports = () => {
  useAuth();
  const reportTypes = [
    {
      icon: FileText,
      title: "Profit & Loss Statement",
      description: "Complete P&L report for your business",
      lastGenerated: "Mar 15, 2024",
      status: "ready"
    },
    {
      icon: BarChart3,
      title: "Cash Flow Analysis",
      description: "Track money in and out of your business",
      lastGenerated: "Mar 10, 2024",
      status: "ready"
    },
    {
      icon: PieChart,
      title: "Expense Breakdown",
      description: "Detailed categorization of all expenses",
      lastGenerated: "Mar 18, 2024",
      status: "ready"
    },
    {
      icon: LineChart,
      title: "Revenue Trends",
      description: "Monthly and yearly revenue patterns",
      lastGenerated: "Mar 12, 2024",
      status: "ready"
    },
    {
      icon: FileSpreadsheet,
      title: "Tax Summary",
      description: "Tax-ready financial summary",
      lastGenerated: "Feb 28, 2024",
      status: "ready"
    },
    {
      icon: TrendingUp,
      title: "Growth Metrics",
      description: "Key performance indicators and growth",
      lastGenerated: "Mar 20, 2024",
      status: "ready"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-2">Generate and download financial reports</p>
        </div>

        {/* Report Controls */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 grid sm:grid-cols-3 gap-4">
              <Select defaultValue="thisMonth">
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="thisQuarter">This Quarter</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="lastQuarter">Last Quarter</SelectItem>
                  <SelectItem value="lastYear">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="tax">Tax Related</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="gradient">
                Generate All Reports
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground">$124,563</p>
            <p className="text-xs text-success mt-1">+12.5% from last period</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-foreground">$34,891</p>
            <p className="text-xs text-destructive mt-1">+3.2% from last period</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
            <p className="text-2xl font-bold text-foreground">$89,672</p>
            <p className="text-xs text-success mt-1">+18.7% from last period</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Profit Margin</p>
            <p className="text-2xl font-bold text-foreground">72%</p>
            <p className="text-xs text-success mt-1">+5% from last period</p>
          </Card>
        </div>

        {/* Report Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report, index) => (
            <Card key={index} className="p-6 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <report.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xs px-2 py-1 bg-success/10 text-success rounded-full">
                  Ready
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {report.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {report.description}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Last: {report.lastGenerated}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Custom Report Builder */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Custom Report Builder</h2>
          <p className="text-muted-foreground mb-4">
            Create custom reports with specific metrics and date ranges tailored to your needs.
          </p>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Build Custom Report
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default Reports;
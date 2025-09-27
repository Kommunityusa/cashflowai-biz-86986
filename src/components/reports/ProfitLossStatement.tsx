import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ProfitLossData {
  revenue: {
    total: number;
    breakdown: Array<{ category: string; amount: number }>;
  };
  expenses: {
    total: number;
    breakdown: Array<{ category: string; amount: number }>;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  period: string;
}

interface ProfitLossStatementProps {
  data: ProfitLossData;
  loading: boolean;
}

export function ProfitLossStatement({ data, loading }: ProfitLossStatementProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Profit & Loss Statement</span>
          <span className="text-sm font-normal text-muted-foreground">{data.period}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue Section */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Revenue</h3>
          <div className="space-y-2 ml-4">
            {data.revenue.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{item.category}</span>
                <span className="font-medium">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 border-t">
            <span className="font-semibold">Total Revenue</span>
            <span className="font-bold text-green-600">{formatCurrency(data.revenue.total)}</span>
          </div>
        </div>

        <Separator />

        {/* Expenses Section */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Operating Expenses</h3>
          <div className="space-y-2 ml-4">
            {data.expenses.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{item.category}</span>
                <span className="font-medium">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 border-t">
            <span className="font-semibold">Total Expenses</span>
            <span className="font-bold text-red-600">{formatCurrency(data.expenses.total)}</span>
          </div>
        </div>

        <Separator />

        {/* Profit Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Gross Profit</span>
            <span className="font-bold">{formatCurrency(data.grossProfit)}</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="font-bold">Net Profit</span>
            <span className={`font-bold flex items-center gap-2 ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.netProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatCurrency(data.netProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Profit Margin</span>
            <span className={`font-medium ${data.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.profitMargin.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
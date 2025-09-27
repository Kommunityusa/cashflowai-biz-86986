import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2, Wallet, CreditCard } from "lucide-react";

interface BalanceSheetData {
  assets: {
    current: Array<{ name: string; amount: number }>;
    fixed: Array<{ name: string; amount: number }>;
    totalCurrent: number;
    totalFixed: number;
    total: number;
  };
  liabilities: {
    current: Array<{ name: string; amount: number }>;
    longTerm: Array<{ name: string; amount: number }>;
    totalCurrent: number;
    totalLongTerm: number;
    total: number;
  };
  equity: {
    items: Array<{ name: string; amount: number }>;
    total: number;
  };
  date: string;
}

interface BalanceSheetProps {
  data: BalanceSheetData;
  loading: boolean;
}

export function BalanceSheet({ data, loading }: BalanceSheetProps) {
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
          <span>Balance Sheet</span>
          <span className="text-sm font-normal text-muted-foreground">As of {data.date}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assets Section */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Assets
          </h3>
          
          <div className="ml-4 space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Assets</h4>
              <div className="space-y-2 ml-4">
                {data.assets.current.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <span className="text-sm font-semibold">Total Current Assets</span>
                <span className="font-semibold">{formatCurrency(data.assets.totalCurrent)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Fixed Assets</h4>
              <div className="space-y-2 ml-4">
                {data.assets.fixed.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <span className="text-sm font-semibold">Total Fixed Assets</span>
                <span className="font-semibold">{formatCurrency(data.assets.totalFixed)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3 pt-3 border-t-2">
            <span className="font-bold">Total Assets</span>
            <span className="font-bold text-green-600">{formatCurrency(data.assets.total)}</span>
          </div>
        </div>

        <Separator />

        {/* Liabilities Section */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Liabilities
          </h3>
          
          <div className="ml-4 space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Liabilities</h4>
              <div className="space-y-2 ml-4">
                {data.liabilities.current.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <span className="text-sm font-semibold">Total Current Liabilities</span>
                <span className="font-semibold">{formatCurrency(data.liabilities.totalCurrent)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Long-term Liabilities</h4>
              <div className="space-y-2 ml-4">
                {data.liabilities.longTerm.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <span className="text-sm font-semibold">Total Long-term Liabilities</span>
                <span className="font-semibold">{formatCurrency(data.liabilities.totalLongTerm)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3 pt-3 border-t-2">
            <span className="font-bold">Total Liabilities</span>
            <span className="font-bold text-red-600">{formatCurrency(data.liabilities.total)}</span>
          </div>
        </div>

        <Separator />

        {/* Equity Section */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Owner's Equity
          </h3>
          <div className="space-y-2 ml-4">
            {data.equity.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{item.name}</span>
                <span className="font-medium">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t-2">
            <span className="font-bold">Total Equity</span>
            <span className="font-bold text-blue-600">{formatCurrency(data.equity.total)}</span>
          </div>
        </div>

        <Separator />

        {/* Balance Check */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-bold">Total Liabilities + Equity</span>
            <span className="font-bold">{formatCurrency(data.liabilities.total + data.equity.total)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {Math.abs(data.assets.total - (data.liabilities.total + data.equity.total)) < 0.01 
              ? "✓ Balance sheet is balanced" 
              : "⚠ Balance sheet requires review"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
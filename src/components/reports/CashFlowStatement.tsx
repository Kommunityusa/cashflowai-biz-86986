import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowUpCircle, ArrowDownCircle, DollarSign } from "lucide-react";

interface CashFlowData {
  operating: {
    inflows: Array<{ name: string; amount: number }>;
    outflows: Array<{ name: string; amount: number }>;
    netCash: number;
  };
  investing: {
    inflows: Array<{ name: string; amount: number }>;
    outflows: Array<{ name: string; amount: number }>;
    netCash: number;
  };
  financing: {
    inflows: Array<{ name: string; amount: number }>;
    outflows: Array<{ name: string; amount: number }>;
    netCash: number;
  };
  beginningCash: number;
  endingCash: number;
  netChange: number;
  period: string;
}

interface CashFlowStatementProps {
  data: CashFlowData;
  loading: boolean;
}

export function CashFlowStatement({ data, loading }: CashFlowStatementProps) {
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

  const CashFlowSection = ({ 
    title, 
    icon, 
    inflows, 
    outflows, 
    netCash 
  }: { 
    title: string; 
    icon: React.ReactNode;
    inflows: Array<{ name: string; amount: number }>;
    outflows: Array<{ name: string; amount: number }>;
    netCash: number;
  }) => (
    <div>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      
      <div className="ml-4 space-y-3">
        {inflows.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <ArrowUpCircle className="h-3 w-3 text-green-600" />
              Cash Inflows
            </h4>
            <div className="space-y-1 ml-4">
              {inflows.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{item.name}</span>
                  <span className="font-medium text-green-600">+{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {outflows.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <ArrowDownCircle className="h-3 w-3 text-red-600" />
              Cash Outflows
            </h4>
            <div className="space-y-1 ml-4">
              {outflows.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{item.name}</span>
                  <span className="font-medium text-red-600">-{formatCurrency(Math.abs(item.amount))}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t">
        <span className="font-semibold">Net Cash from {title}</span>
        <span className={`font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {netCash >= 0 ? '+' : ''}{formatCurrency(netCash)}
        </span>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Cash Flow Statement</span>
          <span className="text-sm font-normal text-muted-foreground">{data.period}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Beginning Cash */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Beginning Cash Balance</span>
            <span className="font-bold">{formatCurrency(data.beginningCash)}</span>
          </div>
        </div>

        {/* Operating Activities */}
        <CashFlowSection
          title="Operating Activities"
          icon={<DollarSign className="h-5 w-5" />}
          inflows={data.operating.inflows}
          outflows={data.operating.outflows}
          netCash={data.operating.netCash}
        />

        <Separator />

        {/* Investing Activities */}
        <CashFlowSection
          title="Investing Activities"
          icon={<DollarSign className="h-5 w-5" />}
          inflows={data.investing.inflows}
          outflows={data.investing.outflows}
          netCash={data.investing.netCash}
        />

        <Separator />

        {/* Financing Activities */}
        <CashFlowSection
          title="Financing Activities"
          icon={<DollarSign className="h-5 w-5" />}
          inflows={data.financing.inflows}
          outflows={data.financing.outflows}
          netCash={data.financing.netCash}
        />

        <Separator />

        {/* Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Net Change in Cash</span>
            <span className={`font-bold ${data.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.netChange >= 0 ? '+' : ''}{formatCurrency(data.netChange)}
            </span>
          </div>
        </div>

        {/* Ending Cash */}
        <div className="bg-primary/10 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Ending Cash Balance</span>
            <span className="font-bold text-lg">{formatCurrency(data.endingCash)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowUpCircle, ArrowDownCircle, DollarSign } from "lucide-react";

interface CashFlowData {
  operating: {
    netIncome: number;
    adjustments: Array<{ name: string; amount: number }>;
    workingCapitalChanges: Array<{ name: string; amount: number }>;
    netCash: number;
  };
  investing: {
    activities: Array<{ name: string; amount: number }>;
    netCash: number;
  };
  financing: {
    activities: Array<{ name: string; amount: number }>;
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const OperatingActivitiesSection = () => (
    <div>
      <h3 className="font-semibold text-lg mb-4">Cash Flows from Operating Activities</h3>
      
      <div className="space-y-3">
        {/* Net Income */}
        <div className="flex justify-between items-center pl-4">
          <span className="font-medium">Net Income</span>
          <span className="font-medium">{formatCurrency(data.operating.netIncome)}</span>
        </div>

        {/* Adjustments to reconcile net income */}
        {data.operating.adjustments.length > 0 && (
          <div className="pl-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-3">
              Adjustments to reconcile net income to net cash:
            </h4>
            <div className="space-y-2 pl-4">
              {data.operating.adjustments.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span>{item.name}</span>
                  <span className={item.amount >= 0 ? 'text-foreground' : 'text-foreground'}>
                    {item.amount >= 0 ? '' : '('}{formatCurrency(Math.abs(item.amount))}{item.amount >= 0 ? '' : ')'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Changes in working capital */}
        {data.operating.workingCapitalChanges.length > 0 && (
          <div className="pl-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-3">
              Changes in operating assets and liabilities:
            </h4>
            <div className="space-y-2 pl-4">
              {data.operating.workingCapitalChanges.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span>{item.name}</span>
                  <span className={item.amount >= 0 ? 'text-foreground' : 'text-foreground'}>
                    {item.amount >= 0 ? '' : '('}{formatCurrency(Math.abs(item.amount))}{item.amount >= 0 ? '' : ')'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Net Cash from Operating Activities */}
        <div className="flex justify-between items-center pt-3 border-t font-semibold">
          <span>Net Cash Provided by Operating Activities</span>
          <span className={data.operating.netCash >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(data.operating.netCash)}
          </span>
        </div>
      </div>
    </div>
  );

  const InvestingActivitiesSection = () => (
    <div>
      <h3 className="font-semibold text-lg mb-4">Cash Flows from Investing Activities</h3>
      
      <div className="space-y-2 pl-4">
        {data.investing.activities.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span>{item.name}</span>
            <span className={item.amount >= 0 ? 'text-foreground' : 'text-foreground'}>
              {item.amount >= 0 ? '' : '('}{formatCurrency(Math.abs(item.amount))}{item.amount >= 0 ? '' : ')'}
            </span>
          </div>
        ))}
        
        {/* Net Cash from Investing Activities */}
        <div className="flex justify-between items-center pt-3 border-t font-semibold">
          <span>Net Cash Used in Investing Activities</span>
          <span className={data.investing.netCash >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(data.investing.netCash)}
          </span>
        </div>
      </div>
    </div>
  );

  const FinancingActivitiesSection = () => (
    <div>
      <h3 className="font-semibold text-lg mb-4">Cash Flows from Financing Activities</h3>
      
      <div className="space-y-2 pl-4">
        {data.financing.activities.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span>{item.name}</span>
            <span className={item.amount >= 0 ? 'text-foreground' : 'text-foreground'}>
              {item.amount >= 0 ? '' : '('}{formatCurrency(Math.abs(item.amount))}{item.amount >= 0 ? '' : ')'}
            </span>
          </div>
        ))}
        
        {/* Net Cash from Financing Activities */}
        <div className="flex justify-between items-center pt-3 border-t font-semibold">
          <span>Net Cash Provided by Financing Activities</span>
          <span className={data.financing.netCash >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(data.financing.netCash)}
          </span>
        </div>
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
        <OperatingActivitiesSection />

        <Separator />

        {/* Investing Activities */}
        <InvestingActivitiesSection />

        <Separator />

        {/* Financing Activities */}
        <FinancingActivitiesSection />

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
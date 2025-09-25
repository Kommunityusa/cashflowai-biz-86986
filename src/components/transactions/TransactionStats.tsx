import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity, PieChart, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TransactionStatsProps {
  transactions: any[];
}

export function TransactionStats({ transactions }: TransactionStatsProps) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0';
  
  // Calculate monthly average
  const uniqueMonths = new Set(transactions.map(t => 
    new Date(t.transaction_date).toISOString().slice(0, 7)
  ));
  const monthCount = Math.max(uniqueMonths.size, 1);
  const monthlyAvgIncome = totalIncome / monthCount;
  const monthlyAvgExpenses = totalExpenses / monthCount;

  // Get categorized vs uncategorized
  const categorizedCount = transactions.filter(t => t.category_id).length;
  const categorizedPercentage = transactions.length > 0 
    ? (categorizedCount / transactions.length) * 100 
    : 0;
  
  const taxDeductibleAmount = transactions
    .filter(t => t.tax_deductible && t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  return (
    <div className="space-y-4 mb-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Income</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Avg: ${monthlyAvgIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-600 dark:text-green-500 opacity-30" />
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                Avg: ${monthlyAvgExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
              </p>
            </div>
            <TrendingDown className="h-10 w-10 text-red-600 dark:text-red-500 opacity-30" />
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                {netProfit >= 0 ? '+' : '-'}${Math.abs(netProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                Margin: {profitMargin}%
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-blue-600 dark:text-blue-500 opacity-30" />
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Tax Deductible</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                ${taxDeductibleAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                Potential savings
              </p>
            </div>
            <Activity className="h-10 w-10 text-purple-600 dark:text-purple-500 opacity-30" />
          </div>
        </Card>
      </div>
      
      {/* Categorization Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Categorization Progress</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {categorizedCount} of {transactions.length} transactions
          </span>
        </div>
        <Progress value={categorizedPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {categorizedPercentage.toFixed(0)}% of transactions have been categorized
        </p>
      </Card>
    </div>
  );
}
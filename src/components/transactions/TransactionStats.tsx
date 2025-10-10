import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

interface TransactionStatsProps {
  transactions: any[];
}

export function TransactionStats({ transactions }: TransactionStatsProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  
  // Get unique years from transactions
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => 
      new Date(t.transaction_date).getFullYear().toString()
    ));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [transactions]);
  
  // Filter transactions by selected year
  const yearTransactions = useMemo(() => {
    return transactions.filter(t => 
      new Date(t.transaction_date).getFullYear().toString() === selectedYear
    );
  }, [transactions, selectedYear]);
  // Calculate total income and expenses for selected year (excluding transfers)
  const totalIncome = yearTransactions
    .filter(t => t.type === 'income' && !t.is_internal_transfer)
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalExpenses = yearTransactions
    .filter(t => t.type === 'expense' && !t.is_internal_transfer)
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0';
  
  // Calculate monthly average for selected year
  const uniqueMonths = new Set(yearTransactions.map(t => 
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
  
  return (
    <div className="space-y-4 mb-6">
      {/* Year Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Financial Summary</h3>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year}>
                {year} {year === currentYear.toString() ? '(Year to Date)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-1">
                <span className="text-lg">↓</span> Money In (Income)
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                +${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-1">
                <span className="text-lg">↑</span> Money Out (Expenses)
              </p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                -${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoryBreakdownProps {
  transactions: any[];
  categories: any[];
}

export function CategoryBreakdown({ transactions, categories }: CategoryBreakdownProps) {
  // Calculate totals by category
  const categoryTotals = transactions.reduce((acc, transaction) => {
    if (transaction.category_id && transaction.categories) {
      const categoryName = transaction.categories.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          type: transaction.categories.type, // Use category type, not transaction type
          color: transaction.categories.color,
          amount: 0,
          count: 0
        };
      }
      acc[categoryName].amount += Number(transaction.amount);
      acc[categoryName].count += 1;
    }
    return acc;
  }, {} as Record<string, any>);

  const sortedCategories = Object.values(categoryTotals).sort((a: any, b: any) => b.amount - a.amount);
  
  const totalExpenses = sortedCategories
    .filter((c: any) => c.type === 'expense')
    .reduce((sum: number, c: any) => sum + c.amount, 0) as number;
    
  const totalIncome = sortedCategories
    .filter((c: any) => c.type === 'income')
    .reduce((sum: number, c: any) => sum + c.amount, 0) as number;

  const expenseCategories = sortedCategories.filter((c: any) => c.type === 'expense');
  const incomeCategories = sortedCategories.filter((c: any) => c.type === 'income');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Expenses Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>Expense Categories</span>
            <span className="text-sm text-muted-foreground font-normal">
              ${totalExpenses.toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {expenseCategories.length > 0 ? (
                expenseCategories.map((category: any) => {
                  const percentage = totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0;
                  return (
                    <div key={category.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                          <span className="text-xs text-muted-foreground">({category.count})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
                          <span className="font-semibold">
                            ${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                        style={{
                          '--progress-background': `${category.color}20`,
                          '--progress-foreground': category.color,
                        } as React.CSSProperties}
                      />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No categorized expenses yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Income Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>Income Categories</span>
            <span className="text-sm text-muted-foreground font-normal">
              ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {incomeCategories.length > 0 ? (
                incomeCategories.map((category: any) => {
                  const percentage = totalIncome > 0 ? (category.amount / totalIncome) * 100 : 0;
                  return (
                    <div key={category.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                          <span className="text-xs text-muted-foreground">({category.count})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
                          <span className="font-semibold">
                            ${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                        style={{
                          '--progress-background': `${category.color}20`,
                          '--progress-foreground': category.color,
                        } as React.CSSProperties}
                      />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No categorized income yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/utils/auditLogger";
import {
  RefreshCcw,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Settings,
  Repeat,
} from "lucide-react";

interface RecurringPattern {
  vendorName: string;
  amount: number;
  frequency: "weekly" | "monthly" | "quarterly" | "annual";
  type: "income" | "expense";
  occurrences: number;
  lastDate: string;
  nextExpectedDate: string;
  confidence: number;
  isConfirmed: boolean;
  transactionIds: string[];
}

export function RecurringTransactionDetector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);

  useEffect(() => {
    if (user) {
      detectRecurringPatterns();
    }
  }, [user]);

  const detectRecurringPatterns = async () => {
    setLoading(true);

    // Get last 6 months of transactions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user?.id)
      .gte("transaction_date", sixMonthsAgo.toISOString().split("T")[0])
      .order("transaction_date");

    if (transactions) {
      const vendorPatterns = new Map<string, any[]>();
      
      // Group transactions by vendor and amount
      transactions.forEach((t) => {
        if (t.vendor_name) {
          const key = `${t.vendor_name.toLowerCase()}-${t.amount}-${t.type}`;
          if (!vendorPatterns.has(key)) {
            vendorPatterns.set(key, []);
          }
          vendorPatterns.get(key)?.push(t);
        }
      });

      const detectedPatterns: RecurringPattern[] = [];

      // Analyze each pattern
      vendorPatterns.forEach((transactions, key) => {
        if (transactions.length >= 2) {
          const dates = transactions.map(t => new Date(t.transaction_date));
          dates.sort((a, b) => a.getTime() - b.getTime());
          
          // Calculate intervals
          const intervals: number[] = [];
          for (let i = 1; i < dates.length; i++) {
            const daysDiff = Math.round((dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24));
            intervals.push(daysDiff);
          }

          // Determine frequency based on average interval
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          let frequency: "weekly" | "monthly" | "quarterly" | "annual";
          let confidence = 0;

          if (avgInterval >= 7 && avgInterval <= 10) {
            frequency = "weekly";
            confidence = calculateConfidence(intervals, 7, 2);
          } else if (avgInterval >= 28 && avgInterval <= 35) {
            frequency = "monthly";
            confidence = calculateConfidence(intervals, 30, 5);
          } else if (avgInterval >= 85 && avgInterval <= 95) {
            frequency = "quarterly";
            confidence = calculateConfidence(intervals, 90, 7);
          } else if (avgInterval >= 360 && avgInterval <= 370) {
            frequency = "annual";
            confidence = calculateConfidence(intervals, 365, 10);
          } else {
            // Try to detect monthly patterns even with some variation
            if (avgInterval >= 25 && avgInterval <= 40) {
              frequency = "monthly";
              confidence = calculateConfidence(intervals, 30, 10) * 0.8;
            } else {
              return; // Skip if no clear pattern
            }
          }

          if (confidence >= 60) {
            const lastTransaction = transactions[transactions.length - 1];
            const lastDate = new Date(lastTransaction.transaction_date);
            const nextDate = calculateNextDate(lastDate, frequency);

            detectedPatterns.push({
              vendorName: lastTransaction.vendor_name || "Unknown",
              amount: Number(lastTransaction.amount),
              frequency,
              type: lastTransaction.type,
              occurrences: transactions.length,
              lastDate: lastTransaction.transaction_date,
              nextExpectedDate: nextDate.toISOString().split("T")[0],
              confidence,
              isConfirmed: false,
              transactionIds: transactions.map(t => t.id),
            });
          }
        }
      });

      // Sort by confidence
      detectedPatterns.sort((a, b) => b.confidence - a.confidence);
      setPatterns(detectedPatterns);

      // Log detection
      await logAuditEvent({
        action: 'DETECT_RECURRING',
        entityType: 'recurring_transaction',
        details: {
          patternsFound: detectedPatterns.length,
        }
      });
    }

    setLoading(false);
  };

  const calculateConfidence = (intervals: number[], expected: number, tolerance: number): number => {
    if (intervals.length === 0) return 0;
    
    const withinTolerance = intervals.filter(i => Math.abs(i - expected) <= tolerance).length;
    const baseConfidence = (withinTolerance / intervals.length) * 100;
    
    // Bonus for more occurrences
    const occurrenceBonus = Math.min(intervals.length * 2, 20);
    
    return Math.min(baseConfidence + occurrenceBonus, 100);
  };

  const calculateNextDate = (lastDate: Date, frequency: string): Date => {
    const next = new Date(lastDate);
    switch (frequency) {
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "annual":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  };

  const confirmRecurring = async (pattern: RecurringPattern) => {
    // Create a recurring transaction record
    const { error } = await supabase
      .from("recurring_transactions")
      .insert({
        user_id: user?.id,
        description: pattern.vendorName,
        vendor_name: pattern.vendorName,
        amount: pattern.amount,
        type: pattern.type,
        frequency: pattern.frequency,
        start_date: pattern.lastDate,
        next_due_date: pattern.nextExpectedDate,
        is_active: true,
        auto_create: false,
      });

    if (!error) {
      // Update the transactions to mark them as recurring
      await supabase
        .from("transactions")
        .update({ is_recurring: true })
        .in("id", pattern.transactionIds);

      toast({
        title: "Recurring Transaction Confirmed",
        description: `${pattern.vendorName} marked as ${pattern.frequency} recurring transaction`,
      });

      // Refresh patterns
      detectRecurringPatterns();
    } else {
      toast({
        title: "Error",
        description: "Failed to confirm recurring transaction",
        variant: "destructive",
      });
    }
  };

  const dismissPattern = (pattern: RecurringPattern) => {
    setPatterns(prev => prev.filter(p => 
      p.vendorName !== pattern.vendorName || 
      p.amount !== pattern.amount
    ));
    
    toast({
      title: "Pattern Dismissed",
      description: "This pattern won't be shown again",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const totalRecurringIncome = patterns
    .filter(p => p.type === "income")
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalRecurringExpenses = patterns
    .filter(p => p.type === "expense")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5" />
              Recurring Transactions
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal">Auto-Detect</span>
              <Switch
                checked={autoDetect}
                onCheckedChange={setAutoDetect}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Detected Patterns</p>
              <p className="text-2xl font-bold">{patterns.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Income</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalRecurringIncome.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalRecurringExpenses.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Recurring</p>
              <p className={`text-2xl font-bold ${
                totalRecurringIncome - totalRecurringExpenses >= 0 ? "text-green-600" : "text-red-600"
              }`}>
                ${(totalRecurringIncome - totalRecurringExpenses).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detected Patterns */}
      {patterns.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Detected Recurring Patterns</h3>
          
          {patterns.map((pattern, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{pattern.vendorName}</h4>
                      <Badge variant={pattern.type === "income" ? "default" : "destructive"}>
                        {pattern.type}
                      </Badge>
                      <Badge variant="secondary">
                        {pattern.frequency}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">
                          ${pattern.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Occurrences</p>
                        <p className="font-medium">{pattern.occurrences} times</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Payment</p>
                        <p className="font-medium">
                          {new Date(pattern.lastDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Expected</p>
                        <p className="font-medium">
                          {new Date(pattern.nextExpectedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <Badge 
                          variant={
                            pattern.confidence >= 80 ? "default" : 
                            pattern.confidence >= 60 ? "secondary" : "outline"
                          }
                        >
                          {pattern.confidence.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => confirmRecurring(pattern)}
                      className="gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dismissPattern(pattern)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No recurring patterns detected yet. As you add more transactions, patterns will be automatically identified.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={detectRecurringPatterns} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Re-scan Transactions
        </Button>
      </div>
    </div>
  );
}
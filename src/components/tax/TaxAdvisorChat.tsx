import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function TaxAdvisorChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm John, your AI tax advisor. I'm trained on IRS Publication 334 and have access to your transaction data. I can help you understand business deductions, categorize expenses, and answer tax-related questions. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);

  // Fetch user's transaction data on mount
  useEffect(() => {
    if (user) {
      fetchTransactionData();
    }
  }, [user]);

  const fetchTransactionData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select(`
          *,
          categories (
            name,
            type,
            is_tax_deductible,
            irs_category_code
          )
        `)
        .eq("user_id", user?.id)
        .gte("transaction_date", `${currentYear}-01-01`)
        .order("transaction_date", { ascending: false });

      if (error) throw error;

      // Calculate summary
      const summary = {
        totalTransactions: transactions?.length || 0,
        totalIncome: transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        totalExpenses: transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        deductibleExpenses: transactions?.filter(t => t.type === 'expense' && t.categories?.is_tax_deductible).reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        categories: transactions?.reduce((acc, t) => {
          const catName = t.categories?.name || 'Uncategorized';
          if (!acc[catName]) {
            acc[catName] = { count: 0, total: 0, deductible: t.categories?.is_tax_deductible || false };
          }
          acc[catName].count++;
          acc[catName].total += Number(t.amount);
          return acc;
        }, {} as Record<string, any>)
      };

      setTransactionData(summary);
    } catch (error) {
      console.error("Error fetching transaction data:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("tax-advisor", {
        body: { 
          message: userMessage,
          transactionData: transactionData 
        },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response from John",
        variant: "destructive",
      });
      
      // Remove the user message if request failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Chat with John
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your AI tax advisor with access to your {transactionData?.totalTransactions || 0} transactions
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <div className="rounded-lg p-3 bg-muted">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !loading && sendMessage()}
            placeholder="Ask about tax deductions, business expenses..."
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

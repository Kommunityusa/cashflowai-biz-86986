import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User, Calculator, CheckCircle, AlertCircle, TrendingUp, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DoubleEntryBookkeeping() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Back to Blog */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/blog")}
            className="mb-8 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Button>

          {/* Article Header */}
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Advanced Techniques</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Double-Entry Bookkeeping: Why It's Essential for Business Growth
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Michael Chen</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>January 22, 2025</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>6 min read</span>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div className="text-xl text-muted-foreground mb-8">
              While single-entry bookkeeping might seem simpler, double-entry bookkeeping has been the gold standard of accounting for over 500 years. This time-tested system provides unparalleled accuracy, fraud detection, and financial insights that can drive your business forward.
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-6">Understanding Double-Entry Bookkeeping</h2>
            
            <p className="text-muted-foreground mb-6">
              Double-entry bookkeeping is based on a simple but powerful principle: every financial transaction affects at least two accounts. For every debit entry, there must be an equal and opposite credit entry. This creates a self-balancing system that makes errors immediately apparent.
            </p>

            <Card className="my-8 bg-gradient-subtle border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">The Accounting Equation</h3>
                <div className="bg-background rounded-lg p-4 text-center">
                  <p className="text-xl font-mono font-semibold text-primary">
                    Assets = Liabilities + Equity
                  </p>
                </div>
                <p className="text-muted-foreground mt-4">
                  This fundamental equation must always balance in double-entry bookkeeping, providing a constant check on the accuracy of your records.
                </p>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mt-12 mb-6">How Double-Entry Bookkeeping Works</h2>

            <p className="text-muted-foreground mb-6">
              Let's walk through a simple example to illustrate the concept:
            </p>

            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Example: Purchasing Office Supplies with Cash</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-subtle rounded-lg">
                    <div>
                      <p className="font-semibold text-sm mb-1">Debit</p>
                      <p className="text-muted-foreground">Office Supplies: +$500</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1">Credit</p>
                      <p className="text-muted-foreground">Cash: -$500</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your office supplies (asset) increase while your cash (asset) decreases by the same amount. The total assets remain unchanged, maintaining the balance.
                  </p>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mt-12 mb-6">Key Benefits of Double-Entry Bookkeeping</h2>

            <div className="grid gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">1. Error Detection and Prevention</h3>
                      <p className="text-muted-foreground">
                        The self-balancing nature of double-entry bookkeeping makes it nearly impossible for errors to go unnoticed. If your books don't balance, you know immediately that something needs correction.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">2. Complete Financial Picture</h3>
                      <p className="text-muted-foreground">
                        Unlike single-entry bookkeeping, which only tracks cash flow, double-entry provides a comprehensive view of your assets, liabilities, equity, revenue, and expenses.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">3. Fraud Protection</h3>
                      <p className="text-muted-foreground">
                        The requirement for balanced entries creates an audit trail that makes it much harder to hide fraudulent transactions or embezzlement.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">4. Financial Statement Generation</h3>
                      <p className="text-muted-foreground">
                        Double-entry bookkeeping naturally generates the data needed for all major financial statements: balance sheet, income statement, and cash flow statement.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-6">The Five Types of Accounts</h2>

            <p className="text-muted-foreground mb-6">
              In double-entry bookkeeping, every transaction is recorded in one of five account types:
            </p>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-gradient-subtle rounded-lg">
                <h3 className="font-semibold mb-2">1. Assets</h3>
                <p className="text-sm text-muted-foreground">What your business owns (cash, inventory, equipment, accounts receivable)</p>
                <p className="text-sm font-mono mt-2">Debit increases | Credit decreases</p>
              </div>

              <div className="p-4 bg-gradient-subtle rounded-lg">
                <h3 className="font-semibold mb-2">2. Liabilities</h3>
                <p className="text-sm text-muted-foreground">What your business owes (loans, accounts payable, taxes payable)</p>
                <p className="text-sm font-mono mt-2">Credit increases | Debit decreases</p>
              </div>

              <div className="p-4 bg-gradient-subtle rounded-lg">
                <h3 className="font-semibold mb-2">3. Equity</h3>
                <p className="text-sm text-muted-foreground">Owner's investment and retained earnings</p>
                <p className="text-sm font-mono mt-2">Credit increases | Debit decreases</p>
              </div>

              <div className="p-4 bg-gradient-subtle rounded-lg">
                <h3 className="font-semibold mb-2">4. Revenue</h3>
                <p className="text-sm text-muted-foreground">Income from sales and services</p>
                <p className="text-sm font-mono mt-2">Credit increases | Debit decreases</p>
              </div>

              <div className="p-4 bg-gradient-subtle rounded-lg">
                <h3 className="font-semibold mb-2">5. Expenses</h3>
                <p className="text-sm text-muted-foreground">Costs of running your business</p>
                <p className="text-sm font-mono mt-2">Debit increases | Credit decreases</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-6">Common Double-Entry Transactions</h2>

            <div className="space-y-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Making a Sale on Credit</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Debit: Accounts Receivable ↑</div>
                    <div>Credit: Sales Revenue ↑</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Paying Employee Salaries</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Debit: Salary Expense ↑</div>
                    <div>Credit: Cash ↓</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Taking Out a Business Loan</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Debit: Cash ↑</div>
                    <div>Credit: Loan Payable ↑</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Owner Investment</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Debit: Cash ↑</div>
                    <div>Credit: Owner's Equity ↑</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-6">Implementing Double-Entry in Your Business</h2>

            <Card className="mb-8 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold mb-2">Pro Tip</p>
                    <p className="text-muted-foreground">
                      While double-entry bookkeeping provides superior accuracy and insights, it can be complex to implement manually. Modern accounting software automates the double-entry process, ensuring accuracy without requiring you to understand every debit and credit.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Step 1: Set Up Your Chart of Accounts</h3>
                <p className="text-muted-foreground">
                  Create a comprehensive list of all accounts you'll need, organized by the five account types. Be specific enough to track important details but not so granular that bookkeeping becomes overwhelming.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 2: Record Opening Balances</h3>
                <p className="text-muted-foreground">
                  If you're switching from another system, record all current asset, liability, and equity balances. These opening entries establish your starting point.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 3: Document Every Transaction</h3>
                <p className="text-muted-foreground">
                  Record each business transaction with its corresponding debits and credits. Remember: total debits must always equal total credits.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 4: Reconcile Regularly</h3>
                <p className="text-muted-foreground">
                  Compare your books to bank statements and other external records monthly. This catches errors early and maintains accuracy.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 5: Generate Financial Reports</h3>
                <p className="text-muted-foreground">
                  Use your double-entry data to create balance sheets, income statements, and cash flow statements. These reports provide the insights needed for strategic decision-making.
                </p>
              </div>
            </div>

            <Card className="my-12 bg-gradient-subtle border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Ready to Upgrade Your Bookkeeping?</h3>
                <p className="text-muted-foreground mb-6">
                  Double-entry bookkeeping doesn't have to be complicated. Cash Flow AI automatically applies double-entry principles to every transaction, giving you professional-grade accuracy without the complexity.
                </p>
                <Button 
                  variant="gradient" 
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="w-full sm:w-auto"
                >
                  Start Your Free Trial
                </Button>
              </CardContent>
            </Card>

            <div className="border-t pt-8 mt-12">
              <p className="text-sm text-muted-foreground text-center">
                Transform your bookkeeping with AI-powered automation.{" "}
                <button 
                  onClick={() => navigate("/")}
                  className="text-primary hover:underline"
                >
                  Learn more about Cash Flow AI
                </button>
                {" "}and how it can simplify double-entry bookkeeping for your business.
              </p>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
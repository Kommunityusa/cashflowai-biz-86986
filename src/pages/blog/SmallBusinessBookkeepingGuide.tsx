import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User, BookOpen, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SmallBusinessBookkeepingGuide() {
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
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Bookkeeping Basics</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              The Ultimate Guide to Small Business Bookkeeping
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Sarah Johnson</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>January 15, 2025</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>8 min read</span>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div className="text-xl text-muted-foreground mb-8">
              Running a small business is challenging enough without the added complexity of managing your books. Yet, proper bookkeeping is the foundation of business success. This comprehensive guide will walk you through everything you need to know to master small business bookkeeping.
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-6">What Is Bookkeeping and Why Does It Matter?</h2>
            
            <p className="text-muted-foreground mb-6">
              Bookkeeping is the systematic recording, organizing, and tracking of your business's financial transactions. It's the backbone of your financial management system, providing the data you need to make informed business decisions, comply with tax requirements, and understand your company's financial health.
            </p>

            <Card className="my-8 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold mb-2">Key Insight</p>
                    <p className="text-muted-foreground">
                      According to the U.S. Bank, 82% of small businesses fail due to cash flow problems. Proper bookkeeping helps you spot cash flow issues before they become critical.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mt-12 mb-6">Essential Components of Small Business Bookkeeping</h2>

            <div className="space-y-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    1. Chart of Accounts
                  </h3>
                  <p className="text-muted-foreground">
                    Your chart of accounts is a complete listing of every account in your general ledger. It's organized into five main categories: assets, liabilities, equity, revenue, and expenses. This structure helps you categorize every transaction consistently.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    2. General Ledger
                  </h3>
                  <p className="text-muted-foreground">
                    The general ledger is your business's complete record of all financial transactions. It's where debits and credits are recorded, providing a comprehensive view of your financial activity over time.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    3. Financial Statements
                  </h3>
                  <p className="text-muted-foreground">
                    Your bookkeeping system should generate three critical financial statements: the income statement (profit & loss), balance sheet, and cash flow statement. These documents provide snapshots of your business's financial health from different perspectives.
                  </p>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-6">Best Practices for Small Business Bookkeeping</h2>

            <div className="bg-gradient-subtle rounded-2xl p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4">1. Keep Business and Personal Finances Separate</h3>
              <p className="text-muted-foreground mb-4">
                Open dedicated business bank accounts and credit cards. This separation makes bookkeeping simpler, ensures accurate tax reporting, and provides legal protection for your personal assets.
              </p>

              <h3 className="text-xl font-semibold mb-4">2. Choose the Right Accounting Method</h3>
              <p className="text-muted-foreground mb-4">
                Most small businesses use either cash or accrual accounting. Cash accounting records transactions when money changes hands, while accrual accounting records them when they're earned or incurred. Choose based on your business needs and tax requirements.
              </p>

              <h3 className="text-xl font-semibold mb-4">3. Stay Consistent with Categories</h3>
              <p className="text-muted-foreground mb-4">
                Develop a consistent system for categorizing expenses and stick to it. This consistency makes it easier to track spending patterns, prepare tax returns, and generate meaningful financial reports.
              </p>

              <h3 className="text-xl font-semibold mb-4">4. Reconcile Accounts Regularly</h3>
              <p className="text-muted-foreground">
                Monthly bank reconciliation ensures your books match your bank statements. This practice helps catch errors, prevent fraud, and maintain accurate financial records.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-6">Common Bookkeeping Mistakes to Avoid</h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">Procrastinating on data entry</p>
                  <p className="text-sm text-muted-foreground">Falling behind on bookkeeping makes it harder to catch errors and understand your current financial position.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">Not keeping receipts and documentation</p>
                  <p className="text-sm text-muted-foreground">The IRS requires supporting documentation for business expenses. Digital copies are acceptable and easier to organize.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">Mixing tax-deductible and non-deductible expenses</p>
                  <p className="text-sm text-muted-foreground">Properly categorizing expenses ensures you claim all legitimate deductions while staying compliant with tax laws.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">Ignoring small transactions</p>
                  <p className="text-sm text-muted-foreground">Small expenses add up quickly. Track everything to get an accurate picture of your business finances.</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-6">Leveraging Technology for Better Bookkeeping</h2>

            <p className="text-muted-foreground mb-6">
              Modern bookkeeping software can automate many tedious tasks, reducing errors and saving time. Look for solutions that offer:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-semibold">Bank Integration</p>
                  <p className="text-sm text-muted-foreground">Automatic transaction import and categorization</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-semibold">Receipt Scanning</p>
                  <p className="text-sm text-muted-foreground">Digital receipt storage and data extraction</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-semibold">Real-time Reporting</p>
                  <p className="text-sm text-muted-foreground">Instant access to financial statements and insights</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-semibold">Tax Preparation Features</p>
                  <p className="text-sm text-muted-foreground">Organized reports for your accountant or tax software</p>
                </div>
              </div>
            </div>

            <Card className="my-12 bg-gradient-subtle border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Take Action Today</h3>
                <p className="text-muted-foreground mb-6">
                  Good bookkeeping isn't just about compliance—it's about understanding your business deeply enough to make it thrive. Start implementing these practices today, and consider using automated tools like Cash Flow AI to streamline your bookkeeping process.
                </p>
                <Button 
                  variant="gradient" 
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="w-full sm:w-auto"
                >
                  Try Cash Flow AI Free
                </Button>
              </CardContent>
            </Card>

            <div className="border-t pt-8 mt-12">
              <p className="text-sm text-muted-foreground text-center">
                Want to automate your bookkeeping? Cash Flow AI uses artificial intelligence to categorize transactions, generate reports, and provide real-time financial insights.{" "}
                <button 
                  onClick={() => navigate("/auth")}
                  className="text-primary hover:underline"
                >
                  Start your free trial today
                </button>
                .
              </p>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
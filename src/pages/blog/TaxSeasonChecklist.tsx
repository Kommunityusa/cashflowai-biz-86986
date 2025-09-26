import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, User, FileText, CheckCircle, AlertCircle, Download, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function TaxSeasonChecklist() {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (item: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(item)) {
      newChecked.delete(item);
    } else {
      newChecked.add(item);
    }
    setCheckedItems(newChecked);
  };

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
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Tax Preparation</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Tax Season Preparation: A Bookkeeper's Checklist
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Emily Rodriguez</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>January 26, 2025</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>10 min read</span>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div className="text-xl text-muted-foreground mb-8">
              Tax season doesn't have to be stressful. With proper preparation and organization throughout the year, you can make the filing process smooth and even uncover opportunities for tax savings. This comprehensive checklist will ensure you're ready when tax time arrives.
            </div>

            <Card className="my-8 bg-gradient-subtle border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold mb-2">Important Note</p>
                    <p className="text-muted-foreground">
                      This guide covers general tax preparation principles. Tax laws vary by jurisdiction and change frequently. Always consult with a qualified tax professional for advice specific to your situation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mt-12 mb-6">The Year-Round Approach to Tax Preparation</h2>
            
            <p className="text-muted-foreground mb-6">
              The secret to stress-free tax filing isn't cramming in March—it's maintaining organized records throughout the year. By implementing these practices, you'll not only simplify tax preparation but also gain better insights into your business's financial health.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-6">Essential Documents Checklist</h2>

            <div className="space-y-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Income Documentation
                  </h3>
                  <div className="space-y-3">
                    {[
                      "1099 forms from all clients/platforms",
                      "W-2 forms (if applicable)",
                      "Bank statements showing all deposits",
                      "Payment processor reports (PayPal, Stripe, Square)",
                      "Cash receipt logs",
                      "Cryptocurrency transaction records"
                    ].map((item) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkedItems.has(item)}
                          onChange={() => toggleCheck(item)}
                          className="rounded border-border"
                        />
                        <span className={checkedItems.has(item) ? "line-through text-muted-foreground" : ""}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Expense Documentation
                  </h3>
                  <div className="space-y-3">
                    {[
                      "Receipts for all business purchases",
                      "Credit card statements",
                      "Mileage logs for vehicle use",
                      "Home office expense records",
                      "Professional service invoices",
                      "Insurance premium statements",
                      "Loan interest statements",
                      "Equipment purchase receipts"
                    ].map((item) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkedItems.has(item)}
                          onChange={() => toggleCheck(item)}
                          className="rounded border-border"
                        />
                        <span className={checkedItems.has(item) ? "line-through text-muted-foreground" : ""}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-6">Month-by-Month Tax Preparation Timeline</h2>

            <div className="space-y-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">January - February</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>Gather all tax forms (W-2s, 1099s, etc.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>Complete year-end bank reconciliations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>Review and categorize all previous year transactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>Calculate total income and expenses</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">March</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>Meet with tax professional (if using one)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>Review tax return drafts carefully</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>Make IRA contributions if eligible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>File business tax returns (March 15 for partnerships/S-corps)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">April</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>File individual tax returns (April 15 deadline)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>Make first quarter estimated tax payment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>File extension if needed (Form 4868)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                      <span>Store copies of filed returns securely</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-6">Common Tax Deductions for Small Businesses</h2>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-gradient-subtle rounded-lg">
                <h4 className="font-semibold mb-2">Office & Equipment</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Home office deduction</li>
                  <li>• Computer equipment</li>
                  <li>• Office supplies</li>
                  <li>• Software subscriptions</li>
                </ul>
              </div>

              <div className="p-4 bg-gradient-subtle rounded-lg">
                <h4 className="font-semibold mb-2">Professional Services</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Accounting fees</li>
                  <li>• Legal consultations</li>
                  <li>• Business coaching</li>
                  <li>• Marketing services</li>
                </ul>
              </div>

              <div className="p-4 bg-gradient-subtle rounded-lg">
                <h4 className="font-semibold mb-2">Travel & Vehicle</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Business mileage</li>
                  <li>• Parking & tolls</li>
                  <li>• Business travel expenses</li>
                  <li>• Vehicle maintenance</li>
                </ul>
              </div>

              <div className="p-4 bg-gradient-subtle rounded-lg">
                <h4 className="font-semibold mb-2">Education & Development</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Professional development courses</li>
                  <li>• Industry conferences</li>
                  <li>• Business books</li>
                  <li>• Trade publications</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-6">Record-Keeping Best Practices</h2>

            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Digital Documentation</h4>
                    <p className="text-muted-foreground">
                      Scan and store all receipts digitally. The IRS accepts electronic records, and they're easier to organize and search. Use cloud storage for backup and accessibility.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Separate Business and Personal</h4>
                    <p className="text-muted-foreground">
                      Maintain separate bank accounts and credit cards for business transactions. This simplifies bookkeeping and strengthens your position in case of an audit.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Document Business Purpose</h4>
                    <p className="text-muted-foreground">
                      For meals, entertainment, and travel expenses, note the business purpose, attendees, and topics discussed. This documentation is crucial for IRS compliance.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Retention Period</h4>
                    <p className="text-muted-foreground">
                      Keep tax returns and supporting documents for at least 7 years. Some documents, like property records, should be kept indefinitely.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mt-12 mb-6">Quarterly Tax Obligations</h2>

            <p className="text-muted-foreground mb-6">
              If you're self-employed or have significant non-wage income, you'll need to make quarterly estimated tax payments. Missing these can result in penalties.
            </p>

            <Card className="mb-8 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">2025 Estimated Tax Due Dates</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex justify-between p-3 bg-gradient-subtle rounded">
                    <span>Q1 (Jan 1 - Mar 31)</span>
                    <span className="font-semibold">April 15, 2025</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gradient-subtle rounded">
                    <span>Q2 (Apr 1 - May 31)</span>
                    <span className="font-semibold">June 16, 2025</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gradient-subtle rounded">
                    <span>Q3 (Jun 1 - Aug 31)</span>
                    <span className="font-semibold">September 15, 2025</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gradient-subtle rounded">
                    <span>Q4 (Sep 1 - Dec 31)</span>
                    <span className="font-semibold">January 15, 2026</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mt-12 mb-6">Red Flags to Avoid</h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">Excessive home office deduction</p>
                  <p className="text-sm text-muted-foreground">Only deduct the actual percentage of your home used exclusively for business.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">100% vehicle business use</p>
                  <p className="text-sm text-muted-foreground">Unless it's a dedicated business vehicle, claiming 100% business use raises audit flags.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">Round numbers everywhere</p>
                  <p className="text-sm text-muted-foreground">Exact amounts like $500, $1,000 repeatedly appearing looks suspicious.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-full bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">Hobby losses</p>
                  <p className="text-sm text-muted-foreground">Claiming losses year after year without profit intent can trigger scrutiny.</p>
                </div>
              </div>
            </div>

            <Card className="my-12 bg-gradient-subtle border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Simplify Your Tax Preparation</h3>
                <p className="text-muted-foreground mb-6">
                  With Cash Flow AI, tax preparation becomes effortless. Our platform automatically categorizes transactions, tracks deductions, and generates tax-ready reports throughout the year. No more scrambling in April!
                </p>
                <div className="flex gap-4">
                  <Button 
                    variant="gradient" 
                    size="lg"
                    onClick={() => navigate("/auth")}
                  >
                    Start Free Trial
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Checklist
                  </Button>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold mt-12 mb-6">Final Tips for Success</h2>

            <div className="space-y-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-2">Start Early</h4>
                  <p className="text-muted-foreground">
                    Don't wait until March to begin tax preparation. Starting in January gives you time to gather documents, address issues, and potentially make tax-saving moves.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-2">Work with Professionals</h4>
                  <p className="text-muted-foreground">
                    A good accountant or tax preparer can save you more than their fee through legitimate deductions and tax strategies you might miss.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-2">Learn from Each Year</h4>
                  <p className="text-muted-foreground">
                    After filing, review your return to understand where your money went and identify opportunities for better tax planning next year.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="border-t pt-8 mt-12">
              <p className="text-sm text-muted-foreground text-center">
                Make tax season stress-free with automated bookkeeping.{" "}
                <button 
                  onClick={() => navigate("/")}
                  className="text-primary hover:underline"
                >
                  Discover how Cash Flow AI
                </button>
                {" "}keeps you tax-ready all year long.
              </p>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
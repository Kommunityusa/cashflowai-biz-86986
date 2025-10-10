import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Lightbulb,
  CheckCircle,
  ArrowRight,
  DollarSign,
  ChartBar,
  Building,
  Rocket
} from "lucide-react";

export default function Investors() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Transforming Small Business Finance
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Join us in revolutionizing how small businesses manage finances and access funding through AI-powered bookkeeping
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <div className="bg-card p-4 rounded-lg border">
                <p className="text-3xl font-bold text-primary">$850K</p>
                <p className="text-sm text-muted-foreground">Raising</p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <p className="text-3xl font-bold text-primary">Pre-Revenue</p>
                <p className="text-sm text-muted-foreground">Stage</p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <p className="text-3xl font-bold text-primary">$50B+</p>
                <p className="text-sm text-muted-foreground">Market Size</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Lightbulb className="h-8 w-8 text-primary" />
                The Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">
                82% of small businesses fail due to cash flow problems, yet most lack the tools and expertise to manage their finances effectively.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Complex Bookkeeping</h4>
                  <p className="text-sm text-muted-foreground">
                    Manual processes prone to errors, consuming 120+ hours annually
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Limited Funding Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Poor financial records prevent 40% of businesses from qualifying for loans
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">No Real-Time Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    Decisions made on outdated data, missing critical opportunities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Target className="h-8 w-8 text-primary" />
                Our Solution
              </CardTitle>
              <CardDescription className="text-lg">
                AI-powered bookkeeping that prepares businesses for funding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Automated Bank Reconciliation</h4>
                      <p className="text-sm text-muted-foreground">
                        Real-time transaction syncing with AI-powered insights achieving 95% accuracy
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Funding Readiness Score</h4>
                      <p className="text-sm text-muted-foreground">
                        Proprietary algorithm assesses financial health and loan eligibility
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">One-Click Financial Reports</h4>
                      <p className="text-sm text-muted-foreground">
                        Generate lender-ready P&L, balance sheets, and cash flow statements instantly
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">AI Financial Advisor</h4>
                      <p className="text-sm text-muted-foreground">
                        24/7 guidance on cash flow optimization and funding opportunities
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Lender Marketplace</h4>
                      <p className="text-sm text-muted-foreground">
                        Direct connections to 50+ verified lenders with pre-qualification
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Tax Optimization</h4>
                      <p className="text-sm text-muted-foreground">
                        Automated deduction tracking saves businesses average $5,000 annually
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Market Size Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <ChartBar className="h-8 w-8 text-primary" />
                Market Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary mb-2">$52.5B</p>
                  <p className="font-semibold mb-1">Total Addressable Market</p>
                  <p className="text-sm text-muted-foreground">
                    US small business accounting software market by 2028
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary mb-2">33M</p>
                  <p className="font-semibold mb-1">Small Businesses</p>
                  <p className="text-sm text-muted-foreground">
                    In the US requiring bookkeeping and financial services
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary mb-2">18.7%</p>
                  <p className="font-semibold mb-1">Annual Growth</p>
                  <p className="text-sm text-muted-foreground">
                    CAGR in AI-powered financial software adoption
                  </p>
                </div>
              </div>
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Serviceable Available Market</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Initially targeting 2.5M small businesses actively seeking funding (SAM: $4.2B)
                </p>
                <Progress value={8} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">$4.2B SAM / $52.5B TAM</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Revenue Projections */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-primary" />
                Revenue Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-4">Revenue Streams</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span>Starter Plan</span>
                      <span className="font-semibold">$10/mo</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span>Professional Plan</span>
                      <span className="font-semibold">$15/mo</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span>Business Plan</span>
                      <span className="font-semibold">$25/mo</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span>Lender Referral Fees</span>
                      <span className="font-semibold">2-4% commission</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">5-Year Projections</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Year 1</span>
                      <span className="font-bold text-primary">$850K</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Year 2</span>
                      <span className="font-bold text-primary">$3.2M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Year 3</span>
                      <span className="font-bold text-primary">$8.5M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Year 4</span>
                      <span className="font-bold text-primary">$18M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Year 5</span>
                      <span className="font-bold text-primary text-lg">$32M</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-success/10 rounded-lg">
                    <p className="text-sm">
                      <span className="font-semibold text-success">Path to Profitability:</span> Month 18
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Go-to-Market Strategy */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Rocket className="h-8 w-8 text-primary" />
                Go-to-Market Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-2">Phase 1: Foundation</h4>
                    <p className="text-sm text-muted-foreground mb-2">Months 1-6</p>
                    <ul className="text-sm space-y-1">
                      <li>• Beta launch with 100 businesses</li>
                      <li>• Partnership with 5 lenders</li>
                      <li>• Product-market fit validation</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-2">Phase 2: Growth</h4>
                    <p className="text-sm text-muted-foreground mb-2">Months 7-12</p>
                    <ul className="text-sm space-y-1">
                      <li>• Scale to 1,000 customers</li>
                      <li>• Launch affiliate program</li>
                      <li>• Integrate with major banks</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-2">Phase 3: Scale</h4>
                    <p className="text-sm text-muted-foreground mb-2">Year 2+</p>
                    <ul className="text-sm space-y-1">
                      <li>• 10,000+ active users</li>
                      <li>• Enterprise partnerships</li>
                      <li>• International expansion</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Customer Acquisition</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Content marketing & SEO (40% of leads)</li>
                    <li>• Lender partnerships & referrals (30%)</li>
                    <li>• Social media & paid ads (20%)</li>
                    <li>• Accounting firm partnerships (10%)</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Key Metrics</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• CAC: $125 → LTV: $2,800</li>
                    <li>• Monthly churn: &lt;5%</li>
                    <li>• NPS Score target: 70+</li>
                    <li>• Payback period: 6 months</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Founding Team */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Founding Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-muted-foreground">
                  Building the future of small business finance with experienced leadership in fintech, banking, and AI technology.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Competitive Analysis */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Building className="h-8 w-8 text-primary" />
                Competitive Landscape
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-semibold">Feature</th>
                      <th className="text-center py-3 px-2">Cash Flow AI</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">QuickBooks</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">Xero</th>
                      <th className="text-center py-3 px-2 text-muted-foreground">Wave</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-2">AI-Powered Insights</td>
                      <td className="text-center"><CheckCircle className="h-5 w-5 text-success mx-auto" /></td>
                      <td className="text-center text-muted-foreground">Limited</td>
                      <td className="text-center text-muted-foreground">Basic</td>
                      <td className="text-center text-muted-foreground">No</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-2">Funding Readiness Score</td>
                      <td className="text-center"><CheckCircle className="h-5 w-5 text-success mx-auto" /></td>
                      <td className="text-center text-muted-foreground">No</td>
                      <td className="text-center text-muted-foreground">No</td>
                      <td className="text-center text-muted-foreground">No</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-2">Lender Marketplace</td>
                      <td className="text-center"><CheckCircle className="h-5 w-5 text-success mx-auto" /></td>
                      <td className="text-center text-muted-foreground">Partner Only</td>
                      <td className="text-center text-muted-foreground">No</td>
                      <td className="text-center text-muted-foreground">No</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-2">AI Financial Advisor</td>
                      <td className="text-center"><CheckCircle className="h-5 w-5 text-success mx-auto" /></td>
                      <td className="text-center text-muted-foreground">No</td>
                      <td className="text-center text-muted-foreground">No</td>
                      <td className="text-center text-muted-foreground">No</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-2">Starting Price</td>
                      <td className="text-center font-semibold text-primary">$10/mo</td>
                      <td className="text-center text-muted-foreground">$30/mo</td>
                      <td className="text-center text-muted-foreground">$15/mo</td>
                      <td className="text-center text-muted-foreground">Free/$16/mo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-2">Our Competitive Advantage</h4>
                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm font-medium mb-1">🎯 Funding-First Approach</p>
                    <p className="text-xs text-muted-foreground">
                      Only platform designed specifically to prepare businesses for funding
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">🤖 Advanced AI Integration</p>
                    <p className="text-xs text-muted-foreground">
                      95% accuracy in categorization, predictive cash flow analysis
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">🏦 Direct Lender Connections</p>
                    <p className="text-xs text-muted-foreground">
                      Pre-qualified matches with 50+ verified lenders
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">📊 Real-Time Insights</p>
                    <p className="text-xs text-muted-foreground">
                      Instant financial health monitoring and alerts
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Join Us in Building the Future of Small Business Finance
          </h2>
          <div className="bg-card p-8 rounded-xl border shadow-elegant mb-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-4xl font-bold text-primary mb-2">$850,000</p>
                <p className="font-semibold">Seed Round</p>
                <p className="text-sm text-muted-foreground">Pre-revenue valuation: $4M</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary mb-2">Use of Funds</p>
                <ul className="text-sm text-left space-y-1">
                  <li>• Product development (40%)</li>
                  <li>• Customer acquisition (30%)</li>
                  <li>• Team expansion (20%)</li>
                  <li>• Operations (10%)</li>
                </ul>
              </div>
            </div>
            <div className="p-4 bg-success/10 rounded-lg mb-6">
              <p className="font-semibold text-success mb-1">Investment Highlights</p>
              <p className="text-sm">
                20x revenue multiple potential • Strong founder-market fit • Massive TAM • Clear path to profitability
              </p>
            </div>
            <Button size="lg" className="gap-2" onClick={() => window.location.href = 'mailto:investors@cashflowai.com'}>
              Schedule Investment Discussion
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            For detailed financials and investment deck, please contact{" "}
            <a href="mailto:investors@cashflowai.com" className="text-primary hover:underline">
              investors@cashflowai.com
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
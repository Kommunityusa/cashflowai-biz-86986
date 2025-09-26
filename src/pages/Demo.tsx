import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { 
  PlayCircle, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Brain,
  FileText,
  Users,
  ChevronRight,
  CheckCircle,
  Zap,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Demo = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description: "Sign up in seconds with just your email. Start with a 14-day free trial - no credit card required.",
      features: [
        "Secure authentication with Supabase",
        "Email verification for security",
        "Choose your subscription plan"
      ],
      icon: Users,
      color: "from-primary/20 to-primary/10"
    },
    {
      number: "02",
      title: "Connect Your Bank",
      description: "Securely link your bank accounts through Plaid. We support over 12,000 financial institutions.",
      features: [
        "256-bit encryption",
        "Read-only access",
        "Automatic transaction sync"
      ],
      icon: CreditCard,
      color: "from-secondary/20 to-secondary/10"
    },
    {
      number: "03",
      title: "AI Categorization",
      description: "Our AI automatically categorizes your transactions and identifies patterns in your spending.",
      features: [
        "Smart categorization",
        "Recurring transaction detection",
        "Custom rules and tags"
      ],
      icon: Brain,
      color: "from-accent/20 to-accent/10"
    },
    {
      number: "04",
      title: "Financial Insights",
      description: "Get personalized insights and recommendations to improve your financial health.",
      features: [
        "Monthly spending analysis",
        "Budget recommendations",
        "Funding readiness score"
      ],
      icon: TrendingUp,
      color: "from-primary/20 to-primary/10"
    },
    {
      number: "05",
      title: "Generate Reports",
      description: "Create professional financial reports for taxes, investors, or your own records.",
      features: [
        "Tax preparation reports",
        "P&L statements",
        "Export to PDF/CSV"
      ],
      icon: FileText,
      color: "from-secondary/20 to-secondary/10"
    }
  ];

  const videoFeatures = [
    {
      title: "Dashboard Overview",
      duration: "2:30",
      description: "Tour of the main dashboard and key metrics"
    },
    {
      title: "Transaction Management",
      duration: "3:15",
      description: "How to categorize, filter, and analyze transactions"
    },
    {
      title: "AI Features",
      duration: "4:00",
      description: "Using AI for insights and categorization"
    },
    {
      title: "Report Generation",
      duration: "2:45",
      description: "Creating and exporting financial reports"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">
              <Zap className="w-3 h-3 mr-1" />
              Interactive Demo
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              See How It Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover how our platform simplifies your financial management with AI-powered automation
            </p>
          </div>

          {/* Video Demo Section */}
          <Card className="mb-16 overflow-hidden">
            <div className="relative aspect-video bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
              <div className="text-center p-8">
                <PlayCircle className="w-20 h-20 text-primary mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-semibold mb-2">Video Walkthrough Coming Soon</h3>
                <p className="text-muted-foreground mb-6">
                  Watch a complete demonstration of all features
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {videoFeatures.map((video, index) => (
                    <div key={index} className="bg-background/80 backdrop-blur rounded-lg p-4 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{video.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {video.duration}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{video.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Step-by-Step Walkthrough */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">
              Step-by-Step Guide
            </h2>
            <div className="space-y-8">
              {steps.map((step, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-8 md:p-12">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="text-4xl font-bold text-primary/20">
                          {step.number}
                        </div>
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${step.color}`}>
                          <step.icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                      <p className="text-muted-foreground mb-6">{step.description}</p>
                      <ul className="space-y-3">
                        {step.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={`bg-gradient-to-br ${step.color} p-8 md:p-12 flex items-center justify-center`}>
                      <div className="bg-background/50 backdrop-blur rounded-lg p-8 w-full max-w-sm">
                        <div className="aspect-video bg-muted rounded flex items-center justify-center">
                          <step.icon className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-4">
                          Screenshot placeholder
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Security Section */}
          <Card className="mb-16 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="p-8 md:p-12 text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Bank-Level Security</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Your financial data is protected with enterprise-grade security measures
              </p>
              <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div>
                  <h3 className="font-semibold mb-2">256-bit Encryption</h3>
                  <p className="text-sm text-muted-foreground">
                    All data is encrypted in transit and at rest
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Read-Only Access</h3>
                  <p className="text-sm text-muted-foreground">
                    We can never move money or make changes
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">SOC 2 Compliant</h3>
                  <p className="text-sm text-muted-foreground">
                    Audited security practices and controls
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of businesses automating their finances
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/#pricing")}
              >
                View Pricing
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 14-day free trial
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Demo;
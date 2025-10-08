import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Lightbulb, Users, TrendingUp, Shield, Heart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Empowering <span className="bg-gradient-primary bg-clip-text text-transparent">Financial Clarity</span> for Every Business
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Cash Flow AI was born from a simple belief: every business owner deserves access to professional-grade bookkeeping tools without the complexity or high costs.
            </p>
          </div>

          {/* Mission & Vision Cards */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Mission Card */}
            <Card className="relative overflow-hidden border-primary/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-5 rounded-full blur-3xl"></div>
              <CardContent className="p-8 relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  To democratize financial management by providing small and medium businesses with intelligent, automated bookkeeping solutions that transform complex financial data into actionable insights.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We exist to eliminate the tedious manual work of bookkeeping, reduce errors, and give business owners the confidence to make informed financial decisions that drive growth.
                </p>
              </CardContent>
            </Card>

            {/* Vision Card */}
            <Card className="relative overflow-hidden border-primary/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-5 rounded-full blur-3xl"></div>
              <CardContent className="p-8 relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Lightbulb className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Our Vision</h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  To become the global standard for AI-powered financial management, where every business—regardless of size—has real-time visibility into their financial health.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We envision a world where bookkeeping is no longer a burden but a strategic advantage, enabling millions of entrepreneurs to focus on what they do best: building and growing their businesses.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Why Cash Flow AI Exists */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Why Cash Flow AI Exists
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                We built Cash Flow AI because we witnessed firsthand the struggles business owners face with traditional bookkeeping methods.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-destructive/10 w-fit mb-4">
                    <Users className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">The Problem</h3>
                  <p className="text-muted-foreground">
                    82% of small businesses fail due to cash flow problems. Most don't have the resources for professional bookkeepers or complex accounting software.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-warning/10 w-fit mb-4">
                    <TrendingUp className="h-6 w-6 text-warning" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">The Gap</h3>
                  <p className="text-muted-foreground">
                    Traditional bookkeeping is time-consuming, error-prone, and requires expertise many business owners don't have. This creates a dangerous blind spot in financial management.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-success/10 w-fit mb-4">
                    <Shield className="h-6 w-6 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Our Solution</h3>
                  <p className="text-muted-foreground">
                    AI-powered automation that learns your business patterns, categorizes transactions instantly, and provides real-time insights—making professional bookkeeping accessible to all.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Core Values */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Our Core Values
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                These principles guide every decision we make and every feature we build.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="p-4 rounded-2xl bg-gradient-subtle w-fit mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Simplicity First</h3>
                <p className="text-sm text-muted-foreground">
                  Complex problems deserve elegant solutions, not complicated ones.
                </p>
              </div>

              <div className="text-center">
                <div className="p-4 rounded-2xl bg-gradient-subtle w-fit mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Trust & Security</h3>
                <p className="text-sm text-muted-foreground">
                  Your financial data is sacred. We protect it with bank-level security.
                </p>
              </div>

              <div className="text-center">
                <div className="p-4 rounded-2xl bg-gradient-subtle w-fit mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Customer Success</h3>
                <p className="text-sm text-muted-foreground">
                  Your growth is our success. We're partners in your journey.
                </p>
              </div>

              <div className="text-center">
                <div className="p-4 rounded-2xl bg-gradient-subtle w-fit mx-auto mb-4">
                  <Lightbulb className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Continuous Innovation</h3>
                <p className="text-sm text-muted-foreground">
                  We constantly evolve to meet your changing business needs.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-subtle rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Bookkeeping?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of business owners who've already simplified their financial management with Cash Flow AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="gradient"
                onClick={() => navigate("/auth")}
                className="group"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/#features")}
              >
                Explore Features
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
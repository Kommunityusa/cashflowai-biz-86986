import { 
  Brain, 
  FileText, 
  Shield, 
  Zap, 
  BarChart3,
  CreditCard,
  Clock,
  Download
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Tax Categorization",
    description: "Automatically categorize transactions using IRS Publication 334 guidelines—built for PA tax compliance."
  },
  {
    icon: FileText,
    title: "Tax-Ready Reports",
    description: "Generate Schedule C-ready P&L statements, cash flow reports, and tax summaries for federal and state filings."
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description: "Bank-level encryption keeps your financial data protected and audit-ready."
  },
  {
    icon: Zap,
    title: "Real-Time Bookkeeping",
    description: "Connect your PA bank accounts and watch your books update automatically."
  },
  {
    icon: BarChart3,
    title: "PA Business Insights",
    description: "Track profitability, expenses, and cash flow with dashboards designed for Pennsylvania entrepreneurs."
  },
  {
    icon: CreditCard,
    title: "Smart Transaction Tracking",
    description: "Manual uploads, bank connections, and custom categories for construction, restaurants, retail, and more."
  },
  {
    icon: Clock,
    title: "Save 10+ Hours Weekly",
    description: "Stop doing data entry. Let AI handle the busywork while you run your PA business."
  },
  {
    icon: Download,
    title: "CPA-Ready Exports",
    description: "Export to CSV, PDF, or Excel—perfect for sharing with your Pennsylvania accountant."
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Built for{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Pennsylvania
            </span>{" "}
            Business Owners
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're running a restaurant in Philly, a construction company in Pittsburgh, or a shop in Harrisburg—get tax-ready books without the headache.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-elegant"
            >
              <div className="mb-4 p-3 bg-gradient-primary rounded-lg inline-block">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
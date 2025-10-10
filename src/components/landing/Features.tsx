import { 
  Brain, 
  Link2, 
  FileText, 
  Shield, 
  Zap, 
  BarChart3,
  CreditCard,
  Clock
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Get intelligent insights about your finances with advanced machine learning analysis."
  },
  {
    icon: Link2,
    title: "Bank Account Sync",
    description: "Connect all your business accounts securely with Plaid integration."
  },
  {
    icon: FileText,
    title: "Smart Reports",
    description: "Generate P&L statements, cash flow reports, and tax summaries instantly."
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description: "Your data is encrypted and secured with industry-leading protection."
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description: "See your financial position update as transactions flow in."
  },
  {
    icon: BarChart3,
    title: "Visual Analytics",
    description: "Understand your finances at a glance with intuitive charts and graphs."
  },
  {
    icon: CreditCard,
    title: "Expense Tracking",
    description: "Track and manage business expenses with receipt scanning and categorization."
  },
  {
    icon: Clock,
    title: "Save 10+ Hours Weekly",
    description: "Automate repetitive tasks and focus on what matters most."
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Automate
            </span>{" "}
            Your Books
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed specifically for small business owners who want to 
            save time and make smarter financial decisions.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
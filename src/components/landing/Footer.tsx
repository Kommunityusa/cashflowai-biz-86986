import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">Cash Flow AI</span>
            </div>
            <p className="text-muted-foreground text-sm">
              AI-powered bookkeeping for modern small businesses.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors text-sm">Features</a></li>
              <li><a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm">Pricing</a></li>
              <li><Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors text-sm">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#about" className="text-muted-foreground hover:text-primary transition-colors text-sm">About</a></li>
              <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors text-sm">Blog</a></li>
              <li><a href="#about" className="text-muted-foreground hover:text-primary transition-colors text-sm">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal & Security</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors text-sm">Terms of Service</Link></li>
              <li><Link to="/security" className="text-muted-foreground hover:text-primary transition-colors text-sm">Security</Link></li>
              <li><a href="mailto:support@cashflowai.com" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-muted-foreground text-sm">
            © 2024 Cash Flow AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
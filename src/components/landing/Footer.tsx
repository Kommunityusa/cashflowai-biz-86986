import { Link } from "react-router-dom";
import cashflowLogo from "@/assets/cashflow-ai-logo.png";

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img 
                src={cashflowLogo} 
                alt="Cash Flow AI" 
                className="h-10 w-10 object-contain"
              />
              <span className="font-bold text-lg text-foreground">Cash Flow AI</span>
            </div>
            <p className="text-muted-foreground text-sm">
              AI-powered bookkeeping for modern small businesses.
            </p>
            <p className="text-muted-foreground text-xs">
              A project by <a href="https://connex2.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Connex II Inc</a>, a venture studio behind{" "}
              <a href="https://kommunity.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Kommunity</a>,{" "}
              <a href="https://referredai.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ReferredAI</a>,{" "}
              <a href="https://kensingtondeals.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Kensington Deals</a>, and{" "}
              <a href="https://memocredai.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">MemoCredAI</a>.
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
              <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm">About</Link></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors text-sm">Blog</Link></li>
              <li><Link to="/investors" className="text-muted-foreground hover:text-primary transition-colors text-sm">Investors</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal & Security</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors text-sm">Terms of Service</Link></li>
              <li><Link to="/security" className="text-muted-foreground hover:text-primary transition-colors text-sm">Security</Link></li>
              <li><a href="mailto:support@cashflowai.biz" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-muted-foreground text-sm">
            © 2024 Connex II Inc. dba Cash Flow AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
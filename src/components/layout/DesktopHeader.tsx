import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  Shield, 
  LogOut,
  User
} from "lucide-react";
import { useState } from "react";
import cashflowLogo from "@/assets/cashflow-ai-logo.png";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth(false); // Don't require auth in header
  const { isAdmin } = useRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLandingPage = location.pathname === "/";

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "About", href: "#about" },
  ];

  const appNavigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Transactions", href: "/transactions" },
    { name: "Reports", href: "/reports" },
    { name: "Settings", href: "/settings" },
  ];

  const currentNav = isLandingPage ? navigation : appNavigation;

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src={cashflowLogo} 
              alt="Cash Flow AI" 
              className="h-10 w-10 object-contain"
            />
            <span className="font-bold text-xl text-foreground">Cash Flow AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isLandingPage && !user ? (
              <>
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                  </a>
                ))}
              </>
            ) : user ? (
              <>
                {appNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`transition-colors ${
                      location.pathname === item.href
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`transition-colors flex items-center gap-1 ${
                      location.pathname === '/admin'
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                )}
              </>
            ) : null}
          </div>

          {/* Desktop CTA / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isLandingPage && !user ? (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="gradient">Start Free Trial</Button>
                </Link>
              </>
            ) : user ? (
              <>
                {isAdmin && (
                  <Badge variant="outline" className="bg-primary/10">
                    Admin
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      {user.email?.split('@')[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Account</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <img src={cashflowLogo} alt="Dashboard" className="mr-2 h-4 w-4 object-contain" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <User className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {isLandingPage && !user ? (
                <>
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.name}
                    </a>
                  ))}
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="gradient" className="w-full">Start Free Trial</Button>
                  </Link>
                </>
              ) : user ? (
                <>
                  {appNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`transition-colors ${
                        location.pathname === item.href
                          ? "text-primary font-medium"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`transition-colors flex items-center gap-1 ${
                        location.pathname === '/admin'
                          ? "text-primary font-medium"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="pt-4 border-t space-y-2">
                    <div className="px-2 text-sm text-muted-foreground">
                      {user.email}
                      {isAdmin && (
                        <Badge variant="outline" className="ml-2 bg-primary/10">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
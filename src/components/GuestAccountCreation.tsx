import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, CheckCircle } from "lucide-react";

export function GuestAccountCreation({ email }: { email?: string }) {
  const [guestEmail, setGuestEmail] = useState(email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestEmail || !password) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and password",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-guest-account", {
        body: { email: guestEmail, password },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Account Created!",
        description: "Your account has been created. Signing you in...",
      });

      // Sign in the user automatically
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: guestEmail,
        password,
      });

      if (signInError) {
        toast({
          title: "Account Created",
          description: "Please sign in with your new credentials",
        });
        navigate("/auth");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Account creation error:", error);
      toast({
        title: "Account Creation Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
          <CheckCircle className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Complete Your Setup</CardTitle>
        <CardDescription>
          Create your account to access your subscription and manage your finances
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="pl-10"
                required
                disabled={!!email}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
                minLength={8}
              />
            </div>
          </div>

          <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account & Sign In"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-primary hover:underline"
            >
              Sign in here
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

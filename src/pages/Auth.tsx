import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, AlertCircle, Check, X, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Session, User } from "@supabase/supabase-js";
import { validatePassword } from "@/utils/passwordValidation";
import { Progress } from "@/components/ui/progress";
import { checkRateLimit, logLoginAttempt, logAuditEvent } from "@/utils/auditLogger";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Auth() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(validatePassword(""));
  const [showCheckoutMessage, setShowCheckoutMessage] = useState(false);

  useEffect(() => {
    // Check for checkout completion redirect
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutCompleted = urlParams.get('checkout');
    const checkoutEmail = urlParams.get('checkout_email');
    
    if (checkoutCompleted === 'completed' && checkoutEmail) {
      setEmail(decodeURIComponent(checkoutEmail));
      setShowCheckoutMessage(true);
      setMessage("Payment successful! Create your account with the same email to access your dashboard.");
    }
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect to dashboard if user is authenticated
        if (session) {
          navigate("/dashboard");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Redirect if already logged in
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    // Validate password strength
    const strength = validatePassword(password);
    if (strength.score < 3) {
      setError("Please use a stronger password. Your password should meet at least 3 of the requirements.");
      return;
    }
    
    setLoading(true);

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          email_verified: false
        }
      }
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(error.message);
      }
    } else {
      setMessage("Check your email for the confirmation link to verify your account!");
      setEmail("");
      setPassword("");
      setPasswordStrength(validatePassword(""));
    }
    
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    
    // Check rate limit before attempting login
    const rateLimitCheck = await checkRateLimit(email);
    if (rateLimitCheck.limited) {
      setError(rateLimitCheck.message || "Too many login attempts. Please try again later.");
      return;
    }
    
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let errorMessage = "Invalid email or password. Please try again.";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else {
        errorMessage = error.message;
      }
      setError(errorMessage);
      
      // Log failed login attempt
      await logLoginAttempt(email, false, errorMessage);
    } else {
      // Log successful login
      await logLoginAttempt(email, true);
      await logAuditEvent({ action: 'LOGIN' });
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });

    if (error) {
      setError(error.message);
      await logLoginAttempt('google-oauth', false, error.message);
    } else {
      await logAuditEvent({ action: 'GOOGLE_LOGIN' });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <TrendingUp className="h-8 w-8 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl text-foreground">Cash Flow AI</span>
        </Link>

        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">{t.auth.welcomeBack}</CardTitle>
            <CardDescription className="text-center">
              Manage your business finances with AI-powered insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t.common.signIn}</TabsTrigger>
                <TabsTrigger value="signup">{t.common.signUp}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t.common.email}</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t.common.password}</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    variant="gradient"
                    disabled={loading}
                  >
                    {loading ? t.common.loading : t.common.signIn}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t.auth.orContinueWith}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    {t.auth.signInGoogle}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t.common.email}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t.common.password}</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordStrength(validatePassword(e.target.value));
                        }}
                        required
                        disabled={loading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {password && (
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Password Strength:</span>
                          <span className={passwordStrength.color}>{passwordStrength.message}</span>
                        </div>
                        <Progress value={(passwordStrength.score / 5) * 100} className="h-2" />
                        
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center gap-2 text-xs">
                            {passwordStrength.requirements.minLength ? 
                              <Check className="h-3 w-3 text-green-500" /> : 
                              <X className="h-3 w-3 text-muted-foreground" />
                            }
                            <span className={passwordStrength.requirements.minLength ? "text-green-500" : "text-muted-foreground"}>
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordStrength.requirements.hasUpperCase ? 
                              <Check className="h-3 w-3 text-green-500" /> : 
                              <X className="h-3 w-3 text-muted-foreground" />
                            }
                            <span className={passwordStrength.requirements.hasUpperCase ? "text-green-500" : "text-muted-foreground"}>
                              One uppercase letter
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordStrength.requirements.hasLowerCase ? 
                              <Check className="h-3 w-3 text-green-500" /> : 
                              <X className="h-3 w-3 text-muted-foreground" />
                            }
                            <span className={passwordStrength.requirements.hasLowerCase ? "text-green-500" : "text-muted-foreground"}>
                              One lowercase letter
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordStrength.requirements.hasNumber ? 
                              <Check className="h-3 w-3 text-green-500" /> : 
                              <X className="h-3 w-3 text-muted-foreground" />
                            }
                            <span className={passwordStrength.requirements.hasNumber ? "text-green-500" : "text-muted-foreground"}>
                              One number
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {passwordStrength.requirements.hasSpecialChar ? 
                              <Check className="h-3 w-3 text-green-500" /> : 
                              <X className="h-3 w-3 text-muted-foreground" />
                            }
                            <span className={passwordStrength.requirements.hasSpecialChar ? "text-green-500" : "text-muted-foreground"}>
                              One special character
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    variant="gradient"
                    disabled={loading}
                  >
                    {loading ? t.common.loading : t.auth.createAccount}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t.auth.orContinueWith}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    {t.auth.signInGoogle}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {message && (
              <Alert className={`mt-4 ${showCheckoutMessage ? 'border-success/20 bg-success/5' : 'border-primary/20 bg-primary/5'}`}>
                <AlertDescription className={showCheckoutMessage ? 'text-success font-medium' : 'text-primary'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
            <p>{t.auth.termsAgree} {t.auth.termsOfService} and {t.auth.privacyPolicy}</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
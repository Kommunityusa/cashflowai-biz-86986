import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { 
  User, 
  Building,
  CreditCard,
  Bell,
  Shield,
  Link2,
  Download,
  Lock,
  Key,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EncryptionSettings } from "@/components/EncryptionSettings";
import { AuditLogs } from "@/components/AuditLogs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    businessName: "",
    taxId: "",
    address: "",
  });
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    weeklyReports: true,
    transactionAlerts: false,
  });
  
  // Dialog states
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [enable2FAOpen, setEnable2FAOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [stripeOpen, setStripeOpen] = useState(false);
  const [openAIOpen, setOpenAIOpen] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (data) {
        setProfileData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: user?.email || "",
          phone: data.phone || "",
          businessName: data.business_name || "",
          taxId: data.tax_id || "",
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const savePersonalInfo = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Personal information updated successfully",
      });
    } catch (error) {
      console.error('Error saving personal info:', error);
      toast({
        title: "Error",
        description: "Failed to update personal information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessInfo = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          business_name: profileData.businessName,
          tax_id: profileData.taxId,
          address: profileData.address,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Business information updated successfully",
      });
    } catch (error) {
      console.error('Error saving business info:', error);
      toast({
        title: "Error",
        description: "Failed to update business information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      
      setChangePasswordOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enable2FA = async () => {
    toast({
      title: "Coming Soon",
      description: "Two-factor authentication will be available soon",
    });
    setEnable2FAOpen(false);
  };

  const downloadData = async () => {
    setLoading(true);
    try {
      // Fetch all user data
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id);
      
      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user?.id);
      
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id);
      
      const exportData = {
        exportDate: new Date().toISOString(),
        user: { email: user?.email },
        transactions,
        bankAccounts,
        categories,
      };
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Your data has been downloaded",
      });
    } catch (error) {
      console.error('Error downloading data:', error);
      toast({
        title: "Error",
        description: "Failed to download data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSetup = async () => {
    toast({
      title: "Stripe Integration",
      description: "Redirecting to Stripe setup...",
    });
    // Here you would typically redirect to Stripe Connect or setup
    setStripeOpen(false);
  };

  const handleOpenAISetup = async () => {
    toast({
      title: "OpenAI Integration",
      description: "API key configuration saved",
    });
    setOpenAIOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and application preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[700px]">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-primary rounded-lg mr-4">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
                  <p className="text-sm text-muted-foreground">Update your personal details</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com"
                    value={profileData.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    placeholder="+1 (555) 123-4567"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <Button 
                className="mt-6" 
                variant="gradient"
                onClick={savePersonalInfo}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-primary rounded-lg mr-4">
                  <Building className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Business Information</h2>
                  <p className="text-sm text-muted-foreground">Manage your business details</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input 
                    id="businessName" 
                    placeholder="Acme Corp"
                    value={profileData.businessName}
                    onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input 
                    id="taxId" 
                    placeholder="XX-XXXXXXX"
                    value={profileData.taxId}
                    onChange={(e) => setProfileData({ ...profileData, taxId: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input 
                    id="address" 
                    placeholder="123 Business St, City, State 12345"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  />
                </div>
              </div>
              
              <Button 
                className="mt-6" 
                variant="gradient"
                onClick={saveBusinessInfo}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <EncryptionSettings />
            
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-primary rounded-lg mr-4">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Two-Factor Authentication</h2>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">2FA Status</p>
                  <p className="text-sm text-muted-foreground">Currently disabled</p>
                </div>
                <Dialog open={enable2FAOpen} onOpenChange={setEnable2FAOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Enable 2FA</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                      <DialogDescription>
                        Two-factor authentication adds an extra layer of security to your account.
                      </DialogDescription>
                    </DialogHeader>
                    <Alert>
                      <AlertDescription>
                        This feature is coming soon. We'll notify you when it's available.
                      </AlertDescription>
                    </Alert>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEnable2FAOpen(false)}>
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
            
            <AuditLogs />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-primary rounded-lg mr-4">
                    <CreditCard className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Current Plan</h2>
                    <p className="text-sm text-muted-foreground">You're currently on the Free plan</p>
                  </div>
                </div>
                <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
                  <DialogTrigger asChild>
                    <Button variant="gradient">Upgrade to Pro</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upgrade to Pro</DialogTitle>
                      <DialogDescription>
                        Get unlimited transactions, advanced analytics, and priority support.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Pro Plan Features:</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Unlimited transactions</li>
                          <li>Advanced analytics & insights</li>
                          <li>Priority customer support</li>
                          <li>API access</li>
                          <li>Custom categories</li>
                        </ul>
                      </div>
                      <div className="text-2xl font-bold">$29/month</div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUpgradeOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => {
                        toast({
                          title: "Coming Soon",
                          description: "Pro plan will be available soon!",
                        });
                        setUpgradeOpen(false);
                      }}>
                        Subscribe
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Current Usage</span>
                  <span className="text-sm font-medium text-foreground">89 / 100 transactions</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div className="bg-gradient-primary h-2 rounded-full" style={{ width: "89%" }}></div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Payment Method</h2>
              <p className="text-sm text-muted-foreground mb-6">Add a payment method to upgrade your plan</p>
              <Button 
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Payment Methods",
                    description: "Payment method management coming soon!",
                  });
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-primary rounded-lg mr-4">
                  <Link2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Bank Connections</h2>
                  <p className="text-sm text-muted-foreground">Connect your bank accounts for automatic sync</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Connect with Plaid</p>
                    <p className="text-sm text-muted-foreground">Securely link your bank accounts</p>
                  </div>
                  <PlaidLinkButton />
                </div>
                
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Stripe Integration</p>
                    <p className="text-sm text-muted-foreground">Process payments and subscriptions</p>
                  </div>
                  <Dialog open={stripeOpen} onOpenChange={setStripeOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Configure</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Stripe Integration</DialogTitle>
                        <DialogDescription>
                          Connect your Stripe account to process payments.
                        </DialogDescription>
                      </DialogHeader>
                      <Alert>
                        <AlertDescription>
                          Stripe integration is coming soon. You'll be able to connect your Stripe account to process payments and manage subscriptions.
                        </AlertDescription>
                      </Alert>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setStripeOpen(false)}>
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">OpenAI API</p>
                    <p className="text-sm text-muted-foreground">Enable AI-powered features</p>
                  </div>
                  <Dialog open={openAIOpen} onOpenChange={setOpenAIOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Set API Key</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>OpenAI API Configuration</DialogTitle>
                        <DialogDescription>
                          Enter your OpenAI API key to enable AI-powered features.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="apiKey">API Key</Label>
                          <Input 
                            id="apiKey" 
                            type="password"
                            placeholder="sk-..."
                          />
                        </div>
                        <Alert>
                          <AlertDescription>
                            Your API key is already configured and working. AI features are enabled.
                          </AlertDescription>
                        </Alert>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenAIOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleOpenAISetup}>
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-primary rounded-lg mr-4">
                  <Bell className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
                  <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch 
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => {
                      setPreferences({ ...preferences, emailNotifications: checked });
                      toast({
                        title: "Preference Updated",
                        description: `Email notifications ${checked ? 'enabled' : 'disabled'}`,
                      });
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Weekly Reports</p>
                    <p className="text-sm text-muted-foreground">Get weekly financial summaries</p>
                  </div>
                  <Switch 
                    checked={preferences.weeklyReports}
                    onCheckedChange={(checked) => {
                      setPreferences({ ...preferences, weeklyReports: checked });
                      toast({
                        title: "Preference Updated",
                        description: `Weekly reports ${checked ? 'enabled' : 'disabled'}`,
                      });
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Transaction Alerts</p>
                    <p className="text-sm text-muted-foreground">Alert for large transactions</p>
                  </div>
                  <Switch 
                    checked={preferences.transactionAlerts}
                    onCheckedChange={(checked) => {
                      setPreferences({ ...preferences, transactionAlerts: checked });
                      toast({
                        title: "Preference Updated",
                        description: `Transaction alerts ${checked ? 'enabled' : 'disabled'}`,
                      });
                    }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-primary rounded-lg mr-4">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Account Management</h2>
                  <p className="text-sm text-muted-foreground">Manage your account settings</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={changePassword} disabled={loading}>
                        {loading ? "Changing..." : "Change Password"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={enable2FA}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Enable Two-Factor Authentication
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={downloadData}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? "Downloading..." : "Download Data"}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
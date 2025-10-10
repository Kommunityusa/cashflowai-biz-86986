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
import { 
  User, 
  Building,
  CreditCard,
  Bell,
  Shield,
  Download,
  Lock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { CategoryManager } from "@/components/CategoryManager";
import { scheduleDataRetention, exportUserData } from "@/utils/dataRetention";
import { validateProfileAccess, validateProfileUpdate, encryptProfileField, decryptProfileField } from "@/utils/profileSecurity";
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
      // Initialize data retention scheduler
      scheduleDataRetention(user.id);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Validate user can access this profile
      if (!validateProfileAccess(user?.id || '', user?.id)) {
        toast({
          title: "Unauthorized access",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (data) {
        // Decrypt sensitive fields
        const decryptedTaxId = data.tax_id 
          ? await decryptProfileField(user!.id, data.tax_id)
          : '';

        setProfileData({
          firstName: (data as any).first_name || "",
          lastName: (data as any).last_name || "",
          email: user?.email || "",
          phone: (data as any).phone || "",
          businessName: (data as any).business_name || "",
          taxId: decryptedTaxId,
          address: (data as any).address || "",
        });
      }
    } catch (error) {
      console.error('Error fetching profile');
      toast({
        title: "Failed to load profile data",
        variant: "destructive"
      });
    }
  };

  const savePersonalInfo = async () => {
    setLoading(true);
    try {
      // Validate user can update this profile
      if (!validateProfileAccess(user?.id || '', user?.id)) {
        toast({
          title: "Unauthorized access",
          variant: "destructive"
        });
        return;
      }

      const updates = {
        user_id: user?.id,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone,
        updated_at: new Date().toISOString(),
      };

      // Validate updates contain only allowed fields
      if (!validateProfileUpdate(updates)) {
        toast({
          title: "Invalid profile data",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      toast({
        title: "Profile updated successfully"
      });
    } catch (error: any) {
      console.error('Error saving profile');
      toast({
        title: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessInfo = async () => {
    setLoading(true);
    try {
      // Validate user can update this profile
      if (!validateProfileAccess(user?.id || '', user?.id)) {
        toast({
          title: "Unauthorized access",
          variant: "destructive"
        });
        return;
      }

      // Encrypt tax_id before saving
      const encryptedTaxId = profileData.taxId 
        ? await encryptProfileField(user!.id, profileData.taxId)
        : null;

      const updates = {
        user_id: user?.id,
        business_name: profileData.businessName,
        tax_id: encryptedTaxId,
        address: profileData.address,
        updated_at: new Date().toISOString(),
      };

      // Validate updates contain only allowed fields
      if (!validateProfileUpdate(updates)) {
        toast({
          title: "Invalid profile data",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      toast({
        title: "Profile updated successfully"
      });
    } catch (error: any) {
      console.error('Error saving business info');
      toast({
        title: error.message || "Failed to update profile",
        variant: "destructive"
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and application preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManager />
          </TabsContent>

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

          <TabsContent value="billing" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-primary rounded-lg mr-4">
                    <CreditCard className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Subscription Management</h2>
                    <p className="text-sm text-muted-foreground">Manage your subscription and billing</p>
                  </div>
                </div>
              </div>
              
              <SubscriptionStatus />
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
                  onClick={downloadData}
                  disabled={loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? "Downloading..." : "Download Data"}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    try {
                      const exportData = await exportUserData(user?.id || '');
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `cashflow-data-export-${new Date().toISOString()}.json`;
                      a.click();
                      toast({
                        title: "Data Exported",
                        description: "Your data has been exported successfully",
                      });
                    } catch (error) {
                      toast({
                        title: "Export Failed",
                        description: "Failed to export data",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data (GDPR)
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
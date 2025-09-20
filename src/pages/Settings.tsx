import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Building,
  CreditCard,
  Bell,
  Shield,
  Link2,
  Palette,
  HelpCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and application preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="profile">Profile</TabsTrigger>
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
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+1 (555) 123-4567" />
                </div>
              </div>
              
              <Button className="mt-6" variant="gradient">Save Changes</Button>
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
                  <Input id="businessName" placeholder="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input id="taxId" placeholder="XX-XXXXXXX" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input id="address" placeholder="123 Business St, City, State 12345" />
                </div>
              </div>
              
              <Button className="mt-6" variant="gradient">Save Changes</Button>
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
                    <h2 className="text-xl font-semibold text-foreground">Current Plan</h2>
                    <p className="text-sm text-muted-foreground">You're currently on the Free plan</p>
                  </div>
                </div>
                <Button variant="gradient">Upgrade to Pro</Button>
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
              <Button variant="outline">
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
                  <Button variant="outline">Connect</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Stripe Integration</p>
                    <p className="text-sm text-muted-foreground">Process payments and subscriptions</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">OpenAI API</p>
                    <p className="text-sm text-muted-foreground">Enable AI-powered features</p>
                  </div>
                  <Button variant="outline">Set API Key</Button>
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
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Weekly Reports</p>
                    <p className="text-sm text-muted-foreground">Get weekly financial summaries</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Transaction Alerts</p>
                    <p className="text-sm text-muted-foreground">Alert for large transactions</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-primary rounded-lg mr-4">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Security</h2>
                  <p className="text-sm text-muted-foreground">Manage your security settings</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Button variant="outline">Change Password</Button>
                <Button variant="outline">Enable Two-Factor Authentication</Button>
                <Button variant="outline">Download Data</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
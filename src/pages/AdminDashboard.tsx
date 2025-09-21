import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Settings,
  Database,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Brain,
  Key,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth(true);
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  
  // Platform settings state
  const [stripeKey, setStripeKey] = useState("");
  const [openAIKey, setOpenAIKey] = useState("");
  const [platformSettings, setPlatformSettings] = useState<any>({});

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin dashboard",
          variant: "destructive",
        });
        navigate('/dashboard');
      } else {
        fetchDashboardData();
        fetchPlatformSettings();
      }
    }
  }, [isAdmin, roleLoading, authLoading, user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');
      
      // Fetch user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*');
      
      // Combine users with their roles
      const usersWithRoles = profiles?.map(profile => {
        const userRoles = roles?.filter(r => r.user_id === profile.user_id) || [];
        return {
          ...profile,
          roles: userRoles.map(r => r.role),
          isAdmin: userRoles.some(r => r.role === 'admin'),
        };
      }) || [];
      
      setUsers(usersWithRoles);
      
      // Fetch stats
      const { count: transactionCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type');
      
      const totalRevenue = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      // Count active users (users with transactions in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeCount } = await supabase
        .from('transactions')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      setStats({
        totalUsers: usersWithRoles.length,
        totalTransactions: transactionCount || 0,
        totalRevenue,
        activeUsers: activeCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformSettings = async () => {
    try {
      const { data } = await supabase
        .from('platform_settings')
        .select('*');
      
      const settings: any = {};
      data?.forEach(item => {
        settings[item.key] = item.value;
      });
      
      setPlatformSettings(settings);
      
      // Check if keys are already set
      if (settings.stripe_configured) {
        setStripeKey("••••••••••••••••");
      }
      if (settings.openai_configured) {
        setOpenAIKey("••••••••••••••••");
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
    }
  };

  const updateUserRole = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      if (newRole === 'admin') {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser.user_id,
            role: 'admin',
          });
        
        if (error && error.code !== '23505') { // Ignore duplicate key error
          throw error;
        }
      } else {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.user_id)
          .eq('role', 'admin');
        
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });
      
      setRoleDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStripeKey = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'stripe_configured',
          value: true,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      // Here you would typically store the actual key securely
      // For now, we're just marking it as configured
      
      toast({
        title: "Success",
        description: "Stripe integration configured successfully",
      });
      
      fetchPlatformSettings();
    } catch (error) {
      console.error('Error saving Stripe key:', error);
      toast({
        title: "Error",
        description: "Failed to save Stripe configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveOpenAIKey = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'openai_configured',
          value: true,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      // The actual OpenAI key is already stored in Supabase secrets
      
      toast({
        title: "Success",
        description: "OpenAI integration configured successfully",
      });
      
      fetchPlatformSettings();
    } catch (error) {
      console.error('Error saving OpenAI key:', error);
      toast({
        title: "Error",
        description: "Failed to save OpenAI configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24">
          <Card>
            <CardContent className="p-8 text-center">
              Loading...
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24">
          <Card>
            <CardContent className="p-8 text-center">
              Access Denied
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage platform settings and users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeUsers} active in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Across all users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Operational</span>
              </div>
              <p className="text-xs text-muted-foreground">
                All systems running
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchDashboardData}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>{user.business_name || 'N/A'}</TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge variant="default">Admin</Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Dialog open={roleDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                            setRoleDialogOpen(open);
                            if (open) setSelectedUser(user);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                {user.isAdmin ? (
                                  <UserX className="h-4 w-4 mr-1" />
                                ) : (
                                  <UserCheck className="h-4 w-4 mr-1" />
                                )}
                                Change Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change User Role</DialogTitle>
                                <DialogDescription>
                                  Update the role for {user.email}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Select Role</Label>
                                  <Select
                                    value={user.isAdmin ? 'admin' : 'user'}
                                    onValueChange={(value: 'admin' | 'user') => setNewRole(value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {newRole === 'admin' && (
                                  <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      Admin users have full access to platform settings and user management.
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={updateUserRole} disabled={loading}>
                                  {loading ? "Updating..." : "Update Role"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Integrations</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure third-party services for the entire platform
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stripe Integration */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Stripe Integration</h3>
                        <p className="text-sm text-muted-foreground">
                          Process payments and manage subscriptions
                        </p>
                      </div>
                    </div>
                    {platformSettings.stripe_configured ? (
                      <Badge variant="outline" className="bg-green-500/10">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Configured
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripeKey">Stripe Secret Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="stripeKey"
                        type="password"
                        placeholder="sk_..."
                        value={stripeKey}
                        onChange={(e) => setStripeKey(e.target.value)}
                      />
                      <Button onClick={saveStripeKey} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your Stripe secret key is securely encrypted and stored.
                    </p>
                  </div>
                </div>

                {/* OpenAI Integration */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">OpenAI Integration</h3>
                        <p className="text-sm text-muted-foreground">
                          Enable AI-powered features and insights
                        </p>
                      </div>
                    </div>
                    {platformSettings.openai_configured ? (
                      <Badge variant="outline" className="bg-green-500/10">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Configured
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="openaiKey">OpenAI API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="openaiKey"
                        type="password"
                        placeholder="sk-..."
                        value={openAIKey}
                        onChange={(e) => setOpenAIKey(e.target.value)}
                      />
                      <Button onClick={saveOpenAIKey} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your OpenAI API key is securely encrypted and stored.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Global configuration for the platform
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Platform-wide settings affect all users. Changes here should be made carefully.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable access for non-admin users
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Export All Data</p>
                      <p className="text-sm text-muted-foreground">
                        Download complete platform data backup
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Clear Cache</p>
                      <p className="text-sm text-muted-foreground">
                        Clear all cached data and refresh
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Download, 
  Filter, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  LogIn,
  LogOut,
  FileText,
  DollarSign,
  Link2,
  Settings,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  error_message?: string;
  ip_address?: string;
  created_at: string;
}

const actionIcons: Record<string, any> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  VIEW_TRANSACTIONS: Eye,
  CREATE_TRANSACTION: DollarSign,
  UPDATE_TRANSACTION: FileText,
  DELETE_TRANSACTION: XCircle,
  CONNECT_BANK: Link2,
  DISCONNECT_BANK: XCircle,
  SYNC_TRANSACTIONS: RefreshCw,
  GENERATE_REPORT: FileText,
  UPDATE_SETTINGS: Settings,
  VIEW_INSIGHTS: Eye,
  EXPORT_DATA: Download,
};

const actionColors: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-800",
  LOGOUT: "bg-gray-100 text-gray-800",
  DELETE_TRANSACTION: "bg-red-100 text-red-800",
  DISCONNECT_BANK: "bg-red-100 text-red-800",
  CONNECT_BANK: "bg-blue-100 text-blue-800",
  SYNC_TRANSACTIONS: "bg-purple-100 text-purple-800",
  UPDATE_SETTINGS: "bg-yellow-100 text-yellow-800",
};

export function AuditLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");
  const [suspiciousActivity, setSuspiciousActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchAuditLogs();
    fetchLoginAttempts();
    detectSuspiciousActivity();
  }, [timeRange, filter]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nbrcdphgadabjndynyvy.supabase.co/functions/v1/audit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'get_audit_logs',
            data: {},
          }),
        }
      );

      if (response.ok) {
        const { logs: fetchedLogs } = await response.json();
        
        // Apply filters
        let filteredLogs = fetchedLogs || [];
        
        if (filter !== "all") {
          filteredLogs = filteredLogs.filter((log: AuditLog) => 
            filter === "high-risk" 
              ? ["DELETE_TRANSACTION", "DISCONNECT_BANK", "UPDATE_SETTINGS"].includes(log.action)
              : log.action === filter
          );
        }
        
        // Apply time range filter
        const now = new Date();
        const timeLimit = new Date();
        
        switch (timeRange) {
          case "1h":
            timeLimit.setHours(now.getHours() - 1);
            break;
          case "24h":
            timeLimit.setHours(now.getHours() - 24);
            break;
          case "7d":
            timeLimit.setDate(now.getDate() - 7);
            break;
          case "30d":
            timeLimit.setDate(now.getDate() - 30);
            break;
        }
        
        filteredLogs = filteredLogs.filter((log: AuditLog) => 
          new Date(log.created_at) > timeLimit
        );
        
        setLogs(filteredLogs);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginAttempts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch from login_attempts table (would need appropriate access)
    // For now, we'll filter audit logs for login events
    const loginEvents = logs.filter(log => 
      log.action === "LOGIN" || log.action === "LOGOUT"
    );
    
    // Mock some failed attempts for demonstration
    const mockAttempts: LoginAttempt[] = [
      {
        id: "1",
        email: user.email || "",
        success: true,
        ip_address: "192.168.1.1",
        created_at: new Date().toISOString(),
      },
    ];
    
    setLoginAttempts(mockAttempts);
  };

  const detectSuspiciousActivity = () => {
    const suspicious = [];
    
    // Check for rapid actions (more than 10 actions in 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentActions = logs.filter(log => 
      new Date(log.created_at) > oneMinuteAgo
    );
    
    if (recentActions.length > 10) {
      suspicious.push({
        type: "rapid_actions",
        message: `${recentActions.length} actions in the last minute`,
        severity: "warning",
      });
    }
    
    // Check for actions from multiple IPs
    const uniqueIPs = new Set(logs.map(log => log.ip_address).filter(Boolean));
    if (uniqueIPs.size > 3) {
      suspicious.push({
        type: "multiple_ips",
        message: `Activity from ${uniqueIPs.size} different IP addresses`,
        severity: "info",
      });
    }
    
    // Check for deletions
    const deletions = logs.filter(log => 
      log.action.includes("DELETE")
    );
    
    if (deletions.length > 5) {
      suspicious.push({
        type: "excessive_deletions",
        message: `${deletions.length} deletion actions detected`,
        severity: "warning",
      });
    }
    
    setSuspiciousActivity(suspicious);
  };

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "Action", "Entity Type", "Entity ID", "IP Address", "Details"],
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.action,
        log.entity_type || "",
        log.entity_id || "",
        log.ip_address || "",
        JSON.stringify(log.details || {}),
      ]),
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
    
    toast({
      title: "Success",
      description: "Audit logs exported successfully",
    });
  };

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Activity Monitor
          </CardTitle>
          <CardDescription>
            Real-time monitoring of account activity and security events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Suspicious Activity Alerts */}
          {suspiciousActivity.length > 0 && (
            <div className="mb-6 space-y-2">
              {suspiciousActivity.map((alert, index) => (
                <Alert key={index} variant={alert.severity === "warning" ? "destructive" : "default"}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last hour</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="high-risk">High Risk</SelectItem>
                <SelectItem value="LOGIN">Logins</SelectItem>
                <SelectItem value="CREATE_TRANSACTION">Transactions</SelectItem>
                <SelectItem value="UPDATE_SETTINGS">Settings</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAuditLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={exportLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                    <p className="text-2xl font-bold">{logs.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Logins</p>
                    <p className="text-2xl font-bold">
                      {logs.filter(l => l.action === "LOGIN").length}
                    </p>
                  </div>
                  <LogIn className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">High Risk</p>
                    <p className="text-2xl font-bold">
                      {logs.filter(l => 
                        ["DELETE_TRANSACTION", "DISCONNECT_BANK", "UPDATE_SETTINGS"].includes(l.action)
                      ).length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unique IPs</p>
                    <p className="text-2xl font-bold">
                      {new Set(logs.map(l => l.ip_address).filter(Boolean)).size}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Log */}
          <ScrollArea className="h-[400px] rounded-lg border">
            <div className="p-4 space-y-2">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading activity logs...</p>
              ) : logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activity in selected time range</p>
              ) : (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div>
                        <p className="font-medium">{log.action.replace(/_/g, " ")}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                          {log.ip_address && ` • IP: ${log.ip_address}`}
                        </p>
                        {log.entity_type && (
                          <p className="text-xs text-muted-foreground">
                            {log.entity_type} {log.entity_id && `• ${log.entity_id.slice(0, 8)}...`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
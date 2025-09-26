import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Activity, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SecurityAlert {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  dismissed?: boolean;
}

export function SecurityMonitor() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    if (!isMonitoring) return;

    // Check for suspicious activities every 30 seconds
    const interval = setInterval(() => {
      checkSuspiciousActivities();
    }, 30000);

    // Initial check
    checkSuspiciousActivities();

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const checkSuspiciousActivities = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

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
        const { logs } = await response.json();
        analyzeLogsForThreats(logs || []);
      }
    } catch (error) {
      // Remove sensitive error logging in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking security:', error);
      }
    }
  };

  const analyzeLogsForThreats = (logs: any[]) => {
    const newAlerts: SecurityAlert[] = [];
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60000);

    // Recent logs
    const recentLogs = logs.filter(log => 
      new Date(log.created_at) > fiveMinutesAgo
    );

    const hourlyLogs = logs.filter(log => 
      new Date(log.created_at) > oneHourAgo
    );

    // Check for rapid deletions
    const deletions = recentLogs.filter(log => 
      log.action.includes('DELETE')
    );
    
    if (deletions.length >= 3) {
      newAlerts.push({
        id: `delete-${Date.now()}`,
        type: 'excessive_deletions',
        message: `${deletions.length} items deleted in the last 5 minutes`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for unusual login patterns
    const logins = hourlyLogs.filter(log => log.action === 'LOGIN');
    const uniqueIPs = new Set(logins.map(log => log.ip_address).filter(Boolean));
    
    if (uniqueIPs.size >= 3) {
      newAlerts.push({
        id: `ips-${Date.now()}`,
        type: 'multiple_locations',
        message: `Login attempts from ${uniqueIPs.size} different locations`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for settings changes
    const settingsChanges = recentLogs.filter(log => 
      log.action === 'UPDATE_SETTINGS'
    );
    
    if (settingsChanges.length > 0) {
      newAlerts.push({
        id: `settings-${Date.now()}`,
        type: 'settings_modified',
        message: 'Security settings were recently modified',
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for bank disconnections
    const bankDisconnects = recentLogs.filter(log => 
      log.action === 'DISCONNECT_BANK'
    );
    
    if (bankDisconnects.length > 0) {
      newAlerts.push({
        id: `bank-${Date.now()}`,
        type: 'bank_disconnected',
        message: 'A bank account was disconnected',
        severity: 'warning',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for rapid actions (possible automation/bot)
    if (recentLogs.length > 20) {
      newAlerts.push({
        id: `rapid-${Date.now()}`,
        type: 'rapid_activity',
        message: `Unusually high activity: ${recentLogs.length} actions in 5 minutes`,
        severity: 'critical',
        timestamp: new Date().toISOString(),
      });
    }

    // Update alerts, avoiding duplicates
    setAlerts(prev => {
      const existingIds = new Set(prev.map(a => a.type));
      const uniqueNewAlerts = newAlerts.filter(a => !existingIds.has(a.type));
      return [...uniqueNewAlerts, ...prev].slice(0, 10); // Keep only last 10 alerts
    });
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4 text-blue-600" />;
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Security Monitoring
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? 'Pause' : 'Resume'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map(alert => (
          <Alert 
            key={alert.id} 
            className={`${getSeverityColor(alert.severity)} relative`}
          >
            <div className="flex items-start gap-3">
              {getSeverityIcon(alert.severity)}
              <div className="flex-1">
                <AlertTitle className="text-sm font-medium mb-1">
                  {alert.type.replace(/_/g, ' ').toUpperCase()}
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {alert.message}
                </AlertDescription>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <Badge 
                variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {alert.severity}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => dismissAlert(alert.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
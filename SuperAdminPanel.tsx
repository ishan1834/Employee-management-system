import React, { useMemo, useState, useEffect, useCallback } from 'react';

/* ---------------- UI COMPONENTS ---------------- */
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

/* ---------------- ICONS ---------------- */
import {
  Users,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  ShieldCheck,
  Settings,
  RefreshCw,
  Bell,
  Search
} from "lucide-react";

/* ---------------- TYPES ---------------- */

// Stores all dashboard metrics
interface DashboardMetrics {
  totalUsers: number;
  activeToday: number;
  lateCount: number;
  absentCount: number;
  performanceScore: number;
}

// Stores system health values
interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
}

// Alerts structure
interface SystemAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

/* ---------------- CONSTANTS ---------------- */

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  excellent: 85,
  good: 70,
  average: 50,
};

// Auto refresh interval
const REFRESH_INTERVAL = 30000;

/* ---------------- HELPER FUNCTIONS ---------------- */

// Returns performance label
const getPerformanceLabel = (value: number): string => {
  if (value >= PERFORMANCE_THRESHOLDS.excellent) return "Excellent";
  if (value >= PERFORMANCE_THRESHOLDS.good) return "Good";
  if (value >= PERFORMANCE_THRESHOLDS.average) return "Average";
  return "Poor";
};

// Returns badge color
const getPerformanceBadge = (value: number): string => {
  if (value >= 85) return "bg-green-500";
  if (value >= 70) return "bg-blue-500";
  if (value >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

/* ---------------- MAIN COMPONENT ---------------- */

const StrategicCommandCenter: React.FC = () => {

  /* -------- STATE MANAGEMENT -------- */

  // Dashboard metrics state
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeToday: 0,
    lateCount: 0,
    absentCount: 0,
    performanceScore: 0,
  });

  // Alerts state
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  // System health state
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpuUsage: 0,
    memoryUsage: 0,
    uptime: 0,
  });

  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Global search state
  const [globalSearch, setGlobalSearch] = useState<string>("");

  /* -------- DATA FETCHING -------- */

  useEffect(() => {

    // Simulating API call
    const fetchData = () => {

      setMetrics({
        totalUsers: 120,
        activeToday: 95,
        lateCount: 10,
        absentCount: 15,
        performanceScore: 82,
      });

      setSystemHealth({
        cpuUsage: 45,
        memoryUsage: 60,
        uptime: 99.9,
      });

      setIsLoading(false);
    };

    fetchData();

    // Auto refresh
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);

  }, []);

  /* -------- ALERT SYSTEM -------- */

  useEffect(() => {

    const newAlerts: SystemAlert[] = [];

    if (systemHealth.cpuUsage > 80) {
      newAlerts.push({
        id: 'cpu',
        message: 'High CPU usage detected',
        severity: 'warning',
      });
    }

    if (systemHealth.cpuUsage > 90) {
      newAlerts.push({
        id: 'critical',
        message: 'System nearing overload',
        severity: 'critical',
      });
    }

    if (metrics.activeToday < metrics.totalUsers * 0.5) {
      newAlerts.push({
        id: 'attendance',
        message: 'Low attendance detected',
        severity: 'info',
      });
    }

    setAlerts(newAlerts);

  }, [systemHealth, metrics]);

  /* -------- MEMOIZED VALUES -------- */

  // Optimized performance label
  const performanceLabel = useMemo(
    () => getPerformanceLabel(metrics.performanceScore),
    [metrics.performanceScore]
  );

  /* -------- HANDLERS -------- */

  // Manual refresh button
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  /* ---------------- UI ---------------- */

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="text-blue-500" />
          Strategic Command Center
        </h1>

        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
        <input
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Search..."
          className="border rounded-lg pl-10 pr-4 py-2 w-64"
        />
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>

        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">

          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>System efficiency</CardDescription>
            </CardHeader>

            <CardContent>
              <Badge className={getPerformanceBadge(metrics.performanceScore)}>
                {performanceLabel}
              </Badge>

              <Progress value={metrics.performanceScore} />
            </CardContent>

          </Card>

        </TabsContent>

        {/* SYSTEM */}
        <TabsContent value="system">

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              <div>CPU: {systemHealth.cpuUsage}%</div>
              <Progress value={systemHealth.cpuUsage} />

              <div>Memory: {systemHealth.memoryUsage}%</div>
              <Progress value={systemHealth.memoryUsage} />

              <div>Uptime: {systemHealth.uptime}%</div>

              {/* ALERTS */}
              {alerts.map(alert => (
                <div key={alert.id}>{alert.message}</div>
              ))}

            </CardContent>
          </Card>

        </TabsContent>

      </Tabs>

      {/* SETTINGS DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Configure system</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default StrategicCommandCenter;

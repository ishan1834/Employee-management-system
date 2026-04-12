import React, { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

import {
  ShieldCheck, RefreshCw, Search, Users, Activity, TrendingUp
} from "lucide-react";

/* ---------------- TYPES ---------------- */

interface DashboardMetrics {
  totalUsers: number;
  activeToday: number;
  lateCount: number;
  absentCount: number;
  performanceScore: number;
}

interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
}

interface SystemAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

/* ---------------- CONSTANTS ---------------- */

const REFRESH_INTERVAL = 30000;

/* ---------------- COMPONENT ---------------- */

const StrategicCommandCenter: React.FC = () => {

  /* ---------------- STATE ---------------- */

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 120,
    activeToday: 95,
    lateCount: 10,
    absentCount: 15,
    performanceScore: 82,
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpuUsage: 45,
    memoryUsage: 60,
    uptime: 99.9,
  });

  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [globalSearch, setGlobalSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /* ---------------- LIVE DATA SIMULATION ---------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeToday: prev.activeToday + Math.floor(Math.random() * 3),
        performanceScore: Math.min(prev.performanceScore + Math.random() * 2, 100)
      }));

      setSystemHealth(prev => ({
        ...prev,
        cpuUsage: Math.min(prev.cpuUsage + Math.random() * 3, 100),
        memoryUsage: Math.min(prev.memoryUsage + Math.random() * 2, 100)
      }));

    }, 3000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- LOADING ---------------- */

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  /* ---------------- ALERT SYSTEM ---------------- */

  useEffect(() => {
    const newAlerts: SystemAlert[] = [];

    if (systemHealth.cpuUsage > 80) {
      newAlerts.push({ id: 'cpu', message: 'High CPU usage', severity: 'warning' });
    }

    if (systemHealth.cpuUsage > 90) {
      newAlerts.push({ id: 'critical', message: 'Critical CPU load', severity: 'critical' });
    }

    setAlerts(newAlerts);

  }, [systemHealth]);

  /* ---------------- DERIVED VALUES ---------------- */

  const engagement = useMemo(() => {
    return Math.round((metrics.activeToday / metrics.totalUsers) * 100);
  }, [metrics]);

  /* ---------------- HANDLERS ---------------- */

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
          <ShieldCheck /> Command Center
        </h1>

        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex gap-4">
        <input
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Search..."
          className="border px-3 py-2 rounded"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
        </select>
      </div>

      {/* LOADING */}
      {isLoading && <p>Loading dashboard...</p>}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-4 gap-4">

        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>{metrics.totalUsers}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Today</CardTitle>
          </CardHeader>
          <CardContent>{metrics.activeToday}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>{metrics.performanceScore.toFixed(1)}%</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
          </CardHeader>
          <CardContent>{engagement}%</CardContent>
        </Card>

      </div>

      {/* ALERTS */}
      {alerts.map(alert => (
        <div key={alert.id} className="text-red-400">
          {alert.message}
        </div>
      ))}

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>

        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* SYSTEM TAB */}
        <TabsContent value="system">

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>

            <CardContent>

              <p>CPU: {systemHealth.cpuUsage.toFixed(1)}%</p>
              <Progress value={systemHealth.cpuUsage} />

              <p>Memory: {systemHealth.memoryUsage.toFixed(1)}%</p>
              <Progress value={systemHealth.memoryUsage} />

            </CardContent>

          </Card>

        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics">

          <Card>
            <CardHeader>
              <CardTitle>Analytics Summary</CardTitle>
              <CardDescription>Advanced insights</CardDescription>
            </CardHeader>

            <CardContent>

              <p>Attendance Rate: {metrics.performanceScore.toFixed(1)}%</p>
              <p>Engagement: {engagement}%</p>
              <p>Late Users: {metrics.lateCount}</p>
              <p>Absent Users: {metrics.absentCount}</p>

            </CardContent>

          </Card>

        </TabsContent>

      </Tabs>

      {/* SETTINGS */}
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

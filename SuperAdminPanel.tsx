import React, { useMemo, useState, useEffect, useCallback } from 'react';

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

import {
  Users, Activity, TrendingUp, Clock, AlertCircle,
  ShieldCheck, Settings, RefreshCw
} from "lucide-react";

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

const PERFORMANCE_THRESHOLDS = {
  excellent: 85,
  good: 70,
  average: 50,
};

const REFRESH_INTERVAL = 30000;

const getPerformanceLabel = (value: number): string => {
  if (value >= PERFORMANCE_THRESHOLDS.excellent) return "Excellent";
  if (value >= PERFORMANCE_THRESHOLDS.good) return "Good";
  if (value >= PERFORMANCE_THRESHOLDS.average) return "Average";
  return "Poor";
};

const getPerformanceBadge = (value: number): string => {
  if (value >= 85) return "bg-green-500";
  if (value >= 70) return "bg-blue-500";
  if (value >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

const StrategicCommandCenter: React.FC = () => {

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeToday: 0,
    lateCount: 0,
    absentCount: 0,
    performanceScore: 0,
  });

  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpuUsage: 0,
    memoryUsage: 0,
    uptime: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
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
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const performanceLabel = useMemo(
    () => getPerformanceLabel(metrics.performanceScore),
    [metrics.performanceScore]
  );

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  return (
    <div className="p-6 space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-blue-500" />
          Strategic Command Center
        </h1>

        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

        <TabsList className="bg-gray-900/60 border border-gray-800 p-1 rounded-xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
                <CardDescription>Registered admins</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metrics.totalUsers}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-400">
                  {metrics.activeToday}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Late</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-400">
                  {metrics.lateCount}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-400">
                  {metrics.absentCount}
                </p>
              </CardContent>
            </Card>

          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              <div className="flex justify-between">
                <p>Score</p>
                <Badge className={getPerformanceBadge(metrics.performanceScore)}>
                  {performanceLabel}
                </Badge>
              </div>

              <Progress value={metrics.performanceScore} />

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>CPU</span>
                <span>{systemHealth.cpuUsage}%</span>
              </div>
              <Progress value={systemHealth.cpuUsage} />

              <div className="flex justify-between">
                <span>Memory</span>
                <span>{systemHealth.memoryUsage}%</span>
              </div>
              <Progress value={systemHealth.memoryUsage} />

              <div className="flex justify-between">
                <span>Uptime</span>
                <Badge>{systemHealth.uptime}%</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>

            <CardContent>
              <p>{metrics.performanceScore}% Attendance</p>
              <p>
                {Math.round((metrics.activeToday / metrics.totalUsers) * 100)}% Engagement
              </p>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
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

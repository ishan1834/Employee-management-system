import React, { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
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
  ShieldCheck, RefreshCw, Users, Activity, Terminal
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

interface Log {
  id: string;
  message: string;
  time: string;
}

/* ---------------- MOCK DATA ---------------- */

const generateLogs = (): Log[] => [
  { id: "1", message: "User logged in", time: "22:10" },
  { id: "2", message: "Database synced", time: "22:11" },
];

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
  const [logs, setLogs] = useState<Log[]>(generateLogs());

  const [globalSearch, setGlobalSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /* ---------------- LIVE SYSTEM ---------------- */

  useEffect(() => {
    const interval = setInterval(() => {

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        activeToday: prev.activeToday + Math.floor(Math.random() * 2)
      }));

      // Update logs dynamically
      setLogs(prev => [
        {
          id: Date.now().toString(),
          message: "Auto system update",
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ].slice(0, 10));

    }, 3000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- ALERTS ---------------- */

  useEffect(() => {
    const newAlerts: SystemAlert[] = [];

    if (systemHealth.cpuUsage > 80) {
      newAlerts.push({ id: 'cpu', message: 'High CPU', severity: 'warning' });
    }

    setAlerts(newAlerts);
  }, [systemHealth]);

  /* ---------------- FILTERED DATA ---------------- */

  const filteredLogs = useMemo(() => {
    return logs.filter(log =>
      log.message.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [logs, globalSearch]);

  /* ---------------- DERIVED ---------------- */

  const engagement = Math.round(
    (metrics.activeToday / metrics.totalUsers) * 100
  );

  /* ---------------- HANDLERS ---------------- */

  const handleRefresh = useCallback(() => {
    setMetrics(prev => ({ ...prev }));
  }, []);

  /* ---------------- UI ---------------- */

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck /> Enterprise Dashboard
        </h1>

        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* SEARCH */}
      <input
        value={globalSearch}
        onChange={(e) => setGlobalSearch(e.target.value)}
        placeholder="Search logs..."
        className="border px-3 py-2 rounded"
      />

      {/* GRID */}
      <div className="grid grid-cols-3 gap-6">

        {/* LEFT SECTION */}
        <div className="col-span-2 space-y-6">

          {/* METRICS */}
          <div className="grid grid-cols-4 gap-4">

            <Card>
              <CardHeader><CardTitle>Total</CardTitle></CardHeader>
              <CardContent>{metrics.totalUsers}</CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Active</CardTitle></CardHeader>
              <CardContent>{metrics.activeToday}</CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Engagement</CardTitle></CardHeader>
              <CardContent>{engagement}%</CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Score</CardTitle></CardHeader>
              <CardContent>{metrics.performanceScore}%</CardContent>
            </Card>

          </div>

          {/* TABLE */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Activity Table</CardTitle>
              <CardDescription>Live attendance data</CardDescription>
            </CardHeader>

            <CardContent>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td>Admin {i + 1}</td>
                      <td>
                        <Badge>{i % 2 === 0 ? "Present" : "Absent"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-6">

          {/* SYSTEM HEALTH */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>

            <CardContent>

              <p>CPU: {systemHealth.cpuUsage}%</p>
              <Progress value={systemHealth.cpuUsage} />

              <p>Memory: {systemHealth.memoryUsage}%</p>
              <Progress value={systemHealth.memoryUsage} />

            </CardContent>
          </Card>

          {/* LOGS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal /> Activity Logs
              </CardTitle>
            </CardHeader>

            <CardContent>
              <ScrollArea className="h-64">
                {filteredLogs.map(log => (
                  <div key={log.id} className="text-xs border-b py-2">
                    <p>{log.message}</p>
                    <span>{log.time}</span>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Advanced config</DialogDescription>
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

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
  ShieldCheck, RefreshCw, Terminal, Bell, Power, Users
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

interface Log {
  id: string;
  message: string;
  time: string;
}

interface Notification {
  id: string;
  text: string;
}

/* ---------------- MOCK ---------------- */

const generateLogs = (): Log[] => [
  { id: "1", message: "System initialized", time: "22:00" }
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

  const [logs, setLogs] = useState<Log[]>(generateLogs());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [role, setRole] = useState<'admin' | 'viewer'>('admin');

  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [isLockdown, setIsLockdown] = useState(false);

  /* ---------------- LIVE SYSTEM ---------------- */

  useEffect(() => {
    const interval = setInterval(() => {

      // Metrics update
      setMetrics(prev => ({
        ...prev,
        activeToday: prev.activeToday + Math.floor(Math.random() * 2)
      }));

      // Logs update
      setLogs(prev => [
        {
          id: Date.now().toString(),
          message: "Auto process executed",
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ].slice(0, 15));

      // Notifications
      if (Math.random() > 0.7) {
        setNotifications(prev => [
          { id: Date.now().toString(), text: "New system event detected" },
          ...prev
        ].slice(0, 5));
      }

    }, 3000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- FILTER ---------------- */

  const filteredLogs = useMemo(() => {
    return logs.filter(l =>
      l.message.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  /* ---------------- DERIVED ---------------- */

  const engagement = Math.round(
    (metrics.activeToday / metrics.totalUsers) * 100
  );

  const systemStatus = useMemo(() => {
    if (systemHealth.cpuUsage > 85) return "CRITICAL";
    if (systemHealth.cpuUsage > 60) return "WARNING";
    return "OPTIMAL";
  }, [systemHealth]);

  /* ---------------- HANDLERS ---------------- */

  const handleLockdown = () => {
    if (role !== 'admin') return;
    setIsLockdown(true);
  };

  const handleReset = () => {
    if (role !== 'admin') return;
    setMetrics({
      totalUsers: 120,
      activeToday: 90,
      lateCount: 5,
      absentCount: 10,
      performanceScore: 75,
    });
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen p-6 bg-black text-gray-300 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="text-blue-500" />
          Super Admin Panel
        </h1>

        <div className="flex gap-3">
          <Badge>{role.toUpperCase()}</Badge>
          <Button onClick={() => setRole(role === 'admin' ? 'viewer' : 'admin')}>
            Switch Role
          </Button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-4 gap-6">

        {/* MAIN AREA */}
        <div className="col-span-3 space-y-6">

          {/* METRICS */}
          <div className="grid grid-cols-4 gap-4">
            <Card><CardContent>Total: {metrics.totalUsers}</CardContent></Card>
            <Card><CardContent>Active: {metrics.activeToday}</CardContent></Card>
            <Card><CardContent>Engagement: {engagement}%</CardContent></Card>
            <Card><CardContent>Status: {systemStatus}</CardContent></Card>
          </div>

          {/* CONTROL PANEL */}
          <Card>
            <CardHeader>
              <CardTitle>System Controls</CardTitle>
            </CardHeader>

            <CardContent className="flex gap-4">

              <Button onClick={handleLockdown} className="bg-red-600">
                <Power className="mr-2 h-4 w-4" />
                Lockdown
              </Button>

              <Button onClick={handleReset}>
                Reset System
              </Button>

            </CardContent>
          </Card>

          {/* TABLE */}
          <Card>
            <CardHeader>
              <CardTitle>User Table</CardTitle>
            </CardHeader>

            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td>User {i + 1}</td>
                      <td>
                        <Badge>{i % 2 ? "Active" : "Inactive"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

        </div>

        {/* SIDEBAR */}
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

          {/* NOTIFICATIONS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell /> Notifications
              </CardTitle>
            </CardHeader>

            <CardContent>
              {notifications.map(n => (
                <p key={n.id} className="text-xs">{n.text}</p>
              ))}
            </CardContent>
          </Card>

          {/* LOGS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal /> Logs
              </CardTitle>
            </CardHeader>

            <CardContent>
              <ScrollArea className="h-64">
                {filteredLogs.map(log => (
                  <div key={log.id} className="text-xs py-1">
                    {log.message} - {log.time}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* LOCKDOWN MODAL */}
      <Dialog open={isLockdown} onOpenChange={setIsLockdown}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>System Locked</DialogTitle>
            <DialogDescription>
              Emergency lockdown activated.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setIsLockdown(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default StrategicCommandCenter;

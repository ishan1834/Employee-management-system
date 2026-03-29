/* ========================================================================== */
/* THRYLOS ENTERPRISE: STRATEGIC COMMAND & CONTROL INTERFACE (v4.2.0-STABLE)   */
/* ========================================================================== */
/* Author: Thrylos Engineering Group                                          */
/* Description: Unified administrative layer for global attendance assets.    */
/* ========================================================================== */

import React, { useMemo, useState, useEffect, useCallback } from 'react';

/* ========================================================================== */
/* UI COMPONENT IMPORTS                                                       */
/* ========================================================================== */

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

/* ========================================================================== */
/* ICONS & VISUALS                                                            */
/* ========================================================================== */

import {
  Users,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  ShieldCheck,
  Settings,
  RefreshCw
} from "lucide-react";

/* ========================================================================== */
/* TYPES & INTERFACES                                                         */
/* ========================================================================== */

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

/* ========================================================================== */
/* CONFIGURATION CONSTANTS                                                    */
/* ========================================================================== */

const PERFORMANCE_THRESHOLDS = {
  excellent: 85,
  good: 70,
  average: 50,
};

const REFRESH_INTERVAL = 30000; // 30 seconds

/* ========================================================================== */
/* HELPER FUNCTIONS                                                           */
/* ========================================================================== */

/**
 * Returns performance label based on percentage
 */
const getPerformanceLabel = (value: number): string => {
  if (value >= PERFORMANCE_THRESHOLDS.excellent) return "Excellent";
  if (value >= PERFORMANCE_THRESHOLDS.good) return "Good";
  if (value >= PERFORMANCE_THRESHOLDS.average) return "Average";
  return "Poor";
};

/**
 * Returns badge color class
 */
const getPerformanceBadge = (value: number): string => {
  if (value >= 85) return "bg-green-500";
  if (value >= 70) return "bg-blue-500";
  if (value >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

/* ========================================================================== */
/* MAIN COMPONENT                                                             */
/* ========================================================================== */

const StrategicCommandCenter: React.FC = () => {

  /* ============================= */
  /* STATE MANAGEMENT              */
  /* ============================= */

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeToday: 0,
    lateCount: 0,
    absentCount: 0,
    performanceScore: 0,
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    cpuUsage: 0,
    memoryUsage: 0,
    uptime: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  /* ============================= */
  /* EFFECTS                       */
  /* ============================= */

  useEffect(() => {
    // Simulated API fetch
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

  /* ============================= */
  /* MEMOIZED VALUES               */
  /* ============================= */

  const performanceLabel = useMemo(
    () => getPerformanceLabel(metrics.performanceScore),
    [metrics.performanceScore]
  );

  /* ============================= */
  /* HANDLERS                      */
  /* ============================= */

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  /* ========================================================================== */
  /* RENDER                                                                     */
  /* ========================================================================== */

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
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

{/* ===================================================== */}
{/* TABS SYSTEM                                           */}
{/* ===================================================== */}

<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

  {/* ================= TAB HEADER ================= */}
  <TabsList className="bg-gray-900/60 border border-gray-800 p-1 rounded-xl">
    <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
      Overview
    </TabsTrigger>
    <TabsTrigger value="system" className="data-[state=active]:bg-purple-600">
      System
    </TabsTrigger>
    {/* NEW TAB */}
    <TabsTrigger value="analytics" className="data-[state=active]:bg-green-600">
      Analytics
    </TabsTrigger>
  </TabsList>

  {/* ===================================================== */}
  {/* OVERVIEW TAB                                           */}
  {/* ===================================================== */}

  <TabsContent value="overview" className="space-y-6">

    {/* ===== TOP METRICS ===== */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

      {/* TOTAL USERS */}
      <Card className="hover:scale-105 transition-all duration-300">
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
          <CardDescription>Registered admins</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.totalUsers}</p>
        </CardContent>
      </Card>

      {/* ACTIVE TODAY */}
      <Card className="hover:scale-105 transition-all duration-300">
        <CardHeader>
          <CardTitle>Active Today</CardTitle>
          <CardDescription>Logged in today</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-400">
            {metrics.activeToday}
          </p>
        </CardContent>
      </Card>

      {/* LATE USERS (NEW) */}
      <Card className="hover:scale-105 transition-all duration-300">
        <CardHeader>
          <CardTitle>Late</CardTitle>
          <CardDescription>Delayed attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-yellow-400">
            {metrics.lateCount}
          </p>
        </CardContent>
      </Card>

      {/* ABSENT USERS (NEW) */}
      <Card className="hover:scale-105 transition-all duration-300">
        <CardHeader>
          <CardTitle>Absent</CardTitle>
          <CardDescription>Not present today</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-400">
            {metrics.absentCount}
          </p>
        </CardContent>
      </Card>

    </div>

    {/* ===== PERFORMANCE CARD ===== */}
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
        <CardDescription>Overall attendance efficiency</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        <div className="flex items-center justify-between">
          <p className="text-lg">Score</p>
          <Badge className={getPerformanceBadge(metrics.performanceScore)}>
            {performanceLabel}
          </Badge>
        </div>

        <Progress value={metrics.performanceScore} />

        <p className="text-sm text-gray-400">
          Based on attendance consistency and punctuality metrics.
        </p>

      </CardContent>
    </Card>

  </TabsContent>

  {/* ===================================================== */}
  {/* SYSTEM TAB                                             */}
  {/* ===================================================== */}

  <TabsContent value="system" className="space-y-6">

    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>Real-time server metrics</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* CPU */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>CPU Usage</span>
            <span>{systemHealth.cpuUsage}%</span>
          </div>
          <Progress value={systemHealth.cpuUsage} />
        </div>

        {/* MEMORY */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Memory Usage</span>
            <span>{systemHealth.memoryUsage}%</span>
          </div>
          <Progress value={systemHealth.memoryUsage} />
        </div>

        {/* UPTIME */}
        <div className="flex justify-between items-center">
          <span>Uptime</span>
          <Badge className="bg-green-600">
            {systemHealth.uptime}%
          </Badge>
        </div>

        {/* EXTRA INFO (NEW) */}
        <div className="text-xs text-gray-500">
          Last updated just now • Auto-refresh enabled
        </div>

      </CardContent>
    </Card>

  </TabsContent>

  {/* ===================================================== */}
  {/* ANALYTICS TAB (NEW)                                    */}
  {/* ===================================================== */}

  <TabsContent value="analytics" className="space-y-6">

    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle>Analytics Summary</CardTitle>
        <CardDescription>Quick insights</CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-4">

        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">Attendance Rate</p>
          <p className="text-xl font-bold">
            {metrics.performanceScore}%
          </p>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">Engagement</p>
          <p className="text-xl font-bold">
            {Math.round((metrics.activeToday / metrics.totalUsers) * 100)}%
          </p>
        </div>

      </CardContent>
    </Card>

  </TabsContent>

</Tabs>

      {/* DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>System Settings</DialogTitle>
            <DialogDescription>
              Configure global system parameters
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default StrategicCommandCenter;

import {
  ShieldAlert, Database, Download, Users, UserCheck, UserX, 
  Clock, AlertCircle, Edit, Lock, Activity, Settings2,
  Terminal, Server, Globe, Cpu, Zap, Radio, Search, 
  ShieldCheck, Wifi, HardDrive, Key, Bell, Power
} from 'lucide-react';

/* ========================================================================== */
/* CONSTANTS & TYPE DEFINITIONS                                               */
/* ========================================================================== */

const SECURITY_CLEARANCE = "LEVEL_9_OVERRIDE";
const SYSTEM_BUILD = "2026_RC_04";

interface AuditEvent {
  id: string;
  type: 'AUTH' | 'DB' | 'SYSTEM' | 'OVERRIDE';
  message: string;
  timestamp: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

/* ========================================================================== */
/* HELPER UTILITIES                                                           */
/* ========================================================================== */

const generateMockLogs = (): AuditEvent[] => [
  { id: '101', type: 'SYSTEM', message: 'Encryption Handshake Success', timestamp: '22:10:01', severity: 'INFO' },
  { id: '102', type: 'AUTH', message: 'Admin Session: Prem Kumar (Active)', timestamp: '22:10:05', severity: 'INFO' },
  { id: '103', type: 'DB', message: 'Query Latency Detected: 45ms', timestamp: '22:10:12', severity: 'WARN' },
  { id: '104', type: 'OVERRIDE', message: 'Unauthorized Access Blocked (IP: 192.168.1.1)', timestamp: '22:11:00', severity: 'CRITICAL' },
];

/* ========================================================================== */
/* MAIN COMPONENT                                                             */
/* ========================================================================== */

const SuperAdminDashboard: React.FC<any> = (props) => {
  const { stats, attendanceData, allAdmins } = props;

  /* --- INTERNAL STATE --- */
  const [activeLogs, setActiveLogs] = useState<AuditEvent[]>(generateMockLogs());
  const [loadLevel, setLoadLevel] = useState(42);
  const [isLockdown, setIsLockdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uptime, setUptime] = useState(0);

  /* --- EFFECTS: SYSTEM TELEMETRY SIMULATION --- */
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadLevel(prev => Math.min(Math.max(prev + (Math.random() * 4 - 2), 10), 95));
      setUptime(prev => prev + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  /* --- DERIVED ANALYTICS --- */
  const filteredData = attendanceData.filter((r: any) => 
    r.admin?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const systemHealth = useMemo(() => {
    if (loadLevel > 85) return { label: "CRITICAL", color: "text-rose-500" };
    if (loadLevel > 60) return { label: "WARNING", color: "text-amber-500" };
    return { label: "OPTIMAL", color: "text-emerald-500" };
  }, [loadLevel]);

  /* --- RENDER HELPERS --- */
  const MetricCard = ({ icon: Icon, value, label, trend }: any) => (
    <Card className="bg-gray-900/40 border-gray-800 transition-all hover:bg-gray-800/40 group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 group-hover:border-blue-500/50 transition-colors">
            <Icon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-[10px] font-black text-gray-600 uppercase">Real-Time</div>
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
            {trend && <span className="text-[9px] text-emerald-500">+{trend}%</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#050507] text-gray-400 font-sans selection:bg-blue-500/30 p-6">
      
      {/* 1. TOP COMMAND BAR */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10 border-b border-gray-800 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">
              Thrylos <span className="text-blue-500">OS</span>
            </h1>
          </div>
          <p className="text-xs text-gray-500 font-bold tracking-[0.3em] uppercase pl-1">
            Enterprise Asset Management &bull; v{SYSTEM_BUILD}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col items-end pr-6 border-r border-gray-800">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Master Key Status</span>
            <span className="text-xs font-mono text-blue-400">{SECURITY_CLEARANCE}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-gray-800 bg-gray-950 text-xs font-bold hover:bg-gray-900">
              <History className="h-4 w-4 mr-2" /> Audit Trail
            </Button>
            <Button 
              onClick={() => setIsLockdown(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-900/20"
            >
              <Power className="h-4 w-4 mr-2" /> EMERGENCY LOCKDOWN
            </Button>
          </div>
        </div>
      </header>

      {/* 2. CORE SYSTEM GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PRIMARY DASHBOARD */}
        <main className="xl:col-span-9 space-y-8">
          
          {/* METRIC ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard icon={Users} value={stats.total} label="Total Resources" trend={1.2} />
            <MetricCard icon={UserCheck} value={stats.present} label="Active Sessions" trend={4.5} />
            <MetricCard icon={Zap} value={`${loadLevel.toFixed(1)}%`} label="Core Utilization" />
            <MetricCard icon={HardDrive} value="1.2 TB" label="Log Storage" />
          </div>

          {/* DATA TABLES & TABS */}
          <Tabs defaultValue="registry" className="w-full">
            <div className="flex items-center justify-between mb-6 bg-gray-900/20 p-1.5 rounded-xl border border-gray-800">
              <TabsList className="bg-transparent gap-2">
                <TabsTrigger value="registry" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs font-bold rounded-lg px-6 transition-all">
                  GLOBAL REGISTRY
                </TabsTrigger>
                <TabsTrigger value="topology" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs font-bold rounded-lg px-6 transition-all">
                  NETWORK TOPOLOGY
                </TabsTrigger>
              </TabsList>
              <div className="relative mr-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter resource directory..." 
                  className="bg-black border border-gray-800 rounded-lg py-1.5 pl-10 pr-4 text-xs w-64 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <TabsContent value="registry">
              <Card className="bg-gray-900/20 border-gray-800 backdrop-blur-md overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-950/50 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800">
                        <tr>
                          <th className="px-8 py-5">Asset Descriptor</th>
                          <th className="px-8 py-5">Validation Status</th>
                          <th className="px-8 py-5">Access Timestamp</th>
                          <th className="px-8 py-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40">
                        {filteredData.map((record: any) => (
                          <tr key={record.id} className="group hover:bg-blue-600/5 transition-all">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center text-blue-400 font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                  {record.admin?.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-200">{record.admin?.name}</p>
                                  <p className="text-[10px] text-gray-600 font-mono tracking-tighter">UUID_{record.id.slice(0, 12)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <Badge variant="outline" className={`text-[10px] px-3 font-black border-gray-800 bg-gray-950 ${
                                record.status === 'present' ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {record.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-8 py-5 font-mono text-xs text-gray-500">
                              [{record.marked_at || 'NO_LOG_ENTRY'}]
                            </td>
                            <td className="px-8 py-5 text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-800 text-gray-500 hover:text-white">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="topology">
              <Card className="bg-gray-900/20 border-gray-800 p-12 text-center flex flex-col items-center justify-center space-y-4">
                 <Radio className="h-12 w-12 text-blue-500 animate-pulse" />
                 <h3 className="text-xl font-black text-white italic">MAPPING GLOBAL NODES...</h3>
                 <p className="text-sm text-gray-600 max-w-md">The system is currently triangulating resource locations via the Thrylos Mesh Network. Active nodes: {activeNodes}.</p>
                 <div className="grid grid-cols-3 gap-8 w-full max-w-lg mt-12">
                    <div className="space-y-1"><p className="text-2xl font-bold text-white">4</p><p className="text-[10px] font-black text-gray-600 uppercase">Edge Gateways</p></div>
                    <div className="space-y-1"><p className="text-2xl font-bold text-white">128</p><p className="text-[10px] font-black text-gray-600 uppercase">Sub-Clusters</p></div>
                    <div className="space-y-1"><p className="text-2xl font-bold text-white">0.4ms</p><p className="text-[10px] font-black text-gray-600 uppercase">Av. Latency</p></div>
                 </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* RIGHT SIDEBAR: INTELLIGENCE & TELEMETRY */}
        <aside className="xl:col-span-3 space-y-8">
          
          {/* SYSTEM HEALTH CARD */}
          <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Activity className="h-4 w-4" /> System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase">Core Status</p>
                  <p className={`text-xl font-black italic ${systemHealth.color}`}>{systemHealth.label}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-gray-600 uppercase">Load</p>
                   <p className="text-xl font-black text-white">{loadLevel.toFixed(0)}%</p>
                </div>
              </div>
              <Progress value={loadLevel} className="h-1.5 bg-gray-950" />
              <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 bg-gray-950 rounded-lg border border-gray-800">
                    <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Database</p>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                       <Wifi className="h-3 w-3" /> ONLINE
                    </div>
                 </div>
                 <div className="p-3 bg-gray-950 rounded-lg border border-gray-800">
                    <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Firewall</p>
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                       <Key className="h-3 w-3" /> ENCRYPTED
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* LIVE AUDIT TERMINAL */}
          <Card className="bg-gray-900 border-gray-800 flex flex-col h-[520px]">
            <CardHeader className="border-b border-gray-800/50 pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                <Terminal className="h-4 w-4" /> Intelligence Feed
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-5">
              <div className="space-y-5">
                {activeLogs.map((log) => (
                  <div key={log.id} className="relative pl-4 border-l-2 border-gray-800 hover:border-blue-500 transition-colors py-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[9px] font-black uppercase ${
                        log.severity === 'CRITICAL' ? 'text-rose-500' : 'text-blue-500'
                      }`}>
                        [{log.type}]
                      </span>
                      <span className="text-[9px] text-gray-600 font-mono tracking-tighter italic">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-gray-400 font-mono italic">
                      {log.message}
                    </p>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold px-1 animate-pulse">
                   <Radio className="h-3 w-3" /> LISTENING_FOR_SYMBOLS...
                </div>
              </div>
            </ScrollArea>
            <CardFooter className="bg-gray-950 p-2">
               <Button variant="ghost" className="w-full text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white">
                  Purge Volatile Memory
               </Button>
            </CardFooter>
          </Card>
        </aside>
      </div>

      {/* 3. LOCKDOWN DIALOG */}
      <Dialog open={isLockdown} onOpenChange={setIsLockdown}>
        <DialogContent className="bg-black border-rose-900 text-white max-w-lg">
          <DialogHeader className="items-center text-center">
            <div className="h-20 w-20 rounded-full bg-rose-600/20 flex items-center justify-center mb-4 animate-ping">
              <ShieldAlert className="h-10 w-10 text-rose-500" />
            </div>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">System Lockdown Initialized</DialogTitle>
            <DialogDescription className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-2">
              All administrative access points will be severed immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-gray-950 rounded-xl border border-rose-900/50 my-4 space-y-4">
            <p className="text-sm text-gray-400 font-mono leading-relaxed">
              Confirming this action will encrypt the master registry with a temporary key. Only the Root Administrator can decrypt this session.
            </p>
            <div className="flex gap-2">
               <div className="h-2 flex-1 bg-rose-600" />
               <div className="h-2 flex-1 bg-rose-600 animate-pulse" />
               <div className="h-2 flex-1 bg-rose-600/20" />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsLockdown(false)} className="flex-1 font-bold">ABORT</Button>
            <Button className="flex-1 bg-rose-600 hover:bg-rose-700 font-black italic">CONFIRM SEVERANCE</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. SYSTEM STATUS FOOTER */}
      <footer className="mt-16 flex flex-col md:flex-row justify-between items-center py-8 border-t border-gray-800 gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
        <div className="flex gap-10">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase">Architecture</p>
            <p className="text-xs font-bold text-white">Quantum_Core_v4</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase">Session Time</p>
            <p className="text-xs font-bold text-white font-mono">{Math.floor(uptime/60)}m {uptime%60}s</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase">Region</p>
            <p className="text-xs font-bold text-white">Mehrauli_Hub_01</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]" /> CLOUD_SYNC_ACTIVE
           </div>
           <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">&copy; 2026 Thrylos Systems Infrastructure</p>
        </div>
      </footer>
    </div>
  );
};

export default SuperAdminDashboard;

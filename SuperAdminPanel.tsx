// React Core Hooks
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react';

// UI Components - Cards
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';

// UI Components - Basic Elements
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

// UI Components - Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

// Icons (Lucide)
import {
  ShieldCheck,
  Terminal,
  Brain,
  AlertTriangle
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
}

interface Insight {
  id: string;
  text: string;
}

interface Prediction {
  id: string;
  risk: string;
}

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
  });

  const [history, setHistory] = useState<number[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /* ---------------- LIVE SYSTEM ---------------- */

  useEffect(() => {
    const interval = setInterval(() => {

      // Simulate performance trend
      setMetrics(prev => {
        const newScore = Math.min(prev.performanceScore + (Math.random() * 4 - 2), 100);
        setHistory(h => [...h.slice(-20), newScore]);
        return { ...prev, performanceScore: newScore };
      });

      // Simulate system load
      setSystemHealth(prev => ({
        cpuUsage: Math.min(prev.cpuUsage + Math.random() * 5, 100),
        memoryUsage: Math.min(prev.memoryUsage + Math.random() * 3, 100)
      }));

      // Logs
      setLogs(prev => [
        `System tick at ${new Date().toLocaleTimeString()}`,
        ...prev
      ].slice(0, 15));

    }, 3000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- AI INSIGHTS ---------------- */

  useEffect(() => {

    const newInsights: Insight[] = [];

    if (metrics.performanceScore < 60) {
      newInsights.push({
        id: 'low_perf',
        text: 'Performance dropping. Investigate attendance.'
      });
    }

    if (systemHealth.cpuUsage > 80) {
      newInsights.push({
        id: 'cpu_high',
        text: 'CPU usage high. Optimize backend services.'
      });
    }

    setInsights(newInsights);

  }, [metrics, systemHealth]);

  /* ---------------- PREDICTIONS ---------------- */

  useEffect(() => {

    const newPredictions: Prediction[] = [];

    const avg =
      history.reduce((a, b) => a + b, 0) / (history.length || 1);

    if (avg < 70) {
      newPredictions.push({
        id: 'risk_low',
        risk: 'Performance may fall below threshold soon'
      });
    }

    if (systemHealth.cpuUsage > 75) {
      newPredictions.push({
        id: 'cpu_risk',
        risk: 'Potential system overload in near future'
      });
    }

    setPredictions(newPredictions);

  }, [history, systemHealth]);

  /* ---------------- DERIVED ---------------- */

  const engagement = Math.round(
    (metrics.activeToday / metrics.totalUsers) * 100
  );

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-black text-gray-300 p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold flex gap-2 items-center">
          <ShieldCheck /> Ultra System
        </h1>

        <Button onClick={() => setIsDialogOpen(true)}>
          Open Control
        </Button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-5 gap-4">

        <Card><CardContent>Total: {metrics.totalUsers}</CardContent></Card>
        <Card><CardContent>Active: {metrics.activeToday}</CardContent></Card>
        <Card><CardContent>Engagement: {engagement}%</CardContent></Card>
        <Card><CardContent>CPU: {systemHealth.cpuUsage.toFixed(1)}%</CardContent></Card>
        <Card><CardContent>Score: {metrics.performanceScore.toFixed(1)}%</CardContent></Card>

      </div>

      {/* ANALYTICS PANEL */}
      <div className="grid grid-cols-3 gap-6">

        {/* HISTORY */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>

          <CardContent>
            {history.map((h, i) => (
              <div key={i} className="text-xs">{h.toFixed(1)}</div>
            ))}
          </CardContent>
        </Card>

        {/* INSIGHTS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain /> AI Insights
            </CardTitle>
          </CardHeader>

          <CardContent>
            {insights.map(i => (
              <p key={i.id} className="text-sm">{i.text}</p>
            ))}
          </CardContent>
        </Card>

        {/* PREDICTIONS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle /> Predictions
            </CardTitle>
          </CardHeader>

          <CardContent>
            {predictions.map(p => (
              <p key={p.id} className="text-sm text-yellow-400">{p.risk}</p>
            ))}
          </CardContent>
        </Card>

      </div>

      {/* LOG TERMINAL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal /> System Logs
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-64">
            {logs.map((log, i) => (
              <div key={i} className="text-xs">{log}</div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* CONTROL PANEL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>System Control</DialogTitle>
            <DialogDescription>
              Advanced system operations
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button>Restart</Button>
            <Button variant="destructive">Shutdown</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default StrategicCommandCenter;

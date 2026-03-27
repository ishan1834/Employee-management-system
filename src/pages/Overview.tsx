




import React, { useState, useEffect, useRef } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Activity, RefreshCw, ArrowUpRight, ArrowDownRight,
  Zap, Users, Clock, Target, BarChart2, Layers,
  AlertCircle, CheckCircle2, ChevronRight, Gamepad2,
  Share2, CreditCard, Calendar, Flame
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────────────
interface OverviewStats {
  totalRevenue: number;
  pendingOrders: number;
  totalTransactions: number;
  monthlyGrowth: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  // Breakdowns
  paymentRevenue: number;
  esportsRevenue: number;
  socialRevenue: number;
  paymentPending: number;
  esportsPending: number;
  socialPending: number;
  paymentTxCount: number;
  esportsTxCount: number;
  socialTxCount: number;
  // Additional
  totalPendingValue: number;
  avgTransactionValue: number;
  todayRevenue: number;
  weekRevenue: number;
}

interface SourceBreakdown {
  label: string;
  revenue: number;
  pending: number;
  transactions: number;
  icon: React.ReactNode;
  color: string;
  accent: string;
}

// ─── Animated Number ────────────────────────────────────────────────────────
const AnimatedNumber: React.FC<{ value: number; prefix?: string; suffix?: string; decimals?: number }> = ({
  value, prefix = '', suffix = '', decimals = 0
}) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const duration = 900;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * ease;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
  }, [value]);

  const formatted = display.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <span>{prefix}{formatted}{suffix}</span>;
};

// ─── Mini Sparkline (pure SVG, no library) ──────────────────────────────────
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 40 }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const w = 120, h = height;
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Radial Progress ────────────────────────────────────────────────────────
const RadialProgress: React.FC<{ value: number; max: number; color: string; size?: number }> = ({
  value, max, color, size = 56
}) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / (max || 1), 1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
};

// ─── Source Card ────────────────────────────────────────────────────────────
const SourceCard: React.FC<{ source: SourceBreakdown; total: number }> = ({ source, total }) => {
  const pct = total > 0 ? Math.round((source.revenue / total) * 100) : 0;
  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:scale-[1.01] cursor-default group ${source.color}`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at top right, ${source.accent}18 0%, transparent 70%)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg`} style={{ background: `${source.accent}20` }}>
          <div style={{ color: source.accent }}>{source.icon}</div>
        </div>
        <span className="text-xs font-mono text-zinc-500">{pct}% of total</span>
      </div>
      <p className="text-xs text-zinc-500 mb-0.5">{source.label}</p>
      <p className="text-xl font-bold text-white font-mono">₹{source.revenue.toLocaleString('en-IN')}</p>
      <div className="flex gap-3 mt-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {source.transactions} paid
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" /> {source.pending} pending
        </span>
      </div>
      <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: source.accent }}
        />
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const Overview: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats>({
    totalRevenue: 0, pendingOrders: 0, totalTransactions: 0, monthlyGrowth: 0,
    thisMonthRevenue: 0, lastMonthRevenue: 0,
    paymentRevenue: 0, esportsRevenue: 0, socialRevenue: 0,
    paymentPending: 0, esportsPending: 0, socialPending: 0,
    paymentTxCount: 0, esportsTxCount: 0, socialTxCount: 0,
    totalPendingValue: 0, avgTransactionValue: 0, todayRevenue: 0, weekRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fake sparkline data (replace with real daily data if available)
  const [sparkData] = useState(() => Array.from({ length: 12 }, () => Math.random() * 100));

  const fetchOverviewStats = async () => {
    try {
      setRefreshing(true);
      const [
        { data: paymentVerifications },
        { data: esportsPlayers },
        { data: socialOrders }
      ] = await Promise.all([
        supabase.from('payment_verifications').select('*'),
        supabase.from('esports_players').select('*'),
        supabase.from('social_media_orders').select('*')
      ]);

      const pv  = (paymentVerifications as any[]) || [];
      const ep  = (esportsPlayers as any[]) || [];
      const so  = (socialOrders as any[]) || [];

      // Revenue
      const paymentRevenue = pv.filter(p => p.payment_received).reduce((s, p) => s + (p.amount || 0), 0);
      const esportsRevenue = ep.filter(p => p.payment_received).reduce((s, p) => s + (p.entry_fees || 0), 0);
      const socialRevenue  = so.filter(o => o.payment_received).reduce((s, o) => s + (o.payment_amount || 0), 0);
      const totalRevenue   = paymentRevenue + esportsRevenue + socialRevenue;

      // Pending counts
      const paymentPending = pv.filter(p => !p.payment_received).length;
      const esportsPending = ep.filter(p => !p.payment_received).length;
      const socialPending  = so.filter(o => !o.payment_received).length;
      const pendingOrders  = paymentPending + esportsPending + socialPending;

      // Pending value
      const totalPendingValue =
        pv.filter(p => !p.payment_received).reduce((s, p) => s + (p.amount || 0), 0) +
        ep.filter(p => !p.payment_received).reduce((s, p) => s + (p.entry_fees || 0), 0) +
        so.filter(o => !o.payment_received).reduce((s, o) => s + (o.payment_amount || 0), 0);

      // Tx counts
      const paymentTxCount = pv.filter(p => p.payment_received).length;
      const esportsTxCount = ep.filter(p => p.payment_received).length;
      const socialTxCount  = so.filter(o => o.payment_received).length;
      const totalTransactions = paymentTxCount + esportsTxCount + socialTxCount;
      const avgTransactionValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

      // Time ranges
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7); const weekISO = startOfWeek.toISOString();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const sumRevenue = (arr: any[], dateField: string, from: string, to?: string) =>
        arr.filter(x => x.payment_received && x[dateField] && x[dateField] >= from && (!to || x[dateField] < to))
           .reduce((s, x) => s + (x.amount || x.entry_fees || x.payment_amount || 0), 0);

      const thisMonthRevenue =
        sumRevenue(pv, 'verified_at', firstDayThisMonth) +
        sumRevenue(ep, 'created_at', firstDayThisMonth) +
        sumRevenue(so, 'created_at', firstDayThisMonth);

      const lastMonthRevenue =
        sumRevenue(pv, 'verified_at', firstDayLastMonth, firstDayThisMonth) +
        sumRevenue(ep, 'created_at', firstDayLastMonth, firstDayThisMonth) +
        sumRevenue(so, 'created_at', firstDayLastMonth, firstDayThisMonth);

      const weekRevenue =
        sumRevenue(pv, 'verified_at', weekISO) +
        sumRevenue(ep, 'created_at', weekISO) +
        sumRevenue(so, 'created_at', weekISO);

      const todayRevenue =
        sumRevenue(pv, 'verified_at', startOfToday) +
        sumRevenue(ep, 'created_at', startOfToday) +
        sumRevenue(so, 'created_at', startOfToday);

      const monthlyGrowth = lastMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : (thisMonthRevenue > 0 ? 100 : 0);

      setStats({
        totalRevenue, pendingOrders, totalTransactions, monthlyGrowth,
        thisMonthRevenue, lastMonthRevenue,
        paymentRevenue, esportsRevenue, socialRevenue,
        paymentPending, esportsPending, socialPending,
        paymentTxCount, esportsTxCount, socialTxCount,
        totalPendingValue, avgTransactionValue, todayRevenue, weekRevenue,
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverviewStats();
    const interval = setInterval(fetchOverviewStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const sources: SourceBreakdown[] = [
    {
      label: 'Payment Verifications',
      revenue: stats.paymentRevenue,
      pending: stats.paymentPending,
      transactions: stats.paymentTxCount,
      icon: <CreditCard className="w-4 h-4" />,
      color: 'border-sky-500/20 bg-sky-950/10',
      accent: '#38bdf8',
    },
    {
      label: 'Esports Players',
      revenue: stats.esportsRevenue,
      pending: stats.esportsPending,
      transactions: stats.esportsTxCount,
      icon: <Gamepad2 className="w-4 h-4" />,
      color: 'border-violet-500/20 bg-violet-950/10',
      accent: '#a78bfa',
    },
    {
      label: 'Social Media Orders',
      revenue: stats.socialRevenue,
      pending: stats.socialPending,
      transactions: stats.socialTxCount,
      icon: <Share2 className="w-4 h-4" />,
      color: 'border-rose-500/20 bg-rose-950/10',
      accent: '#fb7185',
    },
  ];

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <ModuleLayout title="Overview" description="Performance metrics at a glance">
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-28 rounded-xl border border-white/8 bg-white/3 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 rounded-xl border border-white/8 bg-white/3 animate-pulse" />
            ))}
          </div>
        </div>
      </ModuleLayout>
    );
  }

  const growthPositive = stats.monthlyGrowth >= 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ModuleLayout
      title="Overview"
      description="Live performance metrics across all revenue sources"
      actions={
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-zinc-600 hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline" size="sm"
            onClick={fetchOverviewStats}
            disabled={refreshing}
            className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      }
    >

      {/* ── Today / Week callout strip ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-950/20 text-amber-300 text-xs">
          <Flame className="w-3.5 h-3.5" />
          <span>Today: <strong>₹{stats.todayRevenue.toLocaleString('en-IN')}</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-950/20 text-indigo-300 text-xs">
          <Calendar className="w-3.5 h-3.5" />
          <span>This week: <strong>₹{stats.weekRevenue.toLocaleString('en-IN')}</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-zinc-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>Pending value: <strong className="text-amber-300">₹{stats.totalPendingValue.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* ── Primary KPI row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">

        {/* Total Revenue */}
        <Card className="col-span-2 md:col-span-1 relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-transparent hover:border-emerald-500/40 transition-all duration-300 group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-zinc-500 mb-0.5">Total Revenue</p>
            <p className="text-2xl font-bold text-white font-mono">
              ₹<AnimatedNumber value={stats.totalRevenue} />
            </p>
            <div className="mt-3 opacity-60">
              <Sparkline data={sparkData} color="#34d399" height={32} />
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-transparent hover:border-amber-500/40 transition-all duration-300 group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
              </div>
              <RadialProgress value={stats.pendingOrders} max={stats.pendingOrders + stats.totalTransactions} color="#f59e0b" size={36} />
            </div>
            <p className="text-xs text-zinc-500 mb-0.5">Pending Orders</p>
            <p className="text-2xl font-bold text-white font-mono">
              <AnimatedNumber value={stats.pendingOrders} />
            </p>
            <p className="text-xs text-zinc-600 mt-1">across all sources</p>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card className="relative overflow-hidden border-sky-500/20 bg-gradient-to-br from-sky-950/30 to-transparent hover:border-sky-500/40 transition-all duration-300 group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-sky-500/10">
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <Badge className="text-xs bg-sky-500/15 text-sky-400 border-sky-500/30 border">
                avg ₹{stats.avgTransactionValue.toLocaleString('en-IN')}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 mb-0.5">Transactions</p>
            <p className="text-2xl font-bold text-white font-mono">
              <AnimatedNumber value={stats.totalTransactions} />
            </p>
            <p className="text-xs text-zinc-600 mt-1">avg ₹{stats.avgTransactionValue.toLocaleString('en-IN')} / txn</p>
          </CardContent>
        </Card>

        {/* Monthly Growth */}
        <Card className={`relative overflow-hidden transition-all duration-300 group ${
          growthPositive
            ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-transparent hover:border-emerald-500/40'
            : 'border-red-500/20 bg-gradient-to-br from-red-950/20 to-transparent hover:border-red-500/40'
        }`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${growthPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {growthPositive
                  ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                  : <TrendingDown className="w-4 h-4 text-red-400" />}
              </div>
              <div className="text-right">
                <span className={`text-xs ${growthPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  vs last month
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mb-0.5">Monthly Growth</p>
            <p className={`text-2xl font-bold font-mono ${growthPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {growthPositive ? '+' : ''}<AnimatedNumber value={stats.monthlyGrowth} suffix="%" />
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              ₹{stats.thisMonthRevenue.toLocaleString('en-IN')} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Monthly comparison bar ─────────────────────────────────────── */}
      <Card className="mb-4 border-white/8 bg-white/3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Monthly Revenue Comparison</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-zinc-600" /> Last month
              </span>
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> This month
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {/* Last month bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-600 w-20 shrink-0 text-right">Last</span>
              <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-zinc-600 transition-all duration-1000"
                  style={{ width: `${stats.lastMonthRevenue > 0 ? Math.min((stats.lastMonthRevenue / Math.max(stats.lastMonthRevenue, stats.thisMonthRevenue)) * 100, 100) : 0}%` }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-400 w-24 shrink-0">
                ₹{stats.lastMonthRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            {/* This month bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-20 shrink-0 text-right">Current</span>
              <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                  style={{ width: `${stats.thisMonthRevenue > 0 ? Math.min((stats.thisMonthRevenue / Math.max(stats.lastMonthRevenue, stats.thisMonthRevenue)) * 100, 100) : 0}%` }}
                />
              </div>
              <span className="text-xs font-mono text-white w-24 shrink-0">
                ₹{stats.thisMonthRevenue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

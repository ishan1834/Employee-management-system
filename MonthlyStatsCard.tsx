// ============================================================
// PART 1 — CORE SETUP + HELPERS (Enhanced)
// ============================================================

import React, { useMemo, useState, useCallback } from 'react';

/* ============================================================ */
/* UI COMPONENTS                                                */
/* ============================================================ */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Progress } from '@/components/ui/progress';

/* ============================================================ */
/* ICONS                                                        */
/* ============================================================ */

import {
  CalendarIcon,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Clock,
  Award,
  Download,
  RefreshCcw,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  History,
  LayoutDashboard,
} from 'lucide-react';

/* ============================================================ */
/* LIBRARIES                                                    */
/* ============================================================ */

import {
  format,
  getDaysInMonth,
  lastDayOfMonth,
  isSameMonth,
  startOfMonth,
  eachDayOfInterval,
} from 'date-fns';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { CHART_COLORS } from './types';

/* ============================================================ */
/* TYPES                                                        */
/* ============================================================ */

interface MonthlyStats {
  present: number;
  late: number;
  absent: number;
  totalDays: number;
  score: number;
  percentage: number;
}

interface Props {
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  myStats: MonthlyStats;
}

/* ============================================================ */
/* HELPERS (IMPROVED)                                           */
/* ============================================================ */

/**
 * Safe percentage calculator
 */
const calculateRatio = (value: number, total: number): number => {
  if (!total || total <= 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Performance label (clean mapping)
 */
const PERFORMANCE_LEVELS = [
  { min: 85, label: "Excellent", color: "text-emerald-400" },
  { min: 70, label: "Good", color: "text-blue-400" },
  { min: 50, label: "Average", color: "text-amber-400" },
  { min: 0, label: "Poor", color: "text-rose-400" },
];

const getPerformanceMeta = (percentage: number) => {
  return PERFORMANCE_LEVELS.find(level => percentage >= level.min)!;
};

/**
 * Stable export handler (NEW)
 */
const useExportHandler = () => {
  const [isExporting, setIsExporting] = useState(false);

  const triggerExport = useCallback(() => {
    setIsExporting(true);

    setTimeout(() => {
      setIsExporting(false);
    }, 1500);
  }, []);

  return { isExporting, triggerExport };
};
// ============================================================
// PART 2 — UI COMPONENTS (Enhanced)
// ============================================================

/* ============================================================ */
/* TYPES FOR COMPONENTS                                         */
/* ============================================================ */

interface TrendBadgeProps {
  value: number;
}

interface StatBoxProps {
  label: string;
  value: string | number;
  colorClass: string;
  icon?: React.ElementType;
  trend?: number;
}

/* ============================================================ */
/* TREND BADGE (IMPROVED)                                       */
/* ============================================================ */

/**
 * Professional trend indicator
 * - supports positive / negative / neutral
 */
const TrendBadge: React.FC<TrendBadgeProps> = ({ value }) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <div
      className={`
        flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
        transition-all duration-300
        ${isNeutral 
          ? 'bg-gray-500/10 text-gray-400'
          : isPositive
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-rose-500/10 text-rose-400'}
      `}
    >
      {isPositive && <ArrowUpRight className="h-3 w-3" />}
      {!isPositive && !isNeutral && (
        <TrendingUp className="h-3 w-3 rotate-180" />
      )}

      {isNeutral ? '0%' : `${Math.abs(value)}%`} vs last month
    </div>
  );
};

/* ============================================================ */
/* STAT BOX (MAJOR UPGRADE)                                     */
/* ============================================================ */

/**
 * Premium stat card with:
 * - hover glow
 * - background icon layer
 * - animated transitions
 */
const StatBox: React.FC<StatBoxProps> = ({
  label,
  value,
  colorClass,
  icon: Icon,
  trend,
}) => {
  return (
    <div
      className={`
        group relative overflow-hidden p-5 rounded-2xl border
        transition-all duration-500 ease-out
        hover:-translate-y-1.5 hover:scale-[1.02]
        hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.35)]
        ${colorClass}
      `}
    >
      {/* CONTENT */}
      <div className="flex justify-between items-start relative z-10">

        {/* LEFT SIDE */}
        <div className="space-y-1">
          <p className="text-3xl font-black tracking-tight">
            {value}
          </p>

          <div className="flex items-center gap-2">
            <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">
              {label}
            </p>

            {typeof trend === 'number' && (
              <TrendBadge value={trend} />
            )}
          </div>
        </div>

        {/* ICON */}
        <div className="
          p-2.5 rounded-xl bg-white/5 border border-white/10
          transition-transform duration-300
          group-hover:scale-110 group-hover:rotate-6
        ">
          {Icon && <Icon className="h-5 w-5" />}
        </div>
      </div>

      {/* BACKGROUND ICON (DECORATIVE LAYER) */}
      {Icon && (
        <div className="
          absolute -right-4 -bottom-4 opacity-[0.04]
          group-hover:opacity-[0.08]
          transition-opacity duration-500
        ">
          <Icon className="h-28 w-28" />
        </div>
      )}

      {/* GLOW EFFECT */}
      <div className="
        absolute inset-0 rounded-2xl
        opacity-0 group-hover:opacity-100
        transition-opacity duration-500
        bg-gradient-to-br from-blue-500/10 to-transparent
        pointer-events-none
      " />
    </div>
  );
};
// ============================================================
// PART 3 — MAIN COMPONENT (Final)
// ============================================================

import React, { useMemo } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';

import {
  CalendarIcon, Download, RefreshCcw, LayoutDashboard, History
} from 'lucide-react';

import {
  format, startOfMonth, lastDayOfMonth, eachDayOfInterval
} from 'date-fns';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';

import { CHART_COLORS } from './types';

/* ===== IMPORT FROM PART 1 & 2 ===== */
 // assume these are in same file or imported
 // getPerformanceMeta, useExportHandler, calculateRatio
 // StatBox, TrendBadge

/* ============================================================ */
/* MAIN COMPONENT                                               */
/* ============================================================ */

const StrategicDashboard: React.FC<Props> = ({
  selectedMonth,
  setSelectedMonth,
  myStats,
}) => {

  const { isExporting, triggerExport } = useExportHandler();

  /* ========================= */
  /* DERIVED VALUES            */
  /* ========================= */

  const performanceMeta = useMemo(
    () => getPerformanceMeta(myStats.percentage),
    [myStats.percentage]
  );

  const chartData = useMemo(() => [
    { name: 'Present', value: myStats.present },
    { name: 'Late', value: myStats.late },
    { name: 'Absent', value: myStats.absent },
  ], [myStats]);

  const heatmapDays = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = lastDayOfMonth(selectedMonth);

    return eachDayOfInterval({ start, end });
  }, [selectedMonth]);

  /* ========================= */
  /* RENDER                    */
  /* ========================= */

  return (
    <div className="p-6 space-y-6">

      {/* ===================================================== */}
      {/* HEADER                                                */}
      {/* ===================================================== */}

      <div className="flex justify-between items-center">

        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboard className="text-blue-500" />
          Strategic Dashboard
        </h1>

        <div className="flex gap-2">

          {/* DATE PICKER */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedMonth, 'MMM yyyy')}
              </Button>
            </PopoverTrigger>

            <PopoverContent>
              <Calendar
                mode="single"
                selected={selectedMonth}
                onSelect={(d)=>d && setSelectedMonth(d)}
              />
            </PopoverContent>
          </Popover>

          {/* EXPORT */}
          <Button onClick={triggerExport}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>

          {/* REFRESH */}
          <Button variant="outline">
            <RefreshCcw className="h-4 w-4" />
          </Button>

        </div>

      </div>

      {/* ===================================================== */}
      {/* STATS GRID                                            */}
      {/* ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <StatBox
          label="Present"
          value={myStats.present}
          colorClass="bg-emerald-500/10 border-emerald-500/20"
        />

        <StatBox
          label="Late"
          value={myStats.late}
          colorClass="bg-yellow-500/10 border-yellow-500/20"
        />

        <StatBox
          label="Absent"
          value={myStats.absent}
          colorClass="bg-rose-500/10 border-rose-500/20"
        />

        <StatBox
          label="Performance"
          value={`${myStats.percentage}%`}
          colorClass="bg-blue-500/10 border-blue-500/20"
        />

      </div>

      {/* ===================================================== */}
      {/* PERFORMANCE + CHART                                   */}
      {/* ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* PERFORMANCE */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Monthly efficiency score
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            <div className="flex justify-between">
              <span>Score</span>
              <span className={performanceMeta.color}>
                {performanceMeta.label}
              </span>
            </div>

            <Progress value={myStats.percentage} />

          </CardContent>
        </Card>

        {/* PIE CHART */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
          </CardHeader>

          <CardContent className="h-60">

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  outerRadius={80}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

          </CardContent>
        </Card>

      </div>

      {/* ===================================================== */}
      {/* HEATMAP (NEW FEATURE)                                 */}
      {/* ===================================================== */}

      <Card>
        <CardHeader>
          <CardTitle>Monthly Activity</CardTitle>
          <CardDescription>
            Daily attendance overview
          </CardDescription>
        </CardHeader>

        <CardContent>

          <div className="grid grid-cols-7 gap-2">
            {heatmapDays.map((day, i) => (
              <div
                key={i}
                className="
                  h-8 rounded-md bg-gray-800
                  hover:bg-blue-500 transition
                "
                title={format(day, 'dd MMM')}
              />
            ))}
          </div>

        </CardContent>
      </Card>

      {/* ===================================================== */}
      {/* FOOTER                                                */}
      {/* ===================================================== */}

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Last updated just now</span>
        <span className="flex items-center gap-1">
          <History className="h-3 w-3" />
          Auto-sync enabled
        </span>
      </div>

    </div>
  );
};

export default StrategicDashboard;

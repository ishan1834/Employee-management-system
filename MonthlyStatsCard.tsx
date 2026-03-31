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

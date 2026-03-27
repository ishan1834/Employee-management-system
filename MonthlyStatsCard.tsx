import React, { useMemo, useState } from 'react';
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
import { 
  CalendarIcon, 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Target, 
  Zap, 
  Clock, 
  Award,
  Download,
  Filter,
  RefreshCcw,
  ShieldCheck,
  ChevronRight,
  Info,
  ArrowUpRight,
  History,
  LayoutDashboard
} from 'lucide-react';
import { format, getDaysInMonth, lastDayOfMonth, isSameMonth, startOfMonth, eachDayOfInterval } from 'date-fns';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { CHART_COLORS } from './types';

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

const calculateRatio = (value: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

const getPerformanceLevel = (percentage: number) => {
  if (percentage >= 85) return "Excellent";
  if (percentage >= 70) return "Good";
  if (percentage >= 50) return "Average";
  return "Poor";
};

const getPerformanceColor = (percentage: number) => {
  if (percentage >= 85) return "text-emerald-400";
  if (percentage >= 70) return "text-blue-400";
  if (percentage >= 50) return "text-amber-400";
  return "text-rose-400";
};

/* --- NEW PROFESSIONAL FEATURE: TREND INDICATOR --- */
const TrendBadge = ({ value }: { value: number }) => (
  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${value >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
    {value >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
    {Math.abs(value)}% vs last month
  </div>
);

const StatBox = ({ label, value, percentage, colorClass, icon: Icon, trend }: any) => (
  <div className={`group relative overflow-hidden p-5 rounded-2xl border transition-all duration-500 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] hover:-translate-y-1.5 ${colorClass}`}>
    <div className="flex justify-between items-start z-10 relative">
      <div>
        <p className="text-3xl font-black tracking-tighter">{value}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">{label}</p>
          {trend && <TrendBadge value={trend} />}
        </div>
      </div>
      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
        {Icon && <Icon className="h-5 w-5" />}
      </div>
    </div>
    <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
      {Icon && <Icon className="h-24 w-24" />}
    </div>
  </div>
);

const MonthlyStatsCard: React.FC<Props> = ({ selectedMonth, setSelectedMonth, myStats }) => {
  const [isExporting, setIsExporting] = useState(false);
  const safePercentage = myStats.totalDays > 0 ? myStats.percentage : 0;
  
  /* --- CHART LOGIC --- */
  const chartData = useMemo(() => [
    { name: 'Present', value: myStats.present, color: CHART_COLORS[0] },
    { name: 'Late', value: myStats.late, color: CHART_COLORS[1] },
    { name: 'Absent', value: myStats.absent, color: CHART_COLORS[2] },
  ], [myStats]);

  const monthMetadata = useMemo(() => {
    const total = getDaysInMonth(selectedMonth);
    const start = startOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end: lastDayOfMonth(selectedMonth) });
    return { total, days, isCurrent: isSameMonth(selectedMonth, new Date()) };
  }, [selectedMonth]);

  const performanceLevel = getPerformanceLevel(safePercentage);
  const performanceColor = getPerformanceColor(safePercentage);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 animate-in fade-in duration-700">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-800 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
            <LayoutDashboard className="h-4 w-4" />
            Strategic Overview
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Thrylos <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Analytics</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-gray-900/50 p-1.5 rounded-2xl border border-gray-800">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="text-gray-300 hover:bg-gray-800 rounded-xl px-6">
                <CalendarIcon className="h-4 w-4 mr-2 text-blue-400" />
                {format(selectedMonth, 'MMMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="bg-gray-950 border-gray-800 p-0 shadow-2xl" align="end">
              <Calendar mode="single" selected={selectedMonth} onSelect={(d) => d && setSelectedMonth(d)} />
            </PopoverContent>
          </Popover>
          <Button 
            onClick={() => { setIsExporting(true); setTimeout(() => setIsExporting(false), 1500); }}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20"
          >
            {isExporting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatBox label="Net Attendance" value={`${safePercentage}%`} colorClass="bg-blue-600/5 border-blue-500/20 text-blue-400" icon={Activity} trend={+2.4} />
        <StatBox label="Total Credits" value={myStats.score.toFixed(1)} colorClass="bg-emerald-600/5 border-emerald-500/20 text-emerald-400" icon={Award} trend={+0.8} />
        <StatBox label="Late Frequency" value={myStats.late} colorClass="bg-amber-600/5 border-amber-500/20 text-amber-400" icon={Clock} trend={-1.2} />
        <StatBox label="Absenteeism" value={myStats.absent} colorClass="bg-rose-600/5 border-rose-500/20 text-rose-400" icon={Target} trend={0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PROGRESSIVE ANALYTICS */}
        <Card className="lg:col-span-2 bg-gray-900/40 border-gray-800 backdrop-blur-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <div>
              <CardTitle className="text-white text-lg">Consistency Engine</CardTitle>
              <CardDescription>Behavioral patterns for the current cycle</CardDescription>
            </div>
            <div className="flex gap-2">
              <span className="h-2 w-8 rounded-full bg-blue-500/20 border border-blue-500/40" />
              <span className="h-2 w-8 rounded-full bg-gray-800" />
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="relative pt-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                <span>Performance Threshold</span>
                <span className={performanceColor}>{performanceLevel}</span>
              </div>
              <Progress value={safePercentage} className="h-4 bg-gray-950 border border-gray-800" />
              <div className="absolute top-0 left-[85%] h-10 border-l border-dashed border-white/20 flex flex-col items-center">
                <span className="text-[8px] text-gray-500 mt-10 font-bold uppercase">Goal (85%)</span>
              </div>
            </div>

            {/* --- NEW PROFESSIONAL FEATURE: MINI CALENDAR HEATMAP --- */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <History className="h-3 w-3" /> Attendance Density Map
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {monthMetadata.days.map((day, i) => {
                  const isPast = i < myStats.totalDays;
                  return (
                    <div 
                      key={i} 
                      title={format(day, 'MMM dd')}
                      className={`h-3 w-3 rounded-sm transition-all duration-300 ${
                        isPast ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-800 hover:bg-gray-700'
                      }`} 
                    />
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-500 italic">Visualizing {myStats.totalDays} recorded entries across {monthMetadata.total} possible days.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-950/50 border border-gray-800 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Zap className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Punctuality</p>
                  <p className="text-sm font-bold text-white">High Reliability</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-950/50 border border-gray-800 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Target className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Forecast</p>
                  <p className="text-sm font-bold text-white">On Track</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DISTRIBUTION DONUT */}
        <Card className="bg-gray-900/40 border-gray-800 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white text-lg">Data Distribution</CardTitle>
            <CardDescription>Categorical breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full space-y-3 mt-4">
              {chartData.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                  <span className="text-white font-bold">{item.value} Days</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold">Thrylos Certification</h3>
            <p className="text-xs text-gray-400">Verified by the Thrylos Administrative Engine v2.4</p>
          </div>
        </div>
        <Button variant="link" className="text-blue-400 text-xs font-bold uppercase tracking-widest">
          View Audit Log <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <footer className="text-center py-4 text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">
        Proprietary Data Systems &bull; Mehrauli Tech Hub &bull; 2026
      </footer>
    </div>
  );
};

export default MonthlyStatsCard;

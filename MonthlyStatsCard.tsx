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
  Info
} from 'lucide-react';
import { format, getDaysInMonth, lastDayOfMonth, isSameMonth } from 'date-fns';

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
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
  if (percentage >= 85) return "text-green-400";
  if (percentage >= 70) return "text-blue-400";
  if (percentage >= 50) return "text-yellow-400";
  return "text-red-400";
};

const StatBox = ({
  label,
  value,
  percentage,
  colorClass,
  icon: Icon
}: {
  label: string;
  value: number;
  percentage?: number;
  colorClass: string;
  icon?: any;
}) => {
  return (
    <div className={`relative overflow-hidden p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${colorClass}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          {percentage !== undefined && (
            <p className="text-[10px] opacity-70 font-medium">{percentage}% of Month</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-white/10">
          {Icon && <Icon className="h-4 w-4" />}
        </div>
      </div>
      <p className="text-xs opacity-80 mt-2 uppercase tracking-widest font-bold">{label}</p>
    </div>
  );
};

const SummaryRow = ({
  label,
  value,
  isLast = false
}: {
  label: string;
  value: React.ReactNode;
  isLast?: boolean;
}) => (
  <div className={`flex justify-between items-center py-3 ${!isLast ? 'border-b border-gray-700/30' : ''}`}>
    <span className="text-sm text-gray-400 flex items-center gap-2">
      <ChevronRight className="h-3 w-3 text-blue-500" />
      {label}
    </span>
    <span className="text-sm text-white font-semibold">{value}</span>
  </div>
);

const MonthlyStatsCard: React.FC<Props> = ({
  selectedMonth,
  setSelectedMonth,
  myStats,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const safePercentage = myStats.totalDays > 0 ? myStats.percentage : 0;
  
  const chartData = useMemo(() => [
    { name: 'Present', value: myStats.present, color: CHART_COLORS[0] },
    { name: 'Late', value: myStats.late, color: CHART_COLORS[1] },
    { name: 'Absent', value: myStats.absent, color: CHART_COLORS[2] },
  ], [myStats]);

  const presentRatio = calculateRatio(myStats.present, myStats.totalDays);
  const lateRatio = calculateRatio(myStats.late, myStats.totalDays);
  const absentRatio = calculateRatio(myStats.absent, myStats.totalDays);
  const performanceLevel = getPerformanceLevel(safePercentage);
  const performanceColor = getPerformanceColor(safePercentage);

  const monthMetadata = useMemo(() => {
    const total = getDaysInMonth(selectedMonth);
    const lastDay = lastDayOfMonth(selectedMonth);
    const isCurrent = isSameMonth(selectedMonth, new Date());
    return { total, lastDay, isCurrent };
  }, [selectedMonth]);

  const daysRemaining = Math.max(0, monthMetadata.total - myStats.totalDays);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  const isEmpty = myStats.present === 0 && myStats.late === 0 && myStats.absent === 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-blue-500" />
            Thrylos Intelligence
          </h1>
          <p className="text-sm text-gray-400">Advanced attendance tracking and behavioral insights</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="bg-gray-800/50 border-gray-700 text-xs">
            <Filter className="h-3 w-3 mr-2" /> Filter
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
          >
            <Download className={`h-3.3 w-3.3 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Activity className="h-64 w-64 text-blue-500" />
        </div>

        <CardHeader className="border-b border-gray-800/50 pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Monthly Analytics Engine
              </CardTitle>
              <CardDescription className="text-gray-500 font-medium">
                Analysis period: {format(selectedMonth, 'MMMM 01')} — {format(monthMetadata.lastDay, 'MMMM dd, yyyy')}
              </CardDescription>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedMonth, 'MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-gray-950 border-gray-800 p-0 shadow-2xl" align="end">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(d) => d && setSelectedMonth(d)}
                  className="rounded-md border-none"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="w-20 h-20 rounded-full bg-gray-800/30 flex items-center justify-center mb-4">
                <Info className="h-10 w-10 opacity-20" />
              </div>
              <h3 className="text-lg font-semibold text-gray-400">No Data Detected</h3>
              <p className="text-sm">Please select a month with active records.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatBox label="Present" value={myStats.present} percentage={presentRatio} colorClass="bg-blue-500/10 border-blue-500/20 text-blue-400" icon={Zap} />
                <StatBox label="Late Arrival" value={myStats.late} percentage={lateRatio} colorClass="bg-amber-500/10 border-amber-500/20 text-amber-400" icon={Clock} />
                <StatBox label="Unexcused" value={myStats.absent} percentage={absentRatio} colorClass="bg-rose-500/10 border-rose-500/20 text-rose-400" icon={Target} />
                <StatBox label="Trust Score" value={Math.round(safePercentage)} colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" icon={Award} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-8">
                  <div className="p-6 rounded-2xl bg-gray-800/20 border border-gray-700/40">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-gray-300 uppercase tracking-tighter">Performance Integrity</span>
                      <span className={`text-sm font-black ${performanceColor}`}>{safePercentage}%</span>
                    </div>
                    <Progress value={safePercentage} className="h-3 bg-gray-900 shadow-inner" />
                    <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <TrendingUp className="h-5 w-5 text-blue-400 shrink-0" />
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Your attendance shows <span className="text-blue-300 font-bold">{performanceLevel}</span> stability. 
                        To reach a 95% threshold, ensure no more than 1 late arrival in the remaining {daysRemaining} days.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold text-gray-500 uppercase px-1 mb-2">Detailed Metrics</h4>
                      <SummaryRow label="Reported Days" value={myStats.totalDays} />
                      <SummaryRow label="Weighted Score" value={myStats.score.toFixed(2)} />
                      <SummaryRow label="Punctuality Rate" value={`${100 - lateRatio}%`} />
                      <SummaryRow label="Status" value={monthMetadata.isCurrent ? "Active" : "Archived"} isLast={true} />
                    </div>
                    <div className="bg-gray-800/30 rounded-xl p-5 border border-gray-700/30">
                      <h4 className="text-[11px] font-bold text-gray-500 uppercase mb-4 tracking-widest">Efficiency Tips</h4>
                      <ul className="space-y-3">
                        <li className="text-[11px] text-gray-400 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Log entries before 9:00 AM
                        </li>
                        <li className="text-[11px] text-gray-400 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Review weekly absent patterns
                        </li>
                        <li className="text-[11px] text-gray-400 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Maintain streak for Bonus Points
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-center items-center bg-gray-950/40 rounded-3xl border border-gray-800 p-6">
                   <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={100}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '12px', color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {chartData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="bg-gray-950/50 border-t border-gray-800 px-8 py-4 flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Engine: v2.4.0</span>
            <span>Ref: {selectedMonth.getTime()}</span>
          </div>
          <span>&copy; 2026 Thrylos Systems</span>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MonthlyStatsCard;

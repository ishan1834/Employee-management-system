import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Award 
} from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';

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
    <div className={`relative overflow-hidden p-4 rounded-xl border transition-all hover:scale-[1.02] ${colorClass}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          {percentage !== undefined && (
            <p className="text-[10px] opacity-70">{percentage}% of total</p>
          )}
        </div>
        {Icon && <Icon className="h-4 w-4 opacity-50" />}
      </div>
      <p className="text-xs opacity-80 mt-1 uppercase tracking-wider font-semibold">{label}</p>
    </div>
  );
};

const InsightBox = ({
  title,
  value,
  icon: Icon
}: {
  title: string;
  value: string;
  icon?: any;
}) => (
  <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center gap-3">
    {Icon && <Icon className="h-4 w-4 text-blue-400" />}
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{title}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  </div>
);

const SummaryRow = ({
  label,
  value,
  isLast = false
}: {
  label: string;
  value: React.ReactNode;
  isLast?: boolean;
}) => (
  <div className={`flex justify-between items-center py-2 ${!isLast ? 'border-b border-gray-700/50' : ''}`}>
    <span className="text-sm text-gray-400">{label}</span>
    <span className="text-sm text-white font-medium">{value}</span>
  </div>
);

const MonthlyStatsCard: React.FC<Props> = ({
  selectedMonth,
  setSelectedMonth,
  myStats,
}) => {
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

  const daysRemaining = useMemo(() => {
    const total = getDaysInMonth(selectedMonth);
    return Math.max(0, total - myStats.totalDays);
  }, [selectedMonth, myStats.totalDays]);

  const projectedAttendance = useMemo(() => {
    if (myStats.totalDays === 0) return 0;
    const currentRate = myStats.present / myStats.totalDays;
    const monthTotal = getDaysInMonth(selectedMonth);
    return Math.round(currentRate * monthTotal);
  }, [myStats, selectedMonth]);

  const attendanceMessage = useMemo(() => {
    if (safePercentage >= 85) return "Outstanding performance 🚀";
    if (safePercentage >= 70) return "Keep pushing forward 👍";
    if (safePercentage >= 50) return "Consistency needed ⚡";
    return "Focus required ⚠️";
  }, [safePercentage]);

  const isEmpty = myStats.present === 0 && myStats.late === 0 && myStats.absent === 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-white text-xl">
                <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                Performance Dashboard
              </CardTitle>
              <CardDescription className="text-gray-400 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Data for {format(selectedMonth, 'MMMM yyyy')}
              </CardDescription>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Select Month
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-gray-900 border-gray-800 p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(d) => d && setSelectedMonth(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-3">
              <div className="p-4 rounded-full bg-gray-800/50">
                <BarChart3 className="h-8 w-8 opacity-20" />
              </div>
              <p className="text-sm font-medium">No activity recorded for this period</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatBox label="Present" value={myStats.present} percentage={presentRatio} colorClass="bg-blue-500/10 border-blue-500/20 text-blue-400" icon={Zap} />
                <StatBox label="Late" value={myStats.late} percentage={lateRatio} colorClass="bg-yellow-500/10 border-yellow-500/20 text-yellow-400" icon={Clock} />
                <StatBox label="Absent" value={myStats.absent} percentage={absentRatio} colorClass="bg-red-500/10 border-red-500/20 text-red-400" icon={Target} />
                <StatBox label="Score" value={Math.round(safePercentage)} colorClass="bg-indigo-500/10 border-indigo-500/20 text-indigo-400" icon={Award} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end text-sm">
                      <span className="text-gray-400 font-medium">Monthly Progress</span>
                      <span className="text-white font-bold">{safePercentage}%</span>
                    </div>
                    <Progress value={safePercentage} className="h-2.5 bg-gray-800" />
                    <div className="flex justify-between items-center pt-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded bg-gray-800 ${performanceColor}`}>
                        {performanceLevel.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-gray-500 italic">{attendanceMessage}</span>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 space-y-1">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                      <Target className="h-3 w-3" /> Monthly Breakdown
                    </h4>
                    <SummaryRow label="Total Working Days" value={myStats.totalDays} />
                    <SummaryRow label="Points Earned" value={myStats.score.toFixed(1)} />
                    <SummaryRow label="Month Projection" value={`${projectedAttendance} days`} />
                    <SummaryRow label="Days Remaining" value={daysRemaining} isLast={true} />
                  </div>
                </div>

                <div className="bg-gray-800/20 rounded-xl border border-gray-700/50 p-4">
                   <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          dataKey="value"
                          paddingAngle={8}
                        >
                          {chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {chartData.map((item, idx) => (
                      <div key={idx} className="text-center">
                        <div className="text-[10px] text-gray-500">{item.name}</div>
                        <div className="text-xs font-bold" style={{ color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
                <InsightBox title="Performance" value={performanceLevel} icon={TrendingUp} />
                <InsightBox title="Consistency" value={safePercentage > 80 ? "High" : "Moderate"} icon={Activity} />
                <InsightBox title="Status" value={daysRemaining > 0 ? "In Progress" : "Complete"} icon={Target} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyStatsCard;

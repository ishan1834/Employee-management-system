
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Download, Activity, Clock, FileText, User, Bell, Upload,
  CheckCircle, LogIn, Calendar as CalendarIcon, Shield, Award, Database,
  BarChart3, TrendingUp, Volume2, VolumeX, Search, Filter, RefreshCw,
  AlertCircle, Eye, EyeOff, ChevronDown, ChevronUp, Zap, Star,
  MessageSquare, Settings, Info, Hash, Globe, Lock, Unlock,
  ArrowUpRight, ArrowDownRight, Minus, MoreHorizontal, Copy,
  Trash2, Archive, Flag, BookOpen, Layers, Grid, List,
  PieChart as PieChartIcon, LineChart as LineChartIcon, X,
  Users, UserCheck, UserX, TrendingDown, AlertTriangle, Cpu,
  HardDrive, Network, Terminal, GitBranch, Package, Wifi
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  format, subDays, startOfDay, endOfDay, differenceInMinutes,
  differenceInHours, isToday, isYesterday, parseISO, startOfWeek,
  endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addDays, subWeeks, subMonths
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart,
  Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, ComposedChart, Legend, ReferenceLine
} from 'recharts';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { toast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

type Severity = 'low' | 'medium' | 'high' | 'critical';
type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

/* =========================
   Core Entities
========================= */

interface Admin {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  is_active?: boolean;
  last_activity?: string;
}

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  details: any;
  created_at: string;

  ip_address?: string;
  user_agent?: string;
  session_id?: string;

  severity?: Severity;
  category?: string;

  admin?: Pick<Admin, 'name' | 'role' | 'avatar_url'>;
}

/* =========================
   Analytics & Metrics
========================= */

interface DailyActivity {
  date: string;
  count: number;
  successful?: number;
  failed?: number;
}

interface ActionBreakdown {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

interface HeatmapCell {
  hour: number;
  day: string;
  value: number;
}

interface ActivityMetrics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;

  avgPerDay: number;
  growthRate: number;

  mostActiveHour: number;
  mostActiveDay: string;
  peakDay: string;

  topAction: string;
  criticalActions: number;
  uniqueAdmins: number;
}

interface AdminStats {
  id: string;
  name: string;
  role: string;

  activityCount: number;
  lastActive: string;
  topAction: string;
  activityTrend: number;
}

/* =========================
   UI & Filters
========================= */

interface FilterState {
  search: string;
  category: string;
  severity: Severity | '';

  dateRange: DateRange;
  startDate: Date;
  endDate: Date;
}

interface RealTimeStats {
  activeSessions: number;
  actionsLastHour: number;
  actionsLastMinute: number;
  onlineAdmins: string[];
}
// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6',
  '#a855f7', '#eab308', '#6366f1', '#22c55e', '#fb923c'
];

const SEVERITY_COLORS: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400'
};

const SEVERITY_BG: Record<string, string> = {
  low: 'bg-green-400/10 border-green-400/20',
  medium: 'bg-yellow-400/10 border-yellow-400/20',
  high: 'bg-orange-400/10 border-orange-400/20',
  critical: 'bg-red-400/10 border-red-400/20'
};

const ACTION_CATEGORIES: Record<string, string[]> = {
  Authentication: ['login', 'logout', 'session', 'token', 'auth', 'password'],
  Data: ['create', 'update', 'delete', 'edit', 'add', 'remove', 'modify'],
  Reports: ['export', 'download', 'generate', 'report', 'csv', 'pdf'],
  Users: ['user', 'player', 'member', 'profile', 'account'],
  Notifications: ['notification', 'alert', 'bell', 'email', 'sms'],
  Files: ['upload', 'file', 'document', 'image', 'media'],
  Security: ['verify', 'shield', 'permission', 'role', 'access'],
  System: ['config', 'setting', 'system', 'backup', 'restore'],
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => i);

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

const detectCategory = (action: string): string => {
  const lower = action.toLowerCase();
  for (const [category, keywords] of Object.entries(ACTION_CATEGORIES)) {
    if (keywords.some(kw => lower.includes(kw))) return category;
  }
  return 'General';
};

const detectSeverity = (action: string): 'low' | 'medium' | 'high' | 'critical' => {
  const lower = action.toLowerCase();
  if (lower.includes('delete') || lower.includes('remove') || lower.includes('ban')) return 'high';
  if (lower.includes('critical') || lower.includes('breach') || lower.includes('fail')) return 'critical';
  if (lower.includes('update') || lower.includes('edit') || lower.includes('modify')) return 'medium';
  return 'low';
};

const formatRelativeTime = (dateStr: string): string => {
  const date = parseISO(dateStr);
  const minutes = differenceInMinutes(new Date(), date);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = differenceInHours(new Date(), date);
  if (hours < 24) return `${hours}h ago`;
  return format(date, 'MMM dd');
};

const getRoleColor = (role: string): string => {
  const roleMap: Record<string, string> = {
    super_admin: 'text-yellow-400',
    admin: 'text-blue-400',
    moderator: 'text-green-400',
    viewer: 'text-gray-400',
  };
  return roleMap[role] || 'text-muted-foreground';
};

const getRoleBadgeVariant = (role: string) => {
  if (role === 'super_admin') return 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400';
  if (role === 'admin') return 'bg-blue-400/10 border-blue-400/30 text-blue-400';
  if (role === 'moderator') return 'bg-green-400/10 border-green-400/30 text-green-400';
  return 'bg-gray-400/10 border-gray-400/30 text-gray-400';
};

const computeGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const MetricCard = ({
  label, value, icon: Icon, color, trend, trendValue, suffix = ''
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  suffix?: string;
}) => (
  <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 group">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className={cn("p-1.5 rounded-lg", `bg-${color}-400/10`)}>
        <Icon className={cn("w-3.5 h-3.5", `text-${color}-400`)} />
      </div>
    </div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
        {value}{suffix}
      </span>
      {trend && trendValue !== undefined && (
        <span className={cn(
          "text-xs flex items-center gap-0.5 mb-1",
          trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {Math.abs(trendValue)}%
        </span>
      )}
    </div>
  </div>
);

const ActivityHeatmap = ({ data }: { data: HeatmapCell[] }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const getOpacity = (val: number) => Math.max(0.1, val / maxVal);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="flex gap-1 mb-1">
          <div className="w-8" />
          {HOURS_OF_DAY.filter(h => h % 3 === 0).map(h => (
            <div key={h} className="flex-1 text-center text-xs text-muted-foreground" style={{ minWidth: 28 }}>
              {h}h
            </div>
          ))}
        </div>
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <span className="w-8 text-xs text-muted-foreground">{day}</span>
            {HOURS_OF_DAY.map(hour => {
              const cell = data.find(d => d.day === day && d.hour === hour);
              const val = cell?.value || 0;
              return (
                <TooltipProvider key={hour}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex-1 rounded-sm cursor-pointer hover:ring-1 hover:ring-primary transition-all"
                        style={{
                          minWidth: 14,
                          height: 14,
                          backgroundColor: `rgba(59, 130, 246, ${getOpacity(val)})`,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{day} {hour}:00 — {val} actions</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2 justify-end">
          <span className="text-xs text-muted-foreground">Less</span>
          {[0.1, 0.3, 0.5, 0.75, 1].map(op => (
            <div key={op} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(59,130,246,${op})` }} />
          ))}
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
};

const AdminLeaderboard = ({ stats }: { stats: AdminStats[] }) => {
  const max = Math.max(...stats.map(s => s.activityCount), 1);
  return (
    <div className="space-y-2">
      {stats.slice(0, 8).map((admin, idx) => (
        <div key={admin.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <span className={cn(
            "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold",
            idx === 0 ? 'bg-yellow-400/20 text-yellow-400' :
            idx === 1 ? 'bg-gray-300/20 text-gray-300' :
            idx === 2 ? 'bg-orange-400/20 text-orange-400' : 'bg-white/10 text-muted-foreground'
          )}>
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{admin.name}</span>
              <Badge className={cn("text-xs py-0 px-1 border", getRoleBadgeVariant(admin.role))}>
                {admin.role.replace('_', ' ')}
              </Badge>
            </div>
            <Progress
              value={(admin.activityCount / max) * 100}
              className="h-1 mt-1"
            />
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-foreground">{admin.activityCount}</p>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(admin.lastActive)}</p>
          </div>
          <div className={cn(
            "text-xs flex items-center",
            admin.activityTrend > 0 ? 'text-green-400' : admin.activityTrend < 0 ? 'text-red-400' : 'text-muted-foreground'
          )}>
            {admin.activityTrend > 0 ? <TrendingUp className="w-3 h-3" /> : admin.activityTrend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </div>
        </div>
      ))}
    </div>
  );
};

const ActivityTimeline = ({
  activities, getActionIcon, getActionColor, isSuperAdmin, selectedAdmin
}: {
  activities: ActivityLog[];
  getActionIcon: (action: string, severity?: string) => JSX.Element;
  getActionColor: (action: string) => string;
  isSuperAdmin: boolean;
  selectedAdmin: string;
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (activity: ActivityLog) => {
    const text = `[${format(new Date(activity.created_at), 'yyyy-MM-dd HH:mm:ss')}] ${activity.admin?.name || 'Unknown'}: ${activity.action}`;
    navigator.clipboard.writeText(text);
    setCopiedId(activity.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const grouped = useMemo(() => {
    const groups: Record<string, ActivityLog[]> = {};
    activities.forEach(a => {
      const timeKey = format(new Date(a.created_at), 'h:mm a');
      if (!groups[timeKey]) groups[timeKey] = [];
      groups[timeKey].push(a);
    });
    return groups;
  }, [activities]);

  if (activities.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
          <Clock className="w-8 h-8 opacity-40" />
        </div>
        <div>
          <p className="text-sm font-medium">No activities recorded</p>
          <p className="text-xs mt-1 opacity-60">Try adjusting the date or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 relative">
      <div className="absolute left-[22px] top-0 bottom-0 w-px bg-white/10" />
      {activities.map((activity, idx) => {
        const severity = activity.severity || detectSeverity(activity.action);
        const category = activity.category || detectCategory(activity.action);
        const isExpanded = expandedId === activity.id;
        const isCopied = copiedId === activity.id;
        const showTimeSeparator = idx === 0 ||
          format(new Date(activity.created_at), 'h:mm a') !== format(new Date(activities[idx - 1].created_at), 'h:mm a');

        return (
          <div key={activity.id}>
            {showTimeSeparator && idx !== 0 && (
              <div className="flex items-center gap-2 my-2 pl-10">
                <div className="text-xs text-muted-foreground/50">{format(new Date(activity.created_at), 'h:mm a')}</div>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            )}
            <div
              className={cn(
                "relative flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer group",
                "hover:bg-white/8 hover:border-white/20",
                isExpanded ? "bg-white/8 border-white/20" : "bg-white/4 border-white/8",
                severity === 'critical' && "border-l-2 border-l-red-400/50",
                severity === 'high' && "border-l-2 border-l-orange-400/50",
              )}
              onClick={() => setExpandedId(isExpanded ? null : activity.id)}
            >
              {/* Timeline dot */}
              <div className={cn(
                "mt-0.5 shrink-0 w-9 h-9 rounded-full flex items-center justify-center border",
                SEVERITY_BG[severity] || 'bg-white/10 border-white/20'
              )}>
                {getActionIcon(activity.action, severity)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-sm font-semibold", getActionColor(activity.action))}>
                        {activity.action}
                      </span>
                      <Badge variant="outline" className={cn("text-xs py-0 px-1.5 border", SEVERITY_BG[severity], SEVERITY_COLORS[severity])}>
                        {severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs py-0 px-1.5 border-white/10 text-muted-foreground">
                        {category}
                      </Badge>
                    </div>

                    {isSuperAdmin && selectedAdmin !== 'self' && activity.admin && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {activity.admin.name.charAt(0)}
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.admin.name}</span>
                        <span className={cn("text-xs", getRoleColor(activity.admin.role))}>
                          • {activity.admin.role.replace('_', ' ')}
                        </span>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="mt-2 space-y-2 animate-in slide-in-from-top-1 duration-200">
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <div className="rounded-lg bg-black/20 border border-white/10 p-2">
                            <p className="text-xs text-muted-foreground font-mono mb-1 flex items-center gap-1">
                              <Terminal className="w-3 h-3" />
                              Details
                            </p>
                            {Object.entries(activity.details)
                              .filter(([key]) => !['timestamp', 'admin_id'].includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="flex gap-2 text-xs">
                                  <span className="text-muted-foreground/70 min-w-[80px]">{key}:</span>
                                  <span className="text-foreground/80 break-all">{String(value)}</span>
                                </div>
                              ))}
                          </div>
                        )}
                        {activity.ip_address && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Network className="w-3 h-3" />
                            <span>IP: {activity.ip_address}</span>
                          </div>
                        )}
                        {activity.session_id && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Hash className="w-3 h-3" />
                            <span>Session: {activity.session_id.slice(0, 16)}...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); handleCopy(activity); }}
                          >
                            {isCopied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">Copy</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(activity.created_at), 'h:mm:ss a')}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />}
                  </div>
                </div>

                {!isExpanded && activity.details && Object.keys(activity.details).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                    {Object.entries(activity.details)
                      .filter(([key]) => !['timestamp', 'admin_id'].includes(key))
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(' • ')
                      .slice(0, 120)}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CustomTooltipBar = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
        <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground capitalize">{p.name}:</span>
            <span className="font-medium text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RealTimePulse = ({ stats }: { stats: RealTimeStats }) => (
  <div className="flex items-center gap-4 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-xs text-muted-foreground">Live</span>
    </div>
    <Separator orientation="vertical" className="h-4" />
    <div className="flex items-center gap-1">
      <Users className="w-3.5 h-3.5 text-blue-400" />
      <span className="text-xs font-medium">{stats.activeSessions}</span>
      <span className="text-xs text-muted-foreground">active</span>
    </div>
    <Separator orientation="vertical" className="h-4" />
    <div className="flex items-center gap-1">
      <Zap className="w-3.5 h-3.5 text-yellow-400" />
      <span className="text-xs font-medium">{stats.actionsLastMinute}</span>
      <span className="text-xs text-muted-foreground">/min</span>
    </div>
    <Separator orientation="vertical" className="h-4" />
    <div className="flex items-center gap-1">
      <Activity className="w-3.5 h-3.5 text-primary" />
      <span className="text-xs font-medium">{stats.actionsLastHour}</span>
      <span className="text-xs text-muted-foreground">/hr</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const ActivitySummary = () => {
  const { adminProfile } = useAuth();
  const { playSound } = useNotificationSound();

  // Core state
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    severity: 'all',
    dateRange: 'today',
    startDate: new Date(),
    endDate: new Date(),
  });
  const [selectedAdmin, setSelectedAdmin] = useState<string>('self');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Chart & analytics state
  const [dailyData, setDailyData] = useState<DailyActivity[]>([]);
  const [actionBreakdown, setActionBreakdown] = useState<ActionBreakdown[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats[]>([]);
  const [metrics, setMetrics] = useState<ActivityMetrics>({
    total: 0, today: 0, thisWeek: 0, thisMonth: 0, avgPerDay: 0,
    mostActiveHour: 0, mostActiveDay: '', topAction: '', growthRate: 0,
    uniqueAdmins: 0, peakDay: '', criticalActions: 0
  });
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats>({
    activeSessions: 0, actionsLastHour: 0, actionsLastMinute: 0, onlineAdmins: []
  });

  // UI state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'compact' | 'grid'>('timeline');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  const lastActivityCount = useRef(0);
  const autoRefreshTimer = useRef<NodeJS.Timeout>();
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  // ─── EFFECTS ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (adminProfile) {
      fetchActivities();
      if (isSuperAdmin) {
        fetchAdmins();
        fetchChartData();
        fetchAdminStats();
        fetchRealTimeStats();
      }
      const channel = supabase
        .channel('activity-changes')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'admin_activity_logs' },
          (payload) => {
            fetchActivities();
            if (isSuperAdmin) {
              fetchChartData();
              fetchAdminStats();
              fetchRealTimeStats();
            }
            const newActivity = payload.new as any;
            if (newActivity.admin_id !== adminProfile.id && soundEnabled) {
              playSound();
              toast({
                title: "New Activity",
                description: newActivity.action,
              });
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [adminProfile, selectedAdmin, selectedDate, soundEnabled]);

  useEffect(() => {
    if (autoRefresh) {
      autoRefreshTimer.current = setInterval(() => {
        fetchActivities();
        if (isSuperAdmin) fetchRealTimeStats();
      }, refreshInterval * 1000);
    }
    return () => { if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current); };
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    applyFilters();
  }, [activities, filters]);

  // ─── FILTER LOGIC ────────────────────────────────────────────────────────

  const applyFilters = useCallback(() => {
    let result = [...activities];

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(a =>
        a.action.toLowerCase().includes(q) ||
        a.admin?.name?.toLowerCase().includes(q) ||
        JSON.stringify(a.details || {}).toLowerCase().includes(q)
      );
    }

    if (filters.category !== 'all') {
      result = result.filter(a => detectCategory(a.action) === filters.category);
    }

    if (filters.severity !== 'all') {
      result = result.filter(a => (a.severity || detectSeverity(a.action)) === filters.severity);
    }

    setFilteredActivities(result);
  }, [activities, filters]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // ─── DATA FETCHING ────────────────────────────────────────────────────────

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, name, role, is_active')
        .eq('is_active', true);
      if (error) throw error;
      setAdmins((data || []) as Admin[]);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchRealTimeStats = async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const oneMinuteAgo = new Date(Date.now() - 60000);

      const { data: hourData } = await supabase
        .from('admin_activity_logs')
        .select('admin_id')
        .gte('created_at', oneHourAgo.toISOString());

      const { data: minuteData } = await supabase
        .from('admin_activity_logs')
        .select('id')
        .gte('created_at', oneMinuteAgo.toISOString());

      const uniqueAdminIds = [...new Set((hourData || []).map(d => d.admin_id))];

      setRealTimeStats({
        activeSessions: uniqueAdminIds.length,
        actionsLastHour: hourData?.length || 0,
        actionsLastMinute: minuteData?.length || 0,
        onlineAdmins: uniqueAdminIds
      });
    } catch (error) {
      console.error('Error fetching realtime stats:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const last30Days = subDays(new Date(), 30);
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .gte('created_at', last30Days.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;

      const allData = data || [];

      // Daily activity (last 14 days)
      const dailyMap = new Map<string, { count: number; successful: number; failed: number }>();
      for (let i = 13; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'MMM dd');
        dailyMap.set(date, { count: 0, successful: 0, failed: 0 });
      }
      allData.forEach(activity => {
        const date = format(new Date(activity.created_at), 'MMM dd');
        if (dailyMap.has(date)) {
          const entry = dailyMap.get(date)!;
          entry.count++;
          if (activity.action.toLowerCase().includes('fail') || activity.action.toLowerCase().includes('error')) {
            entry.failed++;
          } else {
            entry.successful++;
          }
          dailyMap.set(date, entry);
        }
      });
      setDailyData(Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })));

      // Action breakdown (top 10)
      const actionMap = new Map<string, number>();
      allData.forEach(activity => {
        const action = activity.action.split(' ')[0];
        actionMap.set(action, (actionMap.get(action) || 0) + 1);
      });
      const total = allData.length;
      const breakdown = Array.from(actionMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value], index) => ({
          name,
          value,
          color: CHART_COLORS[index % CHART_COLORS.length],
          percentage: Math.round((value / total) * 100)
        }));
      setActionBreakdown(breakdown);

      // Heatmap data
      const heatMap: Record<string, number> = {};
      allData.forEach(activity => {
        const d = new Date(activity.created_at);
        const day = DAYS_OF_WEEK[d.getDay()];
        const hour = d.getHours();
        const key = `${day}-${hour}`;
        heatMap[key] = (heatMap[key] || 0) + 1;
      });
      const heatmapCells: HeatmapCell[] = [];
      DAYS_OF_WEEK.forEach(day => {
        HOURS_OF_DAY.forEach(hour => {
          heatmapCells.push({ day, hour, value: heatMap[`${day}-${hour}`] || 0 });
        });
      });
      setHeatmapData(heatmapCells);

      // Metrics
      const todayData = allData.filter(a => isToday(new Date(a.created_at)));
      const weekData = allData.filter(a => {
        const d = new Date(a.created_at);
        const ws = startOfWeek(new Date());
        return d >= ws;
      });
      const monthData = allData;

      const hourMap: Record<number, number> = {};
      const dayMap: Record<string, number> = {};
      const actionFreq: Record<string, number> = {};

      allData.forEach(a => {
        const d = new Date(a.created_at);
        hourMap[d.getHours()] = (hourMap[d.getHours()] || 0) + 1;
        const dayName = format(d, 'EEEE');
        dayMap[dayName] = (dayMap[dayName] || 0) + 1;
        const action = a.action.split(' ')[0];
        actionFreq[action] = (actionFreq[action] || 0) + 1;
      });

      const mostActiveHour = Number(Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 0);
      const mostActiveDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      const topAction = Object.entries(actionFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      const uniqueAdmins = new Set(allData.map(a => a.admin_id)).size;
      const criticalActions = allData.filter(a => detectSeverity(a.action) === 'critical').length;

      const prevWeekData = allData.filter(a => {
        const d = new Date(a.created_at);
        const ws = startOfWeek(subWeeks(new Date(), 1));
        const we = endOfWeek(subWeeks(new Date(), 1));
        return d >= ws && d <= we;
      });

      const growthRate = computeGrowthRate(weekData.length, prevWeekData.length);

      setMetrics({
        total: allData.length,
        today: todayData.length,
        thisWeek: weekData.length,
        thisMonth: monthData.length,
        avgPerDay: Math.round(allData.length / 30),
        mostActiveHour,
        mostActiveDay,
        topAction,
        growthRate,
        uniqueAdmins,
        peakDay: mostActiveDay,
        criticalActions
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const last7Days = subDays(new Date(), 7);
      const prev7Days = subDays(new Date(), 14);

      const { data: currentData } = await supabase
        .from('admin_activity_logs')
        .select('admin_id, action, created_at')
        .gte('created_at', last7Days.toISOString());

      const { data: prevData } = await supabase
        .from('admin_activity_logs')
        .select('admin_id')
        .gte('created_at', prev7Days.toISOString())
        .lte('created_at', last7Days.toISOString());

      const { data: adminData } = await supabase
        .from('admins')
        .select('id, name, role');

      const adminMap = new Map((adminData || []).map(a => [a.id, a]));
      const currentCounts: Record<string, { count: number; lastAction: string; lastAt: string; topActions: Record<string, number> }> = {};
      const prevCounts: Record<string, number> = {};

      (currentData || []).forEach(a => {
        if (!currentCounts[a.admin_id]) currentCounts[a.admin_id] = { count: 0, lastAction: a.action, lastAt: a.created_at, topActions: {} };
        currentCounts[a.admin_id].count++;
        currentCounts[a.admin_id].lastAction = a.action;
        currentCounts[a.admin_id].lastAt = a.created_at;
        const word = a.action.split(' ')[0];
        currentCounts[a.admin_id].topActions[word] = (currentCounts[a.admin_id].topActions[word] || 0) + 1;
      });

      (prevData || []).forEach(a => {
        prevCounts[a.admin_id] = (prevCounts[a.admin_id] || 0) + 1;
      });

      const stats: AdminStats[] = Object.entries(currentCounts).map(([id, data]) => {
        const admin = adminMap.get(id);
        const prevCount = prevCounts[id] || 0;
        const topAction = Object.entries(data.topActions).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
        return {
          id,
          name: admin?.name || 'Unknown',
          role: admin?.role || 'admin',
          activityCount: data.count,
          lastActive: data.lastAt,
          topAction,
          activityTrend: computeGrowthRate(data.count, prevCount)
        };
      }).sort((a, b) => b.activityCount - a.activityCount);

      setAdminStats(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchActivities = async () => {
    if (!adminProfile) return;
    setIsLoading(true);
    try {
      const startDate = startOfDay(selectedDate);
      const endDate = endOfDay(selectedDate);

      let query = supabase
        .from('admin_activity_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (!isSuperAdmin) {
        query = query.eq('admin_id', adminProfile.id);
      } else if (selectedAdmin !== 'all' && selectedAdmin !== 'self') {
        query = query.eq('admin_id', selectedAdmin);
      } else if (selectedAdmin === 'self') {
        query = query.eq('admin_id', adminProfile.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const adminIds = [...new Set((data || []).map(a => a.admin_id))];
      let adminDataArr: any[] = [];
      if (adminIds.length > 0) {
        const { data: adminsResult } = await supabase
          .from('admins')
          .select('id, name, role')
          .in('id', adminIds);
        adminDataArr = adminsResult || [];
      }

      const enriched = (data || []).map(activity => ({
        ...activity,
        severity: detectSeverity(activity.action),
        category: detectCategory(activity.action),
        admin: adminDataArr.find(a => a.id === activity.admin_id)
      }));

      setActivities(enriched as ActivityLog[]);
      setFilteredActivities(enriched as ActivityLog[]);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchActivities();
    if (isSuperAdmin) {
      await Promise.all([fetchChartData(), fetchAdminStats(), fetchRealTimeStats()]);
    }
    setIsRefreshing(false);
  };

  // ─── EXPORT FUNCTIONS ────────────────────────────────────────────────────

  const exportToCSV = async () => {
    try {
      let query = supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isSuperAdmin) {
        query = query.eq('admin_id', adminProfile?.id);
      } else if (selectedAdmin !== 'all' && selectedAdmin !== 'self') {
        query = query.eq('admin_id', selectedAdmin);
      } else if (selectedAdmin === 'self') {
        query = query.eq('admin_id', adminProfile?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const adminIds = [...new Set((data || []).map(a => a.admin_id))];
      const { data: adminsData } = await supabase
        .from('admins')
        .select('id, name, role')
        .in('id', adminIds);

      const adminMap = new Map((adminsData || []).map(a => [a.id, a]));
      const headers = ['Date', 'Time', 'Admin Name', 'Role', 'Action', 'Category', 'Severity', 'Details'];
      const rows = (data || []).map(activity => {
        const admin = adminMap.get(activity.admin_id);
        const dateTime = new Date(activity.created_at);
        return [
          format(dateTime, 'yyyy-MM-dd'),
          format(dateTime, 'HH:mm:ss'),
          admin?.name || 'Unknown',
          admin?.role || 'Unknown',
          activity.action,
          detectCategory(activity.action),
          detectSeverity(activity.action),
          JSON.stringify(activity.details || {})
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export successful", description: `${rows.length} records exported` });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({ title: "Export failed", description: "An error occurred", variant: "destructive" });
    }
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredActivities, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "JSON exported", description: `${filteredActivities.length} records` });
  };

  const downloadSummary = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const criticalCount = filteredActivities.filter(a => detectSeverity(a.action) === 'critical').length;
    const categories = Object.entries(
      filteredActivities.reduce((acc, a) => {
        const cat = detectCategory(a.action);
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([k, v]) => `  ${k}: ${v}`).join('\n');

    const summaryText = filteredActivities.map(a => {
      const details = a.details ? JSON.stringify(a.details) : '';
      return `[${format(new Date(a.created_at), 'HH:mm:ss')}] [${detectSeverity(a.action).toUpperCase()}] ${a.admin?.name || 'Unknown'}: ${a.action}${details ? ` | ${details}` : ''}`;
    }).join('\n');

    const content = [
      `ACTIVITY SUMMARY REPORT`,
      `${'═'.repeat(60)}`,
      `Date: ${format(selectedDate, 'MMMM d, yyyy')}`,
      `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
      ``,
      `STATISTICS`,
      `${'─'.repeat(40)}`,
      `Total Activities: ${filteredActivities.length}`,
      `Critical Actions: ${criticalCount}`,
      ``,
      `CATEGORY BREAKDOWN`,
      `${'─'.repeat(40)}`,
      categories,
      ``,
      `ACTIVITY LOG`,
      `${'─'.repeat(40)}`,
      summaryText
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-summary-${dateStr}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── ICON & COLOR HELPERS ─────────────────────────────────────────────────

  const getActionIcon = (action: string, severity?: string) => {
    const lowerAction = action.toLowerCase();
    const iconClass = "w-4 h-4";
    if (lowerAction.includes('login') || lowerAction.includes('logged in')) return <LogIn className={cn(iconClass, "text-cyan-400")} />;
    if (lowerAction.includes('logout')) return <User className={cn(iconClass, "text-orange-400")} />;
    if (lowerAction.includes('attendance')) return <CalendarIcon className={cn(iconClass, "text-purple-400")} />;
    if (lowerAction.includes('notification') || lowerAction.includes('read')) return <Bell className={cn(iconClass, "text-yellow-400")} />;
    if (lowerAction.includes('upload') || lowerAction.includes('file')) return <Upload className={cn(iconClass, "text-blue-400")} />;
    if (lowerAction.includes('export') || lowerAction.includes('download')) return <Download className={cn(iconClass, "text-green-400")} />;
    if (lowerAction.includes('add') || lowerAction.includes('create')) return <FileText className={cn(iconClass, "text-green-400")} />;
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return <Activity className={cn(iconClass, "text-blue-400")} />;
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return <Trash2 className={cn(iconClass, "text-red-400")} />;
    if (lowerAction.includes('verify') || lowerAction.includes('payment')) return <Shield className={cn(iconClass, "text-green-400")} />;
    if (lowerAction.includes('certificate')) return <Award className={cn(iconClass, "text-yellow-400")} />;
    if (lowerAction.includes('complete') || lowerAction.includes('done')) return <CheckCircle className={cn(iconClass, "text-green-400")} />;
    if (lowerAction.includes('setting') || lowerAction.includes('config')) return <Settings className={cn(iconClass, "text-gray-400")} />;
    if (lowerAction.includes('report')) return <BarChart3 className={cn(iconClass, "text-indigo-400")} />;
    if (lowerAction.includes('search')) return <Search className={cn(iconClass, "text-teal-400")} />;
    if (lowerAction.includes('message') || lowerAction.includes('chat')) return <MessageSquare className={cn(iconClass, "text-pink-400")} />;
    if (lowerAction.includes('lock') || lowerAction.includes('block')) return <Lock className={cn(iconClass, "text-red-400")} />;
    if (lowerAction.includes('unlock') || lowerAction.includes('approve')) return <Unlock className={cn(iconClass, "text-green-400")} />;
    if (lowerAction.includes('backup')) return <HardDrive className={cn(iconClass, "text-gray-400")} />;
    if (lowerAction.includes('api') || lowerAction.includes('webhook')) return <Wifi className={cn(iconClass, "text-blue-400")} />;
    if (lowerAction.includes('data') || lowerAction.includes('player') || lowerAction.includes('user')) return <Database className={cn(iconClass, "text-indigo-400")} />;
    return <Clock className={cn(iconClass, "text-muted-foreground")} />;
  };

  const getActionColor = (action: string): string => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('login')) return 'text-cyan-400';
    if (lowerAction.includes('logout')) return 'text-orange-400';
    if (lowerAction.includes('create') || lowerAction.includes('add')) return 'text-green-400';
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'text-blue-400';
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return 'text-red-400';
    if (lowerAction.includes('read') || lowerAction.includes('notification')) return 'text-yellow-400';
    if (lowerAction.includes('export') || lowerAction.includes('download')) return 'text-emerald-400';
    if (lowerAction.includes('verify') || lowerAction.includes('approve')) return 'text-teal-400';
    if (lowerAction.includes('block') || lowerAction.includes('ban')) return 'text-rose-400';
    return 'text-foreground';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────────────────────────

  const todayFlag = selectedDate.toDateString() === new Date().toDateString();
  const categoryOptions = ['all', ...Object.keys(ACTION_CATEGORIES)];

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredActivities.forEach(a => {
      const cat = detectCategory(a.action);
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredActivities]);

  const severityBreakdown = useMemo(() => ({
    low: filteredActivities.filter(a => detectSeverity(a.action) === 'low').length,
    medium: filteredActivities.filter(a => detectSeverity(a.action) === 'medium').length,
    high: filteredActivities.filter(a => detectSeverity(a.action) === 'high').length,
    critical: filteredActivities.filter(a => detectSeverity(a.action) === 'critical').length,
  }), [filteredActivities]);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="space-y-4">

        {/* ── Header Card ─────────────────────────────────────────────────── */}
        <Card className="gradient-card border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    Activity Summary
                    {todayFlag && (
                      <Badge variant="outline" className="ml-1 text-xs animate-pulse border-green-400/30 text-green-400 bg-green-400/10">
                        ● Live
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {filteredActivities.length} of {activities.length} activities · {format(selectedDate, "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isSuperAdmin && <RealTimePulse stats={realTimeStats} />}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn("h-8 w-8 p-0", isRefreshing && "animate-spin")}
                      onClick={handleManualRefresh}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Refresh</p></TooltipContent>
                </Tooltip>

                <Button
                  size="sm"
                  variant="outline"
                  className={cn("h-8", soundEnabled ? "border-primary/30 text-primary" : "")}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </Button>

                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 text-xs bg-black/30 border-white/10"
                    >
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {format(selectedDate, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => { if (date) { setSelectedDate(date); setDatePickerOpen(false); } }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>

                {isSuperAdmin && (
                  <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-black/30 border-white/10">
                      <SelectValue placeholder="Filter admin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">My Activity</SelectItem>
                      <SelectItem value="all">All Admins</SelectItem>
                      {admins.map(admin => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 gap-1">
                      <Download className="w-3.5 h-3.5" />
                      Export
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-1" align="end">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={downloadSummary}>
                      <FileText className="w-3.5 h-3.5 mr-2" /> Summary (.txt)
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={exportToCSV}>
                      <Database className="w-3.5 h-3.5 mr-2" /> Data (.csv)
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={exportToJSON}>
                      <Terminal className="w-3.5 h-3.5 mr-2" /> Raw (.json)
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>

          {/* ── Quick Stats Row ──────────────────────────────────────────── */}
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
              <MetricCard label="Today" value={metrics.today} icon={Zap} color="blue"
                trend={metrics.growthRate > 0 ? 'up' : metrics.growthRate < 0 ? 'down' : 'neutral'}
                trendValue={Math.abs(metrics.growthRate)} />
              <MetricCard label="This Week" value={metrics.thisWeek} icon={TrendingUp} color="green" />
              <MetricCard label="This Month" value={metrics.thisMonth} icon={Activity} color="purple" />
              <MetricCard label="Avg/Day" value={metrics.avgPerDay} icon={BarChart3} color="yellow" />
              {isSuperAdmin && (
                <>
                  <MetricCard label="Admins" value={metrics.uniqueAdmins} icon={Users} color="cyan" />
                  <MetricCard label="Critical" value={metrics.criticalActions} icon={AlertTriangle} color="red" />
                </>
              )}
            </div>

            {/* ── Severity Strip ──────────────────────────────────────── */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {Object.entries(severityBreakdown).map(([sev, count]) => (
                <button
                  key={sev}
                  onClick={() => updateFilter('severity', filters.severity === sev ? 'all' : sev as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all",
                    filters.severity === sev
                      ? SEVERITY_BG[sev]
                      : "bg-white/5 border-white/10 hover:bg-white/10",
                    SEVERITY_COLORS[sev]
                  )}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full", {
                    'bg-green-400': sev === 'low',
                    'bg-yellow-400': sev === 'medium',
                    'bg-orange-400': sev === 'high',
                    'bg-red-400': sev === 'critical',
                  })} />
                  <span className="capitalize">{sev}</span>
                  <span className="font-bold">{count}</span>
                </button>
              ))}
              {filters.severity !== 'all' && (
                <button
                  onClick={() => updateFilter('severity', 'all')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 text-xs text-muted-foreground hover:bg-white/10"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* ── Search & Filters ─────────────────────────────────────── */}
            <div className="flex gap-2 flex-wrap mb-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search actions, admins, details..."
                  value={filters.search}
                  onChange={e => updateFilter('search', e.target.value)}
                  className="pl-8 h-8 text-xs bg-black/30 border-white/10"
                />
                {filters.search && (
                  <button onClick={() => updateFilter('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              <Select value={filters.category} onValueChange={v => updateFilter('category', v)}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-black/30 border-white/10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-xs capitalize">
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 border border-white/10 rounded-lg p-0.5 bg-black/20">
                {(['timeline', 'compact', 'grid'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                      viewMode === mode ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === 'timeline' ? <List className="w-3.5 h-3.5" /> : mode === 'compact' ? <Layers className="w-3.5 h-3.5" /> : <Grid className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Category pills */}
            {categoryBreakdown.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {categoryBreakdown.slice(0, 6).map(([cat, count]) => (
                  <button
                    key={cat}
                    onClick={() => updateFilter('category', filters.category === cat ? 'all' : cat)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs transition-all",
                      filters.category === cat
                        ? "bg-primary/20 border-primary/30 text-primary"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    {cat} <span className="font-semibold">{count}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Main Content Tabs ──────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black/30 border border-white/10 h-9">
            <TabsTrigger value="feed" className="text-xs h-7">
              <Activity className="w-3.5 h-3.5 mr-1" /> Feed
            </TabsTrigger>
            {isSuperAdmin && (
              <>
                <TabsTrigger value="analytics" className="text-xs h-7">
                  <BarChart3 className="w-3.5 h-3.5 mr-1" /> Analytics
                </TabsTrigger>
                <TabsTrigger value="heatmap" className="text-xs h-7">
                  <Grid className="w-3.5 h-3.5 mr-1" /> Heatmap
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="text-xs h-7">
                  <Star className="w-3.5 h-3.5 mr-1" /> Leaderboard
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs h-7">
                  <Settings className="w-3.5 h-3.5 mr-1" /> Settings
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* ── FEED TAB ──────────────────────────────────────────────────── */}
          <TabsContent value="feed" className="mt-3">
            <Card className="gradient-card border-white/10">
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading activities...</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[480px] pr-2">
                    {viewMode === 'timeline' && (
                      <ActivityTimeline
                        activities={filteredActivities}
                        getActionIcon={getActionIcon}
                        getActionColor={getActionColor}
                        isSuperAdmin={isSuperAdmin}
                        selectedAdmin={selectedAdmin}
                      />
                    )}

                    {viewMode === 'compact' && (
                      <div className="space-y-1">
                        {filteredActivities.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground text-sm">No activities match your filters</div>
                        ) : filteredActivities.map((activity) => (
                          <div key={activity.id} className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-white/8 transition-colors border border-transparent hover:border-white/10">
                            <div className="shrink-0">{getActionIcon(activity.action)}</div>
                            <span className={cn("text-xs font-medium flex-1 truncate", getActionColor(activity.action))}>
                              {activity.action}
                            </span>
                            {isSuperAdmin && selectedAdmin !== 'self' && activity.admin && (
                              <span className="text-xs text-muted-foreground shrink-0">{activity.admin.name}</span>
                            )}
                            <span className="text-xs text-muted-foreground shrink-0">
                              {format(new Date(activity.created_at), 'HH:mm:ss')}
                            </span>
                            <Badge variant="outline" className={cn("text-xs py-0 px-1 border shrink-0", SEVERITY_COLORS[detectSeverity(activity.action)])}>
                              {detectSeverity(activity.action)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {viewMode === 'grid' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredActivities.length === 0 ? (
                          <div className="col-span-2 text-center py-12 text-muted-foreground text-sm">No activities match your filters</div>
                        ) : filteredActivities.map((activity) => {
                          const severity = detectSeverity(activity.action);
                          return (
                            <div key={activity.id} className={cn(
                              "p-3 rounded-xl border transition-all hover:bg-white/10",
                              SEVERITY_BG[severity] || "bg-white/5 border-white/10"
                            )}>
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5">{getActionIcon(activity.action)}</div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-xs font-semibold truncate", getActionColor(activity.action))}>
                                    {activity.action}
                                  </p>
                                  {isSuperAdmin && activity.admin && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{activity.admin.name}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={cn("text-xs py-0 px-1 border", SEVERITY_COLORS[severity])}>
                                      {severity}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(activity.created_at), 'h:mm a')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ANALYTICS TAB ─────────────────────────────────────────────── */}
          {isSuperAdmin && (
            <TabsContent value="analytics" className="mt-3 space-y-4">

              {/* Chart type toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Chart type:</span>
                {(['bar', 'line', 'area'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-all capitalize",
                      chartType === type
                        ? "bg-primary/20 border-primary/30 text-primary"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    {type === 'bar' ? <BarChart3 className="w-3 h-3" /> : type === 'line' ? <LineChartIcon className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Daily Activity Chart */}
                <Card className="gradient-card border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Daily Activity — Last 14 Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      {chartType === 'bar' ? (
                        <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} interval={1} />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                          <RechartsTooltip content={<CustomTooltipBar />} />
                          <Bar dataKey="successful" name="successful" fill="#10b981" radius={[2, 2, 0, 0]} stackId="a" />
                          <Bar dataKey="failed" name="failed" fill="#ef4444" radius={[2, 2, 0, 0]} stackId="a" />
                        </BarChart>
                      ) : chartType === 'line' ? (
                        <LineChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} interval={1} />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                          <RechartsTooltip content={<CustomTooltipBar />} />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
                          <Line type="monotone" dataKey="successful" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                        </LineChart>
                      ) : (
                        <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} interval={1} />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                          <RechartsTooltip content={<CustomTooltipBar />} />
                          <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCount)" />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Action Breakdown Donut */}
                <Card className="gradient-card border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-primary" />
                      Action Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <ResponsiveContainer width="55%" height={200}>
                        <PieChart>
                          <Pie
                            data={actionBreakdown}
                            cx="50%" cy="50%"
                            innerRadius={50} outerRadius={85}
                            paddingAngle={2} dataKey="value"
                          >
                            {actionBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px', fontSize: '11px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 flex flex-col justify-center gap-1.5 overflow-hidden">
                        {actionBreakdown.slice(0, 7).map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
                            <span className="text-xs font-medium text-foreground shrink-0">{item.value}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{item.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Peak Hour', value: `${metrics.mostActiveHour}:00`, icon: Clock, color: 'blue' },
                  { label: 'Peak Day', value: metrics.mostActiveDay || '—', icon: CalendarIcon, color: 'purple' },
                  { label: 'Top Action', value: metrics.topAction || '—', icon: Zap, color: 'yellow' },
                  { label: 'Weekly Growth', value: `${metrics.growthRate}%`, icon: TrendingUp, color: metrics.growthRate >= 0 ? 'green' : 'red' },
                  { label: 'Unique Admins', value: metrics.uniqueAdmins, icon: Users, color: 'cyan' },
                  { label: 'Critical', value: metrics.criticalActions, icon: AlertTriangle, color: 'red' },
                ].map((item, idx) => (
                  <MetricCard key={idx} {...item} />
                ))}
              </div>
            </TabsContent>
          )}

          {/* ── HEATMAP TAB ───────────────────────────────────────────────── */}
          {isSuperAdmin && (
            <TabsContent value="heatmap" className="mt-3">
              <Card className="gradient-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Grid className="w-4 h-4 text-primary" />
                    Activity Heatmap — Hour × Day (Last 30 Days)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Shows when admins are most active throughout the week
                  </p>
                </CardHeader>
                <CardContent>
                  <ActivityHeatmap data={heatmapData} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ── LEADERBOARD TAB ───────────────────────────────────────────── */}
          {isSuperAdmin && (
            <TabsContent value="leaderboard" className="mt-3">
              <Card className="gradient-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    Admin Activity Leaderboard — Last 7 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {adminStats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No admin activity data</div>
                  ) : (
                    <AdminLeaderboard stats={adminStats} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ── SETTINGS TAB ──────────────────────────────────────────────── */}
          {isSuperAdmin && (
            <TabsContent value="settings" className="mt-3">
              <Card className="gradient-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    Display & Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notifications</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Sound Alerts</Label>
                          <p className="text-xs text-muted-foreground">Play sound for new activities</p>
                        </div>
                        <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                      </div>
                      <Separator className="opacity-20" />
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Auto Refresh</Label>
                          <p className="text-xs text-muted-foreground">Periodically fetch new data</p>
                        </div>
                        <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                      </div>
                      {autoRefresh && (
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Refresh interval: {refreshInterval}s
                          </Label>
                          <div className="flex gap-2">
                            {[15, 30, 60, 120].map(s => (
                              <button
                                key={s}
                                onClick={() => setRefreshInterval(s)}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg border text-xs transition-all",
                                  refreshInterval === s
                                    ? "bg-primary/20 border-primary/30 text-primary"
                                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                )}
                              >
                                {s}s
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Display</h4>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Default View Mode</Label>
                        <div className="flex gap-2">
                          {(['timeline', 'compact', 'grid'] as const).map(mode => (
                            <button
                              key={mode}
                              onClick={() => setViewMode(mode)}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all capitalize",
                                viewMode === mode
                                  ? "bg-primary/20 border-primary/30 text-primary"
                                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                              )}
                            >
                              {mode === 'timeline' ? <List className="w-3 h-3" /> : mode === 'compact' ? <Layers className="w-3 h-3" /> : <Grid className="w-3 h-3" />}
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Default Chart Type</Label>
                        <div className="flex gap-2">
                          {(['bar', 'line', 'area'] as const).map(type => (
                            <button
                              key={type}
                              onClick={() => setChartType(type)}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all capitalize",
                                chartType === type
                                  ? "bg-primary/20 border-primary/30 text-primary"
                                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                              )}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="opacity-20" />

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">System Info</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Active Sessions', value: realTimeStats.activeSessions, icon: Cpu },
                        { label: 'Actions/hr', value: realTimeStats.actionsLastHour, icon: Activity },
                        { label: 'Actions/min', value: realTimeStats.actionsLastMinute, icon: Zap },
                        { label: 'Online Admins', value: realTimeStats.onlineAdmins.length, icon: Users },
                      ].map((stat, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 mb-1">
                            <stat.icon className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs text-muted-foreground">{stat.label}</span>
                          </div>
                          <p className="text-xl font-bold text-foreground">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default ActivitySummary;

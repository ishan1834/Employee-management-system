




import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useButtonClickSound } from '@/hooks/useButtonClickSound';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  ChevronRight, CheckSquare, Clock, Users, FileText, Settings,
  BarChart3, MessageSquare, Shield, Upload,
  Award, Briefcase, CreditCard, FolderOpen, Bell, Calendar,
  Megaphone, Vote, KanbanSquare, Coffee, MessageCircle, CalendarDays,
  Trophy, FileBarChart, Cake, TrendingUp, Zap, Target, Activity,
  Star, ArrowUpRight, Flame, Globe, Lock, ChevronDown
} from 'lucide-react';

interface MobileDashboardProps {
  adminProfile: any;
  dashboardStats: any;
}

/* ─────────────────────────────────────────────
   QUICK ACTION TILE
───────────────────────────────────────────── */
interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  gradient: string;
  badge?: string | number;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, onClick, gradient, badge }) => {
  const { playClickSound } = useButtonClickSound();
  const { settings, triggerHaptic } = useSoundSettings();
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (settings.soundEnabled) playClickSound();
    triggerHaptic();
    setPressed(true);
    setTimeout(() => setPressed(false), 200);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      style={{ transform: pressed ? 'scale(0.93)' : 'scale(1)', transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}
      className="relative flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.07] transition-colors"
    >
      {badge !== undefined && (
        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center z-10">
          {badge}
        </span>
      )}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 ${gradient}`}
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        {icon}
      </div>
      <span className="text-[11px] text-gray-300 font-semibold tracking-wide leading-tight text-center">{label}</span>
    </button>
  );
};

/* ─────────────────────────────────────────────
   MENU ITEM ROW
───────────────────────────────────────────── */
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick: () => void;
  iconGradient?: string;
  badge?: string | number;
  badgeColor?: string;
  isNew?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon, label, subtitle, onClick, iconGradient = 'from-blue-600 to-blue-500',
  badge, badgeColor = 'bg-blue-500', isNew
}) => {
  const { playClickSound } = useButtonClickSound();
  const { settings, triggerHaptic } = useSoundSettings();
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (settings.soundEnabled) playClickSound();
    triggerHaptic();
    setPressed(true);
    setTimeout(() => setPressed(false), 150);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      style={{ background: pressed ? 'rgba(255,255,255,0.05)' : undefined, transition: 'background 0.1s' }}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.05] last:border-b-0 active:bg-white/[0.07]"
    >
      <div className="flex items-center gap-3.5">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center flex-shrink-0`}
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.35)' }}>
          <span className="text-white w-5 h-5 flex items-center justify-center">{icon}</span>
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-white font-semibold">{label}</span>
            {isNew && (
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-bold tracking-wider uppercase border border-emerald-500/30">
                NEW
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && (
          <span className={`min-w-[22px] h-[22px] px-1.5 rounded-full ${badgeColor} text-white text-[11px] font-bold flex items-center justify-center`}>
            {badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-white/20" />
      </div>
    </button>
  );
};

/* ─────────────────────────────────────────────
   SECTION WRAPPER
───────────────────────────────────────────── */
interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
  collapsible?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, accentColor = 'bg-blue-500', collapsible = false }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="px-4 mb-4">
      <div className="rounded-2xl border border-white/[0.08] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}>
        <button
          onClick={() => collapsible && setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-1 h-4 rounded-full ${accentColor}`} />
            {icon && <span className="text-white/40 w-4 h-4">{icon}</span>}
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em]">{title}</h3>
          </div>
          {collapsible && (
            <ChevronDown
              className="w-4 h-4 text-gray-600 transition-transform duration-300"
              style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            />
          )}
        </button>
        <div
          style={{
            maxHeight: collapsed ? '0px' : '9999px',
            overflow: 'hidden',
            transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, gradient, trend }) => (
  <div className="rounded-2xl border border-white/[0.08] p-4 relative overflow-hidden"
    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)' }}>
    <div className="absolute inset-0 opacity-10"
      style={{ background: `radial-gradient(circle at top right, ${gradient}, transparent 70%)` }} />
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${gradient}`}
      style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.3)' }}>
      <span className="text-white">{icon}</span>
    </div>
    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
    <p className="text-3xl font-black text-white leading-none mb-1">{value}</p>
    <div className="flex items-center gap-1.5">
      <p className="text-[11px] text-gray-500">{sub}</p>
      {trend && (
        <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold">
          <ArrowUpRight className="w-3 h-3" />
          {trend}
        </span>
      )}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   HERO PROGRESS BAR
───────────────────────────────────────────── */
interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, color }) => {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%`, transition: 'width 1s cubic-bezier(0.25,0.46,0.45,0.94)' }}
        />
      </div>
      <span className="text-[11px] text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
const MobileDashboard: React.FC<MobileDashboardProps> = ({ adminProfile, dashboardStats }) => {
  const navigate = useNavigate();
  const { playClickSound } = useButtonClickSound();
  const { settings, triggerHaptic } = useSoundSettings();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  const nav = (path: string) => {
    if (settings.soundEnabled) playClickSound();
    triggerHaptic();
    navigate(path);
  };

  const isSuperAdmin = adminProfile?.role === 'super_admin';
  const isHRAdmin = adminProfile?.role === 'hr_admin';
  const isTech = adminProfile?.role === 'tech_admin';
  const isEsports = adminProfile?.role === 'esports_admin';
  const isSocial = adminProfile?.role === 'social_admin' || adminProfile?.role === 'content_admin';

  const initials = adminProfile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
  const roleName = adminProfile?.role?.replace(/_/g, ' ').toUpperCase() || 'ADMIN';

  return (
    <div className="min-h-screen pb-28 select-none"
      style={{ background: 'linear-gradient(160deg, #090909 0%, #0a0a0f 50%, #08080e 100%)' }}>

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden px-4 pt-6 pb-8">
        {/* Ambient glow blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-8 -left-20 w-56 h-56 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)', filter: 'blur(50px)' }} />

        {/* Top bar: time + bell */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-[0.14em]">{greeting}</p>
            <p className="text-[13px] font-mono font-bold text-gray-400">{currentTime}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => nav('/dashboard/notifications')}
              className="relative w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-gray-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-black" />
            </button>
            <button onClick={() => nav('/dashboard/settings')}
              className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
              <Settings className="w-4.5 h-4.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Profile hero card */}
        <div className="rounded-2xl border border-white/[0.09] p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(14,165,233,0.06) 50%, rgba(255,255,255,0.02) 100%)' }}>
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </span>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-white tracking-tight truncate leading-tight">
                {adminProfile?.name?.toUpperCase() || 'ADMIN USER'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border"
                  style={{ background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8' }}>
                  {roleName}
                </span>
                {isSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border"
                    style={{ background: 'rgba(234,179,8,0.12)', borderColor: 'rgba(234,179,8,0.25)', color: '#fbbf24' }}>
                    <span className="flex items-center gap-1"><Star className="w-2.5 h-2.5" />ROOT</span>
                  </span>
                )}
              </div>
              <p className="text-[12px] text-gray-500 mt-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                {adminProfile?.email || 'admin@thrylos.in'}
              </p>
            </div>
          </div>

          {/* Attendance progress in hero */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] text-gray-500 font-medium">Monthly Attendance</span>
              <span className="text-[11px] font-bold text-white">
                {dashboardStats?.presentDaysThisMonth ?? 0}/{dashboardStats?.workingDaysInMonth ?? 0} days
              </span>
            </div>
            <ProgressBar
              value={dashboardStats?.presentDaysThisMonth ?? 0}
              max={dashboardStats?.workingDaysInMonth ?? 1}
              color="bg-gradient-to-r from-indigo-500 to-sky-400"
            />
          </div>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Attendance"
            value={isSuperAdmin
              ? `${dashboardStats?.presentToday ?? 0}/${dashboardStats?.totalAdmins ?? 0}`
              : `${dashboardStats?.presentDaysThisMonth ?? 0}/${dashboardStats?.workingDaysInMonth ?? 0}`}
            sub={isSuperAdmin ? 'Online today' : 'This month'}
            icon={<Activity className="w-5 h-5" />}
            gradient="from-indigo-600 to-violet-500"
            trend="+2%"
          />
          <StatCard
            label={isSuperAdmin ? 'Total Admins' : 'Attendance %'}
            value={isSuperAdmin ? dashboardStats?.totalAdmins ?? 0 : `${dashboardStats?.attendancePercentage ?? 0}%`}
            sub="Active staff"
            icon={<TrendingUp className="w-5 h-5" />}
            gradient="from-emerald-600 to-teal-500"
            trend="+5%"
          />
          <StatCard
            label="Tasks Open"
            value={dashboardStats?.openTasks ?? 12}
            sub="Assigned to you"
            icon={<Target className="w-5 h-5" />}
            gradient="from-orange-600 to-amber-500"
          />
          <StatCard
            label="Performance"
            value={`${dashboardStats?.performanceScore ?? 87}%`}
            sub="This quarter"
            icon={<Flame className="w-5 h-5" />}
            gradient="from-rose-600 to-pink-500"
            trend="+3%"
          />
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="px-4 mb-5">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-1 h-4 rounded-full bg-indigo-500" />
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em]">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          <QuickAction icon={<CheckSquare className="w-6 h-6 text-white" />} label="Check In" onClick={() => nav('/dashboard/attendance')} gradient="bg-gradient-to-br from-indigo-600 to-violet-600" />
          <QuickAction icon={<Clock className="w-6 h-6 text-white" />} label="Work Log" onClick={() => nav(isTech ? '/dashboard/tech-work' : '/dashboard/content-work')} gradient="bg-gradient-to-br from-sky-600 to-cyan-600" />
          <QuickAction icon={<Calendar className="w-6 h-6 text-white" />} label="Leave" onClick={() => nav('/dashboard/leave')} gradient="bg-gradient-to-br from-purple-600 to-fuchsia-600" badge={2} />
          <QuickAction icon={<KanbanSquare className="w-6 h-6 text-white" />} label="Tasks" onClick={() => nav('/dashboard/tasks')} gradient="bg-gradient-to-br from-blue-600 to-indigo-600" badge={5} />
          <QuickAction icon={<MessageSquare className="w-6 h-6 text-white" />} label="Team Chat" onClick={() => nav('/dashboard/chat')} gradient="bg-gradient-to-br from-emerald-600 to-green-600" badge={3} />
          <QuickAction icon={<Bell className="w-6 h-6 text-white" />} label="Alerts" onClick={() => nav('/dashboard/notifications')} gradient="bg-gradient-to-br from-red-600 to-rose-600" badge={7} />
          <QuickAction icon={<Trophy className="w-6 h-6 text-white" />} label="Performance" onClick={() => nav('/dashboard/performance')} gradient="bg-gradient-to-br from-amber-500 to-yellow-500" />
          <QuickAction icon={<Coffee className="w-6 h-6 text-white" />} label="Standup" onClick={() => nav('/dashboard/standups')} gradient="bg-gradient-to-br from-teal-600 to-cyan-600" />
        </div>
      </div>

      {/* ── DAILY ROUTINE ── */}
      <Section title="Daily Routine" icon={<Zap className="w-4 h-4" />} accentColor="bg-sky-500">
        <MenuItem
          icon={<CheckSquare className="w-5 h-5" />}
          label="Attendance"
          subtitle="Mark today's attendance"
          onClick={() => nav('/dashboard/attendance')}
          iconGradient="from-indigo-600 to-violet-500"
        />
        <MenuItem
          icon={<Clock className="w-5 h-5" />}
          label="My Work Logs"
          subtitle="Log today's work"
          onClick={() => nav(isTech ? '/dashboard/tech-work' : '/dashboard/content-work')}
          iconGradient="from-sky-600 to-cyan-500"
        />
        <MenuItem
          icon={<Coffee className="w-5 h-5" />}
          label="Daily Standup"
          subtitle="Team sync up"
          onClick={() => nav('/dashboard/standups')}
          iconGradient="from-teal-600 to-emerald-500"
          isNew
        />
        <MenuItem
          icon={<Calendar className="w-5 h-5" />}
          label="Leave Request"
          subtitle="Apply for leave"
          onClick={() => nav('/dashboard/leave')}
          iconGradient="from-purple-600 to-fuchsia-500"
          badge={2}
          badgeColor="bg-purple-500"
        />
      </Section>

      {/* ── PRODUCTIVITY ── */}
      <Section title="Productivity" icon={<Target className="w-4 h-4" />} accentColor="bg-amber-500" collapsible>
        <MenuItem
          icon={<KanbanSquare className="w-5 h-5" />}
          label="Task Board"
          subtitle="Manage your tasks"
          onClick={() => nav('/dashboard/tasks')}
          iconGradient="from-blue-600 to-indigo-500"
          badge={5}
          badgeColor="bg-blue-500"
        />
        <MenuItem
          icon={<Trophy className="w-5 h-5" />}
          label="Performance"
          subtitle="View your metrics"
          onClick={() => nav('/dashboard/performance')}
          iconGradient="from-amber-500 to-yellow-400"
        />
        <MenuItem
          icon={<FileBarChart className="w-5 h-5" />}
          label="My Reports"
          subtitle="Work summaries"
          onClick={() => nav('/dashboard/reports')}
          iconGradient="from-indigo-600 to-purple-500"
        />
        <MenuItem
          icon={<Target className="w-5 h-5" />}
          label="Goals & OKRs"
          subtitle="Track objectives"
          onClick={() => nav('/dashboard/goals')}
          iconGradient="from-rose-600 to-pink-500"
          isNew
        />
      </Section>

      {/* ── WORK & REPORTS ── */}
      <Section title="Work & Reports" icon={<BarChart3 className="w-4 h-4" />} accentColor="bg-emerald-500" collapsible>
        {(isEsports || isSuperAdmin) && (
          <MenuItem
            icon={<Users className="w-5 h-5" />}
            label="Esports Players"
            subtitle="Player management"
            onClick={() => nav('/dashboard/esports-players')}
            iconGradient="from-orange-600 to-amber-500"
          />
        )}
        {(isSocial || isSuperAdmin) && (
          <MenuItem
            icon={<BarChart3 className="w-5 h-5" />}
            label="Social Analytics"
            subtitle="Platform insights"
            onClick={() => nav('/dashboard/social-analytics')}
            iconGradient="from-pink-600 to-rose-500"
          />
        )}
        <MenuItem
          icon={<CreditCard className="w-5 h-5" />}
          label="Payments"
          subtitle="Transaction history"
          onClick={() => nav('/dashboard/payments')}
          iconGradient="from-emerald-600 to-green-500"
        />
        <MenuItem
          icon={<FolderOpen className="w-5 h-5" />}
          label="Files"
          subtitle="Shared documents"
          onClick={() => nav('/dashboard/files')}
          iconGradient="from-amber-600 to-yellow-500"
        />
        <MenuItem
          icon={<Upload className="w-5 h-5" />}
          label="Bulk Upload"
          subtitle="Import data"
          onClick={() => nav('/dashboard/bulk-upload')}
          iconGradient="from-violet-600 to-indigo-500"
        />
      </Section>

      {/* ── COMMUNICATION ── */}
      <Section title="Communication" icon={<MessageSquare className="w-4 h-4" />} accentColor="bg-fuchsia-500" collapsible>
        <MenuItem
          icon={<MessageSquare className="w-5 h-5" />}
          label="Team Chat"
          subtitle="Real-time messaging"
          onClick={() => nav('/dashboard/chat')}
          iconGradient="from-emerald-600 to-teal-500"
          badge={3}
          badgeColor="bg-emerald-500"
        />
        <MenuItem
          icon={<Megaphone className="w-5 h-5" />}
          label="Announcements"
          subtitle="Company-wide updates"
          onClick={() => nav('/dashboard/announcements')}
          iconGradient="from-orange-600 to-amber-500"
          badge="!"
          badgeColor="bg-orange-500"
        />
        <MenuItem
          icon={<Vote className="w-5 h-5" />}
          label="Polls & Surveys"
          subtitle="Team feedback"
          onClick={() => nav('/dashboard/polls')}
          iconGradient="from-purple-600 to-violet-500"
        />
        <MenuItem
          icon={<MessageCircle className="w-5 h-5" />}
          label="Feedback"
          subtitle="Share your thoughts"
          onClick={() => nav('/dashboard/feedback')}
          iconGradient="from-pink-600 to-fuchsia-500"
        />
        <MenuItem
          icon={<CalendarDays className="w-5 h-5" />}
          label="Team Events"
          subtitle="Upcoming activities"
          onClick={() => nav('/dashboard/events')}
          iconGradient="from-teal-600 to-cyan-500"
        />
        <MenuItem
          icon={<Cake className="w-5 h-5" />}
          label="Birthdays"
          subtitle="Team celebrations"
          onClick={() => nav('/dashboard/birthdays')}
          iconGradient="from-rose-600 to-pink-500"
        />
      </Section>

      {/* ── ADMIN / HR ── */}
      {(isSuperAdmin || isHRAdmin) && (
        <Section
          title={isHRAdmin ? 'HR Management' : 'Admin Controls'}
          icon={isHRAdmin ? <Users className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          accentColor={isHRAdmin ? 'bg-teal-500' : 'bg-red-500'}
          collapsible
        >
          <MenuItem
            icon={<Users className="w-5 h-5" />}
            label="Employees"
            subtitle="Manage team members"
            onClick={() => nav('/dashboard/employees')}
            iconGradient="from-blue-600 to-sky-500"
          />
          <MenuItem
            icon={<Briefcase className="w-5 h-5" />}
            label="Internships"
            subtitle="Internship programs"
            onClick={() => nav('/dashboard/internships')}
            iconGradient="from-teal-600 to-emerald-500"
          />
          <MenuItem
            icon={<Award className="w-5 h-5" />}
            label="Certificates"
            subtitle="Issue certificates"
            onClick={() => nav('/dashboard/certificates')}
            iconGradient="from-purple-600 to-violet-500"
          />
          <MenuItem
            icon={<FileText className="w-5 h-5" />}
            label="Career Applications"
            subtitle="Hiring pipeline"
            onClick={() => nav('/dashboard/careers')}
            iconGradient="from-rose-600 to-pink-500"
          />
          <MenuItem
            icon={<Calendar className="w-5 h-5" />}
            label="Leave Management"
            subtitle="Approve & review leaves"
            onClick={() => nav('/dashboard/leave')}
            iconGradient="from-amber-600 to-orange-500"
          />
          {isSuperAdmin && (
            <>
              <MenuItem
                icon={<Shield className="w-5 h-5" />}
                label="Admin Management"
                subtitle="Roles & permissions"
                onClick={() => nav('/dashboard/admin-management')}
                iconGradient="from-red-600 to-rose-500"
              />
              <MenuItem
                icon={<Calendar className="w-5 h-5" />}
                label="Holiday Calendar"
                subtitle="Manage public holidays"
                onClick={() => nav('/dashboard/holidays')}
                iconGradient="from-orange-600 to-amber-500"
              />
              <MenuItem
                icon={<FileBarChart className="w-5 h-5" />}
                label="Admin Reports"
                subtitle="System-wide analytics"
                onClick={() => nav('/dashboard/reports')}
                iconGradient="from-indigo-600 to-violet-500"
              />
              <MenuItem
                icon={<Lock className="w-5 h-5" />}
                label="Security & Audit"
                subtitle="Access logs"
                onClick={() => nav('/dashboard/security')}
                iconGradient="from-slate-600 to-gray-500"
                isNew
              />
              <MenuItem
                icon={<Settings className="w-5 h-5" />}
                label="Settings"
                subtitle="App configuration"
                onClick={() => nav('/dashboard/settings')}
                iconGradient="from-gray-600 to-slate-500"
              />
            </>
          )}
        </Section>
      )}

      {/* ── FOOTER ── */}
      <div className="px-4 mb-2 mt-2">
        <div className="text-center py-4">
          <p className="text-[10px] text-gray-700 font-medium tracking-widest uppercase">THRYLOS ADMIN · v2.0</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default MobileDashboard;

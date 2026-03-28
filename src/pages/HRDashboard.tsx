



import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, Users, Briefcase, Award, FileText,
  Calendar, ChevronRight, Loader2, Clock, Check, X,
  DollarSign, UserCheck, UserX, TrendingUp, Bell,
  Activity, Search, Filter, RefreshCw, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

/* ─── Pulse animation keyframes injected once ─── */
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .hr-dash * { font-family: 'DM Sans', sans-serif; }
  .hr-mono { font-family: 'DM Mono', monospace !important; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
    70%  { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
    100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
  }
  @keyframes ticker {
    0%   { transform: translateY(0); }
    33%  { transform: translateY(-33.33%); }
    66%  { transform: translateY(-66.66%); }
    100% { transform: translateY(0); }
  }

  .card-animate { animation: fadeUp 0.4s ease both; }
  .card-animate:nth-child(1) { animation-delay: 0.05s; }
  .card-animate:nth-child(2) { animation-delay: 0.10s; }
  .card-animate:nth-child(3) { animation-delay: 0.15s; }
  .card-animate:nth-child(4) { animation-delay: 0.20s; }
  .card-animate:nth-child(5) { animation-delay: 0.25s; }
  .card-animate:nth-child(6) { animation-delay: 0.30s; }

  .module-card {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border-radius: 16px;
  }
  .module-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%);
    pointer-events: none;
  }
  .module-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
  }
  .module-card:active { transform: translateY(-1px); }

  .stat-card {
    border-radius: 14px;
    transition: transform 0.18s ease;
  }
  .stat-card:hover { transform: translateY(-2px); }

  .activity-row {
    border-radius: 10px;
    transition: background 0.15s ease;
  }
  .activity-row:hover { background: rgba(255,255,255,0.04) !important; }

  .badge-pulse { animation: pulse-ring 2s infinite; }

  .search-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    color: white;
    padding: 8px 14px 8px 36px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
    width: 200px;
  }
  .search-input::placeholder { color: rgba(255,255,255,0.3); }
  .search-input:focus { border-color: rgba(99,102,241,0.5); }

  .section-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent);
    margin: 2rem 0;
  }

  .skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease infinite;
    border-radius: 8px;
  }

  .trend-up   { color: #34d399; }
  .trend-down { color: #f87171; }
  .trend-flat { color: #9ca3af; }
`;
if (!document.head.querySelector('[data-hr-dash]')) {
  style.setAttribute('data-hr-dash', '1');
  document.head.appendChild(style);
}

/* ─── Tiny helpers ─── */
const fmt = (n: number) => n.toLocaleString('en-IN');
const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    pending:  { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24', dot: '#fbbf24' },
    approved: { bg: 'rgba(52,211,153,0.15)',  color: '#34d399', dot: '#34d399' },
    rejected: { bg: 'rgba(248,113,113,0.15)', color: '#f87171', dot: '#f87171' },
    active:   { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8', dot: '#818cf8' },
    inactive: { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', dot: '#9ca3af' },
  };
  const s = map[status] ?? { bg: 'rgba(156,163,175,0.1)', color: '#9ca3af', dot: '#9ca3af' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 500, letterSpacing: '0.03em',
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};

const TrendBadge: React.FC<{ delta?: number }> = ({ delta = 0 }) => {
  if (delta === 0) return <span className="trend-flat" style={{ fontSize: 11 }}><Minus size={11} /></span>;
  if (delta > 0)  return <span className="trend-up"   style={{ fontSize: 11, display:'flex', alignItems:'center', gap:2 }}><ArrowUpRight size={11}/>{delta}%</span>;
  return               <span className="trend-down"  style={{ fontSize: 11, display:'flex', alignItems:'center', gap:2 }}><ArrowDownRight size={11}/>{Math.abs(delta)}%</span>;
};

/* ─── Module config ─── */
const MODULES = (stats: any, navigate: any) => [
  {
    title: 'Employee Management',
    subtitle: 'Records · Documents · Details',
    icon: Users,
    route: '/dashboard/employees',
    value: stats.activeEmployees,
    total: stats.totalEmployees,
    label: 'Active employees',
    accent: '#6366f1',
    bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    badge: null,
  },
  {
    title: 'Leave Management',
    subtitle: 'Approve · Reject · Balance',
    icon: Calendar,
    route: '/dashboard/leave',
    value: stats.pendingLeaves,
    label: 'Pending requests',
    accent: '#f59e0b',
    bg: 'linear-gradient(135deg, #2d1f07 0%, #451a03 100%)',
    badge: stats.pendingLeaves > 0 ? `${stats.pendingLeaves}` : null,
  },
  {
    title: 'Internship Tracker',
    subtitle: 'Mentors · Progress · Reports',
    icon: Briefcase,
    route: '/dashboard/internships',
    value: stats.activeInterns,
    total: stats.totalInterns,
    label: 'Active interns',
    accent: '#14b8a6',
    bg: 'linear-gradient(135deg, #042f2e 0%, #134e4a 100%)',
    badge: null,
  },
  {
    title: 'Certificate Manager',
    subtitle: 'Issue · Track · Download',
    icon: Award,
    route: '/dashboard/certificates',
    value: stats.totalCertificates,
    label: 'Certificates issued',
    accent: '#a855f7',
    bg: 'linear-gradient(135deg, #2e1065 0%, #3b0764 100%)',
    badge: null,
  },
  {
    title: 'Career Applications',
    subtitle: 'Review · Shortlist · Hire',
    icon: FileText,
    route: '/dashboard/careers',
    value: stats.pendingApplications,
    label: 'Awaiting review',
    accent: '#ef4444',
    bg: 'linear-gradient(135deg, #300 0%, #450a0a 100%)',
    badge: stats.pendingApplications > 0 ? 'New' : null,
  },
  {
    title: 'Holiday Calendar',
    subtitle: 'Plan · Schedule · Attendance',
    icon: Calendar,
    route: '/dashboard/holidays',
    value: stats.totalHolidays,
    label: 'Holidays this year',
    accent: '#f97316',
    bg: 'linear-gradient(135deg, #1c0700 0%, #431407 100%)',
    badge: null,
  },
];

/* ─── Main Component ─── */
const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { adminProfile } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0, activeEmployees: 0, totalInterns: 0,
    activeInterns: 0, totalCertificates: 0, pendingApplications: 0,
    totalHolidays: 0, pendingLeaves: 0, approvedLeaves: 0, totalPayroll: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [employeeSummary, setEmployeeSummary] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaves' | 'applications'>('leaves');

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setRefreshing(true);
    try {
      const [
        { data: employees },
        { data: internships },
        { data: certificates },
        { data: applications },
        { data: holidays },
        { data: leaveRequests },
      ] = await Promise.all([
        supabase.from('employees').select('id, status, salary, full_name, department, designation'),
        supabase.from('internships').select('id, status'),
        supabase.from('certificates').select('id'),
        supabase.from('career_applications').select('id, status, full_name, role_applied_for, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('holidays').select('id'),
        supabase.from('leave_requests').select('*, admin:admins!admin_id(name, role)').order('created_at', { ascending: false }).limit(10),
      ]);

      const totalPayroll = employees?.reduce((sum, e) => sum + (e.salary || 0), 0) || 0;

      setStats({
        totalEmployees: employees?.length || 0,
        activeEmployees: employees?.filter(e => e.status === 'active').length || 0,
        totalInterns: internships?.length || 0,
        activeInterns: internships?.filter(i => i.status === 'active').length || 0,
        totalCertificates: certificates?.length || 0,
        pendingApplications: applications?.filter(a => a.status === 'pending').length || 0,
        totalHolidays: holidays?.length || 0,
        pendingLeaves: (leaveRequests || []).filter((l: any) => l.status === 'pending').length,
        approvedLeaves: (leaveRequests || []).filter((l: any) => l.status === 'approved').length,
        totalPayroll,
      });

      setRecentLeaves(leaveRequests || []);
      setRecentApplications(applications || []);
      setEmployeeSummary(employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filteredEmployees = employeeSummary.filter(e =>
    !searchQuery ||
    e.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ─── Loading skeleton ─── */
  if (isLoading) {
    return (
      <div className="hr-dash min-h-screen" style={{ background: '#080810' }}>
        <Header />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div className="skeleton" style={{ width: 280, height: 36 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 24 }}>
            {[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height: 90 }} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height: 160 }} />)}
          </div>
        </div>
      </div>
    );
  }

  const modules = MODULES(stats, navigate);
  const totalActions = stats.pendingLeaves + stats.pendingApplications;

  return (
    <div className="hr-dash min-h-screen" style={{ background: '#080810' }}>
      <Header />

      {/* ── Top bar ── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.015)',
        backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'rgba(255,255,255,0.45)', background: 'none',
                border: 'none', cursor: 'pointer', fontSize: 13,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              <ArrowLeft size={14} /> Dashboard
            </button>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>/</span>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>HR</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Actions badge */}
            {totalActions > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 999, padding: '4px 12px', fontSize: 12, color: '#f87171',
              }}>
                <Bell size={12} />
                {totalActions} action{totalActions !== 1 ? 's' : ''} needed
              </div>
            )}

            <button
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12,
                transition: 'all 0.15s',
              }}
            >
              <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Page heading ── */}
        <div style={{ marginBottom: 32, animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Human Resources
              </p>
              <h1 style={{ color: 'white', fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
                HR Dashboard
              </h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </p>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Employees', value: fmt(stats.totalEmployees), sub: `${stats.activeEmployees} active`, icon: Users,      accent: '#6366f1', delta: 0 },
            { label: 'Pending Leaves',  value: fmt(stats.pendingLeaves),  sub: `${stats.approvedLeaves} approved`, icon: Clock,  accent: '#f59e0b', delta: stats.pendingLeaves > 3 ? -12 : 5 },
            { label: 'Active Interns',  value: fmt(stats.activeInterns),  sub: `of ${stats.totalInterns} total`,   icon: Briefcase, accent: '#14b8a6', delta: 8 },
            { label: 'Open Roles',      value: fmt(stats.pendingApplications), sub: 'apps in review',             icon: FileText,  accent: '#ef4444', delta: 3 },
            { label: 'Monthly Payroll', value: fmtK(stats.totalPayroll),  sub: 'total CTC',                       icon: DollarSign,accent: '#10b981', delta: 2 },
          ].map(({ label, value, sub, icon: Icon, accent, delta }) => (
            <div key={label} className="stat-card" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '18px 18px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: `${accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} style={{ color: accent }} />
                </div>
                <TrendBadge delta={delta} />
              </div>
              <p className="hr-mono" style={{ color: 'white', fontSize: 22, fontWeight: 500, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                {value}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '0 0 2px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: 0 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Module Grid ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ color: 'white', fontSize: 15, fontWeight: 500, margin: 0 }}>Modules</h2>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>6 areas</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {modules.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className={`module-card card-animate`}
                  style={{ background: m.bg, border: `1px solid ${m.accent}22` }}
                  onClick={() => navigate(m.route)}
                >
                  <div style={{ padding: '22px 22px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: `${m.accent}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${m.accent}33`,
                      }}>
                        <Icon size={18} style={{ color: m.accent }} />
                      </div>
                      {m.badge && (
                        <span className="badge-pulse" style={{
                          background: `${m.accent}22`, color: m.accent,
                          border: `1px solid ${m.accent}44`,
                          borderRadius: 999, padding: '3px 10px',
                          fontSize: 11, fontWeight: 600,
                        }}>{m.badge}</span>
                      )}
                    </div>

                    <h3 style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: '0 0 3px', letterSpacing: '-0.01em' }}>
                      {m.title}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '0 0 16px' }}>
                      {m.subtitle}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <div>
                        <p className="hr-mono" style={{ color: 'white', fontSize: 26, fontWeight: 500, margin: '0 0 1px', lineHeight: 1 }}>
                          {m.value}
                          {m.total !== undefined && (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>/{m.total}</span>
                          )}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>{m.label}</p>
                      </div>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Activity + Table row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 14 }}>

          {/* Activity panel */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {(['leaves', 'applications'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.3)',
                  borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                  transition: 'all 0.15s', marginBottom: -1,
                }}>
                  {tab === 'leaves' ? 'Leave Requests' : 'Applications'}
                  {tab === 'leaves' && stats.pendingLeaves > 0 && (
                    <span style={{ marginLeft: 6, background: '#f59e0b', color: '#000', borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                      {stats.pendingLeaves}
                    </span>
                  )}
                  {tab === 'applications' && stats.pendingApplications > 0 && (
                    <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                      {stats.pendingApplications}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ padding: '10px 14px 14px', maxHeight: 360, overflowY: 'auto' }}>
              {activeTab === 'leaves' ? (
                recentLeaves.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                    No leave requests
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {recentLeaves.map((leave: any) => (
                      <div key={leave.id} className="activity-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 10px', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: 'rgba(99,102,241,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 600, color: '#818cf8',
                        }}>
                          {(leave.admin?.name || 'U').slice(0, 1).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: 'white', fontSize: 13, fontWeight: 500, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {leave.admin?.name || 'Unknown'}
                          </p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {leave.subject} · {leave.leave_date ? format(new Date(leave.leave_date), 'MMM d') : ''}
                          </p>
                        </div>
                        <StatusPill status={leave.status} />
                      </div>
                    ))}
                  </div>
                )
              ) : (
                recentApplications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                    No applications
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {recentApplications.map((app: any) => (
                      <div key={app.id} className="activity-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 10px', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: 'rgba(239,68,68,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 600, color: '#f87171',
                        }}>
                          {(app.full_name || 'A').slice(0, 1).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: 'white', fontSize: 13, fontWeight: 500, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.full_name}
                          </p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.role_applied_for} · {app.created_at ? formatDistanceToNow(new Date(app.created_at), { addSuffix: true }) : ''}
                          </p>
                        </div>
                        <StatusPill status={app.status} />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px' }}>
              <button
                onClick={() => navigate(activeTab === 'leaves' ? '/dashboard/leave' : '/dashboard/careers')}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 12,
                  color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
          </div>


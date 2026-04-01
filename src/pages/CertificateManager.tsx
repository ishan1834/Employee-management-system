




import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Award, Download, Search, Shield, CheckCircle2,
  XCircle, Clock, TrendingUp, Users, Star, Zap, Eye,
  Filter, RefreshCw, Copy, ExternalLink, BarChart3,
  Trophy, Medal, Ribbon, QrCode, Mail, Calendar,
  ChevronUp, ChevronDown, AlertTriangle, Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';


interface Certificate {
  id: string;
  certificate_id: string | null;
  recipient_name: string;
  certificate_type: string;
  issue_date: string;
  issued_by: string | null;
  certificate_url: string | null;
  participant_name: string | null;
  participant_email: string | null;
  course_name: string | null;
  status?: 'active' | 'revoked' | 'pending';
  rank?: string;
  created_at: string;
  updated_at: string;
}


type SortField = 'created_at' | 'participant_name' | 'certificate_id' | 'course_name';
type SortDir = 'asc' | 'desc';

const RANK_OPTIONS = ['Champion', 'Runner-Up', 'Third Place', 'Participant', 'MVP', 'Best Rookie', 'Top Fragger'];
const COURSE_SUGGESTIONS = ['BGMI Tournament', 'Free Fire Championship', 'Valorant Cup', 'COD Mobile League', 'Esports Bootcamp'];

// ── Tiny sub-components ─────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: string | number; icon: React.ReactNode;
  accent: string; trend?: string; trendUp?: boolean;
}> = ({ label, value, icon, accent, trend, trendUp }) => (
  <div className="cert-stat-card" style={{ '--accent': accent } as React.CSSProperties}>
    <div className="cert-stat-inner">
      <div className="cert-stat-glow" />
      <div className="cert-stat-top">
        <span className="cert-stat-label">{label}</span>
        <span className="cert-stat-icon">{icon}</span>
      </div>
      <div className="cert-stat-value">{value}</div>
      {trend && (
        <div className={`cert-stat-trend ${trendUp ? 'up' : 'down'}`}>
          {trendUp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {trend}
        </div>
      )}
    </div>
  </div>
);

const StatusBadge: React.FC<{ status?: string }> = ({ status = 'active' }) => {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    active:  { label: 'Active',  color: '#22c55e', icon: <CheckCircle2 size={11} /> },
    revoked: { label: 'Revoked', color: '#ef4444', icon: <XCircle size={11} /> },
    pending: { label: 'Pending', color: '#f59e0b', icon: <Clock size={11} /> },
  };
  const s = map[status] || map.active;
  return (
    <span className="cert-status-badge" style={{ '--sc': s.color } as React.CSSProperties}>
      {s.icon}{s.label}
    </span>
  );
};

const RankBadge: React.FC<{ rank?: string }> = ({ rank }) => {
  if (!rank) return null;
  const icons: Record<string, React.ReactNode> = {
    'Champion':    <Trophy size={12} />,
    'Runner-Up':   <Medal size={12} />,
    'Third Place': <Ribbon size={12} />,
    'MVP':         <Star size={12} />,
  };
  return (
    <span className="cert-rank-badge">
      {icons[rank] ?? <Award size={12} />}
      {rank}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const CertificateManager: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState<Certificate | null | 'not_found'>(null);
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('table');
  const [formData, setFormData] = useState({
    certificate_id: '', participant_name: '', participant_email: '',
    course_name: '', rank: '', notes: ''
  });

  useEffect(() => {
    fetchCertificates();
    const channel = supabase
      .channel('certificate-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, fetchCertificates)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCertificates((data || []) as Certificate[]);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleAddCertificate = async () => {
    if (!adminProfile) return;
    const { certificate_id, participant_name, participant_email, course_name } = formData;
    if (!certificate_id || !participant_name || !participant_email || !course_name) {
      toast({ title: 'Missing Fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('certificates').insert({
        certificate_id, recipient_name: participant_name,
        certificate_type: course_name, participant_name,
        participant_email, course_name, issued_by: adminProfile.id,
      } as any);
      if (error) throw error;
      toast({ title: '🏆 Certificate Issued!', description: `${participant_name} – ${certificate_id}` });
      setDialogOpen(false);
      setFormData({ certificate_id: '', participant_name: '', participant_email: '', course_name: '', rank: '', notes: '' });
      fetchCertificates();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to issue certificate', variant: 'destructive' });
    }
  };

  const handleVerify = () => {
    const cert = certificates.find(c => c.certificate_id?.toLowerCase() === verifyId.toLowerCase());
    setVerifyResult(cert ?? 'not_found');
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: 'Copied!', description: id });
  };

  const generateCertificateId = () => {
    const r = Math.floor(100000 + Math.random() * 900000);
    return `MU${r}`;
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelectedCerts(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const uniqueCourses = Array.from(new Set(certificates.map(c => c.course_name || c.certificate_type).filter(Boolean)));
  const thisMonth = certificates.filter(c => new Date(c.created_at).getMonth() === new Date().getMonth()).length;
  const lastMonth = certificates.filter(c => {
    const d = new Date(c.created_at); const now = new Date();
    return d.getMonth() === now.getMonth() - 1 && d.getFullYear() === now.getFullYear();
  }).length;

  const filtered = certificates
    .filter(c => {
      const name = (c.participant_name || c.recipient_name || '').toLowerCase();
      const id = (c.certificate_id || '').toLowerCase();
      const course = (c.course_name || c.certificate_type || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      if (term && !name.includes(term) && !id.includes(term) && !course.includes(term)) return false;
      if (filterStatus !== 'all' && (c.status || 'active') !== filterStatus) return false;
      if (filterCourse !== 'all' && (c.course_name || c.certificate_type) !== filterCourse) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = (a[sortField] || '') as string;
      const bVal = (b[sortField] || '') as string;
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const SortIcon = ({ field }: { field: SortField }) => (
    sortField === field
      ? (sortDir === 'asc' ? <ChevronUp size={13} className="sort-icon active" /> : <ChevronDown size={13} className="sort-icon active" />)
      : <ChevronUp size={13} className="sort-icon" />
  );

  // ── Analytics data ────────────────────────────────────────────────────────
  const courseBreakdown = uniqueCourses.map(course => ({
    name: course,
    count: certificates.filter(c => (c.course_name || c.certificate_type) === course).length
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  const maxCount = Math.max(...courseBreakdown.map(c => c.count), 1);

  // ── Monthly trend (last 6 months) ─────────────────────────────────────────
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const count = certificates.filter(c => {
      const cd = new Date(c.created_at);
      return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
    }).length;
    return { label: d.toLocaleString('default', { month: 'short' }), count };
  });
  const maxMonthly = Math.max(...monthlyTrend.map(m => m.count), 1);

  return (
    <>
      <style>{`
        /* ── CERT MANAGER STYLES ───────────────────────────────────── */
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

        .cert-root { font-family: 'Syne', sans-serif; }

        /* Hero Banner */
        .cert-hero {
          position: relative;
          background: linear-gradient(135deg, #0a0a0f 0%, #12111c 50%, #0d1117 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 20px;
          padding: 36px 40px;
          margin-bottom: 28px;
          overflow: hidden;
        }
        .cert-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 80% 50%, rgba(139,92,246,0.12) 0%, transparent 60%),
                      radial-gradient(ellipse 40% 80% at 10% 80%, rgba(59,130,246,0.08) 0%, transparent 50%);
          pointer-events: none;
        }
        .cert-hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .cert-hero-content { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .cert-hero-title { font-size: 2.4rem; font-weight: 800; letter-spacing: -1px; color: #fff; line-height: 1.1; }
        .cert-hero-title span {
          background: linear-gradient(135deg, #a78bfa, #60a5fa, #f472b6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .cert-hero-sub { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin-top: 6px; font-family: 'JetBrains Mono', monospace; }
        .cert-hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3);
          border-radius: 100px; padding: 4px 12px; font-size: 0.75rem;
          color: #a78bfa; margin-bottom: 10px;
        }
        .cert-hero-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

        /* Stat Cards */
        .cert-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .cert-stat-card {
          position: relative; border-radius: 16px; overflow: hidden; cursor: default;
          background: linear-gradient(135deg, #111118, #0e0e16);
          border: 1px solid rgba(255,255,255,0.07);
          transition: transform 0.2s, border-color 0.2s;
        }
        .cert-stat-card:hover { transform: translateY(-3px); border-color: var(--accent, rgba(139,92,246,0.4)); }
        .cert-stat-glow {
          position: absolute; top: 0; right: 0; width: 120px; height: 120px;
          background: radial-gradient(circle, var(--accent, rgba(139,92,246,0.3)) 0%, transparent 70%);
          opacity: 0.4; pointer-events: none;
        }
        .cert-stat-inner { padding: 22px 24px; position: relative; }
        .cert-stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .cert-stat-label { font-size: 0.78rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 1px; }
        .cert-stat-icon { opacity: 0.8; }
        .cert-stat-value { font-size: 2.4rem; font-weight: 800; color: #fff; line-height: 1; letter-spacing: -1px; }
        .cert-stat-trend { display: flex; align-items: center; gap: 3px; margin-top: 8px; font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; }
        .cert-stat-trend.up { color: #22c55e; }
        .cert-stat-trend.down { color: #ef4444; }

        /* Status badge */
        .cert-status-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 100px; font-size: 0.72rem; font-weight: 600;
          background: color-mix(in srgb, var(--sc) 15%, transparent);
          color: var(--sc); border: 1px solid color-mix(in srgb, var(--sc) 30%, transparent);
        }

        /* Rank badge */
        .cert-rank-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600;
          background: rgba(250,204,21,0.12); color: #fbbf24; border: 1px solid rgba(250,204,21,0.2);
        }

        /* Toolbar */
        .cert-toolbar {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 16px 20px; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; margin-bottom: 16px;
        }
        .cert-search-wrap { position: relative; flex: 1; min-width: 200px; }
        .cert-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); }
        .cert-search { width: 100%; padding: 9px 12px 9px 38px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #fff; font-size: 0.85rem;
          outline: none; transition: border-color 0.2s; font-family: 'Syne', sans-serif;
        }
        .cert-search:focus { border-color: rgba(139,92,246,0.5); }
        .cert-select { padding: 9px 12px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #fff;
          font-size: 0.82rem; outline: none; cursor: pointer; font-family: 'Syne', sans-serif;
        }
        .cert-select option { background: #1a1a2e; }

        /* Table */
        .cert-table-wrap { border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
        .cert-table { width: 100%; border-collapse: collapse; }
        .cert-table thead { background: rgba(255,255,255,0.03); }
        .cert-table th {
          padding: 14px 16px; text-align: left; font-size: 0.72rem;
          text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4);
          cursor: pointer; user-select: none; white-space: nowrap;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .cert-table th:hover { color: rgba(255,255,255,0.7); }
        .cert-table th .th-inner { display: flex; align-items: center; gap: 4px; }
        .sort-icon { opacity: 0.3; transition: opacity 0.2s; }
        .sort-icon.active { opacity: 1; color: #a78bfa; }
        .cert-table td {
          padding: 14px 16px; font-size: 0.84rem; color: rgba(255,255,255,0.8);
          border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle;
        }
        .cert-table tr:last-child td { border-bottom: none; }
        .cert-table tbody tr { transition: background 0.15s; }
        .cert-table tbody tr:hover { background: rgba(139,92,246,0.05); }
        .cert-table tbody tr.selected { background: rgba(139,92,246,0.08); }
        .cert-id {
          font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
          color: #818cf8; font-weight: 600; display: flex; align-items: center; gap: 6px;
        }
        .cert-id button { opacity: 0; transition: opacity 0.15s; background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.4); padding: 2px; }
        .cert-table tbody tr:hover .cert-id button { opacity: 1; }
        .cert-checkbox { width: 16px; height: 16px; accent-color: #7c3aed; cursor: pointer; }
        .cert-name { font-weight: 600; color: #fff; }
        .cert-email { color: rgba(255,255,255,0.45); font-size: 0.78rem; font-family: 'JetBrains Mono', monospace; }
        .cert-date { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: rgba(255,255,255,0.5); }

        /* Row actions */
        .cert-row-actions { display: flex; gap: 6px; opacity: 0; transition: opacity 0.15s; }
        .cert-table tbody tr:hover .cert-row-actions { opacity: 1; }
        .cert-action-btn {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 10px; border-radius: 7px; font-size: 0.75rem; font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.15s;
          font-family: 'Syne', sans-serif;
        }
        .cert-action-btn:hover { background: rgba(139,92,246,0.2); border-color: rgba(139,92,246,0.4); color: #fff; }
        .cert-action-btn.danger:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }

        /* Empty state */
        .cert-empty { text-align: center; padding: 64px 24px; color: rgba(255,255,255,0.3); }
        .cert-empty svg { margin: 0 auto 16px; opacity: 0.3; }
        .cert-empty-title { font-size: 1.1rem; font-weight: 700; color: rgba(255,255,255,0.5); margin-bottom: 6px; }

        /* Bulk bar */
        .cert-bulk-bar {
          position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 12px;
          background: rgba(20,18,30,0.95); backdrop-filter: blur(20px);
          border: 1px solid rgba(139,92,246,0.4); border-radius: 100px;
          padding: 12px 20px; z-index: 50; animation: slideUp 0.2s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1);
        }
        @keyframes slideUp { from { transform: translateX(-50%) translateY(16px); opacity: 0; } }
        .cert-bulk-count { font-size: 0.82rem; color: rgba(255,255,255,0.6); white-space: nowrap; }
        .cert-bulk-count strong { color: #a78bfa; }

        /* Analytics */
        .cert-analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .cert-analytics-grid { grid-template-columns: 1fr; } }
        .cert-analytics-card {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 24px;
        }
        .cert-analytics-title { font-size: 0.85rem; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .cert-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .cert-bar-label { font-size: 0.78rem; color: rgba(255,255,255,0.6); width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cert-bar-track { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden; }
        .cert-bar-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, #7c3aed, #a78bfa); transition: width 0.6s ease; }
        .cert-bar-count { font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; color: rgba(255,255,255,0.4); width: 28px; text-align: right; }
        .cert-trend-row { display: flex; align-items: flex-end; gap: 8px; height: 80px; }
        .cert-trend-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .cert-trend-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
        .cert-trend-bar {
          width: 100%; border-radius: 4px 4px 0 0;
          background: linear-gradient(to top, #6d28d9, #a78bfa);
          transition: height 0.6s ease; min-height: 3px;
        }
        .cert-trend-label { font-size: 0.65rem; color: rgba(255,255,255,0.35); font-family: 'JetBrains Mono', monospace; }

        /* Verify panel */
        .cert-verify-panel { padding: 24px; }
        .cert-verify-input-wrap { display: flex; gap: 10px; margin-bottom: 24px; }
        .cert-verify-input {
          flex: 1; padding: 12px 16px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
          color: #fff; font-size: 1rem; font-family: 'JetBrains Mono', monospace;
          outline: none; transition: border-color 0.2s; text-transform: uppercase;
          letter-spacing: 2px;
        }
        .cert-verify-input:focus { border-color: rgba(139,92,246,0.6); }
        .cert-verify-result {
          border-radius: 14px; padding: 24px; text-align: center;
          border: 1px solid; animation: fadeIn 0.3s ease;
        }
        .cert-verify-result.valid {
          background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.3);
        }
        .cert-verify-result.invalid {
          background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.3);
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } }
        .cert-verify-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .cert-verify-result.valid .cert-verify-icon { background: rgba(34,197,94,0.15); color: #22c55e; }
        .cert-verify-result.invalid .cert-verify-icon { background: rgba(239,68,68,0.15); color: #ef4444; }
        .cert-verify-cert-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; text-align: left; }
        .cert-verify-field { background: rgba(255,255,255,0.04); border-radius: 10px; padding: 12px; }
        .cert-verify-field-label { font-size: 0.7rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .cert-verify-field-value { font-size: 0.88rem; color: #fff; font-weight: 600; }

        /* Dialog */
        .cert-dialog-form { display: flex; flex-direction: column; gap: 16px; }
        .cert-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cert-form-field { display: flex; flex-direction: column; gap: 6px; }
        .cert-form-label { font-size: 0.78rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; }
        .cert-form-input {
          padding: 10px 14px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
          color: #fff; font-size: 0.88rem; outline: none; transition: border-color 0.2s;
          font-family: 'Syne', sans-serif;
        }
        .cert-form-input:focus { border-color: rgba(139,92,246,0.5); }
        .cert-id-row { display: flex; gap: 8px; }
        .cert-id-row .cert-form-input { flex: 1; font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }

        /* Primary button */
        .cert-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px; border-radius: 10px; font-size: 0.85rem; font-weight: 700;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          border: 1px solid rgba(139,92,246,0.4); color: #fff; cursor: pointer;
          transition: all 0.2s; font-family: 'Syne', sans-serif;
        }
        .cert-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(124,58,237,0.4); }
        .cert-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: 10px; font-size: 0.85rem; font-weight: 600;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.2s;
          font-family: 'Syne', sans-serif;
        }
        .cert-btn-secondary:hover { background: rgba(255,255,255,0.09); color: #fff; }
        .cert-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 9px; font-size: 0.8rem; font-weight: 600;
          background: transparent; border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.2s;
          font-family: 'Syne', sans-serif;
        }
        .cert-btn-ghost:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.15); }

        /* Tabs */
        .cert-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border-radius: 12px; padding: 4px; margin-bottom: 20px; }
        .cert-tab {
          flex: 1; padding: 9px 16px; border-radius: 9px; font-size: 0.82rem; font-weight: 700;
          border: none; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 7px;
          color: rgba(255,255,255,0.4); background: transparent; font-family: 'Syne', sans-serif;
        }
        .cert-tab.active { background: rgba(139,92,246,0.2); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3); }

        /* Shimmer */
        .cert-shimmer { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px; height: 48px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* Section header */
        .cert-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
        .cert-section-title { font-size: 1.05rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; }
        .cert-count-pill {
          display: inline-flex; align-items: center; padding: 2px 10px;
          background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.25);
          border-radius: 100px; font-size: 0.72rem; color: #a78bfa; font-weight: 700;
        }
      `}</style>

      <div className="cert-root">

        {/* ── Hero ── */}
        <div className="cert-hero">
          <div className="cert-hero-grid" />
          <div className="cert-hero-content">
            <div>
              <div className="cert-hero-badge">
                <Sparkles size={12} /> Certificate Management System
              </div>
              <h1 className="cert-hero-title">
                Issue &amp; Verify<br /><span>Certificates</span>
              </h1>
              <p className="cert-hero-sub">// esports &amp; tournament credential authority</p>
            </div>
            <div className="cert-hero-actions">
              <button className="cert-btn-ghost" onClick={() => setVerifyDialogOpen(true)}>
                <Shield size={15} /> Verify Certificate
              </button>
              <button className="cert-btn-ghost" onClick={fetchCertificates}>
                <RefreshCw size={15} /> Refresh
              </button>
              <button className="cert-btn-primary" onClick={() => setDialogOpen(true)}>
                <Plus size={16} /> Issue Certificate
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="cert-stats-grid">
          <StatCard label="Total Issued" value={certificates.length} icon={<Award size={22} color="#a78bfa" />} accent="rgba(139,92,246,0.4)" trend={`${thisMonth} this month`} trendUp={thisMonth >= lastMonth} />
          <StatCard label="This Month" value={thisMonth} icon={<Calendar size={22} color="#34d399" />} accent="rgba(52,211,153,0.4)" trend={lastMonth > 0 ? `vs ${lastMonth} last month` : 'First month'} trendUp={thisMonth >= lastMonth} />
          <StatCard label="Unique Courses" value={uniqueCourses.length} icon={<BarChart3 size={22} color="#60a5fa" />} accent="rgba(96,165,250,0.4)" />
          <StatCard label="Participants" value={new Set(certificates.map(c => c.participant_email)).size} icon={<Users size={22} color="#f472b6" />} accent="rgba(244,114,182,0.4)" />
          <StatCard label="Active" value={certificates.filter(c => (c.status || 'active') === 'active').length} icon={<CheckCircle2 size={22} color="#22c55e" />} accent="rgba(34,197,94,0.4)" />
        </div>

        {/* ── Tabs ── */}
        <div className="cert-tabs">
          {[
            { key: 'table', label: 'Certificates', icon: <Award size={14} /> },
            { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} /> },
            { key: 'verify', label: 'Verify', icon: <Shield size={14} /> },
          ].map(t => (
            <button key={t.key} className={`cert-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ══ TABLE TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'table' && (
          <>
            {/* Toolbar */}
            <div className="cert-toolbar">
              <div className="cert-search-wrap">
                <Search size={15} />
                <input className="cert-search" placeholder="Search by name, ID, or course…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <select className="cert-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
                <option value="pending">Pending</option>
              </select>
              <select className="cert-select" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
                <option value="all">All Courses</option>
                {uniqueCourses.map(c => <option key={c} value={c ?? undefined}>{c}</option>)}
              </select>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {selectedCerts.size > 0 && (
                  <button className="cert-btn-ghost" onClick={() => setSelectedCerts(new Set())}>
                    Clear ({selectedCerts.size})
                  </button>
                )}
                <button className="cert-btn-ghost">
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* Section header */}
            <div className="cert-section-header">
              <div className="cert-section-title">
                All Certificates
                <span className="cert-count-pill">{filtered.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="cert-table-wrap">
              {isLoading ? (
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(6)].map((_, i) => <div key={i} className="cert-shimmer" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="cert-empty">
                  <Award size={48} />
                  <div className="cert-empty-title">No certificates found</div>
                  <p style={{ fontSize: '0.82rem' }}>Issue your first certificate to get started.</p>
                </div>
              ) : (
                <table className="cert-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input type="checkbox" className="cert-checkbox"
                          onChange={e => setSelectedCerts(e.target.checked ? new Set(filtered.map(c => c.id)) : new Set())}
                          checked={selectedCerts.size === filtered.length && filtered.length > 0}
                        />
                      </th>
                      <th onClick={() => toggleSort('certificate_id')}><div className="th-inner">Cert ID <SortIcon field="certificate_id" /></div></th>
                      <th onClick={() => toggleSort('participant_name')}><div className="th-inner">Participant <SortIcon field="participant_name" /></div></th>
                      <th onClick={() => toggleSort('course_name')}><div className="th-inner">Course / Tournament <SortIcon field="course_name" /></div></th>
                      <th>Rank</th>
                      <th>Status</th>
                      <th onClick={() => toggleSort('created_at')}><div className="th-inner">Issued <SortIcon field="created_at" /></div></th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(cert => (
                      <tr key={cert.id} className={selectedCerts.has(cert.id) ? 'selected' : ''}>
                        <td>
                          <input type="checkbox" className="cert-checkbox"
                            checked={selectedCerts.has(cert.id)}
                            onChange={() => toggleSelect(cert.id)}
                          />
                        </td>
                        <td>
                          <div className="cert-id">
                            {cert.certificate_id || '—'}
                            {cert.certificate_id && (
                              <button onClick={() => handleCopyId(cert.certificate_id!)} title="Copy">
                                <Copy size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="cert-name">{cert.participant_name || cert.recipient_name}</div>
                          <div className="cert-email">{cert.participant_email || '—'}</div>
                        </td>
                        <td>{cert.course_name || cert.certificate_type}</td>
                        <td><RankBadge rank={cert.rank} /></td>
                        <td><StatusBadge status={cert.status} /></td>
                        <td>
                          <div className="cert-date">
                            {new Date(cert.issue_date || cert.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td>
                          <div className="cert-row-actions">
                            <button className="cert-action-btn"><Eye size={12} /> View</button>
                            <button className="cert-action-btn"><Download size={12} /> PDF</button>
                            <button className="cert-action-btn"><Mail size={12} /> Send</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ══ ANALYTICS TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="cert-analytics-grid">
            {/* Course breakdown */}
            <div className="cert-analytics-card">
              <div className="cert-analytics-title"><BarChart3 size={14} /> Certificates by Course</div>
              {courseBreakdown.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>No data yet.</p>
              ) : courseBreakdown.map(({ name, count }) => (
                <div className="cert-bar-row" key={name}>
                  <div className="cert-bar-label" title={name ?? undefined}>{name}</div>
                  <div className="cert-bar-track">
                    <div className="cert-bar-fill" style={{ width: `${(count / maxCount) * 100}%` }} />
                  </div>
                  <div className="cert-bar-count">{count}</div>
                </div>
              ))}
            </div>

            {/* Monthly trend */}
            <div className="cert-analytics-card">
              <div className="cert-analytics-title"><TrendingUp size={14} /> Monthly Trend</div>
              <div className="cert-trend-row">
                {monthlyTrend.map(({ label, count }) => (
                  <div className="cert-trend-col" key={label}>
                    <div className="cert-trend-bar-wrap">
                      <div className="cert-trend-bar" style={{ height: `${(count / maxMonthly) * 100}%` }} />
                    </div>
                    <div className="cert-trend-label">{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Peak Month', value: monthlyTrend.reduce((a, b) => a.count > b.count ? a : b).label },
                  { label: 'Average / Month', value: Math.round(certificates.length / 6) || 0 },
                  { label: 'Total 6 Months', value: certificates.length },
                ].map(({ label, value }) => (
                  <div key={label} style={{ flex: 1, minWidth: 100 }}>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a78bfa' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status breakdown */}
            <div className="cert-analytics-card">
              <div className="cert-analytics-title"><CheckCircle2 size={14} /> Status Breakdown</div>
              {['active', 'revoked', 'pending'].map(s => {
                const count = certificates.filter(c => (c.status || 'active') === s).length;
                const pct = certificates.length > 0 ? Math.round((count / certificates.length) * 100) : 0;
                const colors: Record<string, string> = { active: '#22c55e', revoked: '#ef4444', pending: '#f59e0b' };
                return (
                  <div className="cert-bar-row" key={s}>
                    <div className="cert-bar-label" style={{ textTransform: 'capitalize' }}>{s}</div>
                    <div className="cert-bar-track">
                      <div className="cert-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors[s]}, ${colors[s]}aa)` }} />
                    </div>
                    <div className="cert-bar-count">{count}</div>
                  </div>
                );
              })}
            </div>

            {/* Recent activity */}
            <div className="cert-analytics-card">
              <div className="cert-analytics-title"><Zap size={14} /> Recent Activity</div>
              {certificates.slice(0, 7).map(cert => (
                <div key={cert.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Award size={15} color="#a78bfa" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cert.participant_name || cert.recipient_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {cert.certificate_id} · {cert.course_name || cert.certificate_type}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                    {new Date(cert.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ VERIFY TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'verify' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="cert-analytics-card">
              <div className="cert-analytics-title"><Shield size={14} /> Instant Certificate Verification</div>
              <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                Enter a certificate ID to verify authenticity in real time.
              </p>
              <div className="cert-verify-input-wrap">
                <input
                  className="cert-verify-input"
                  placeholder="MU123456"
                  value={verifyId}
                  onChange={e => { setVerifyId(e.target.value); setVerifyResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                />
                <button className="cert-btn-primary" onClick={handleVerify} disabled={!verifyId.trim()}>
                  <Shield size={15} /> Verify
                </button>
              </div>

              {verifyResult === 'not_found' && (
                <div className="cert-verify-result invalid">
                  <div className="cert-verify-icon"><XCircle size={28} /></div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ef4444', marginBottom: 6 }}>Invalid Certificate</div>
                  <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.4)' }}>No certificate found with ID <strong style={{ color: '#fff' }}>{verifyId.toUpperCase()}</strong>.</p>
                </div>
              )}
              {verifyResult && verifyResult !== 'not_found' && (
                <div className="cert-verify-result valid">
                  <div className="cert-verify-icon"><CheckCircle2 size={28} /></div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#22c55e', marginBottom: 6 }}>Verified ✓</div>
                  <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)' }}>This certificate is authentic and valid.</p>
                  <div className="cert-verify-cert-info">
                    {[
                      { label: 'Certificate ID', value: verifyResult.certificate_id },
                      { label: 'Recipient', value: verifyResult.participant_name || verifyResult.recipient_name },
                      { label: 'Course', value: verifyResult.course_name || verifyResult.certificate_type },
                      { label: 'Issue Date', value: new Date(verifyResult.issue_date || verifyResult.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    ].map(({ label, value }) => (
                      <div className="cert-verify-field" key={label}>
                        <div className="cert-verify-field-label">{label}</div>
                        <div className="cert-verify-field-value">{value || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Bulk action bar ── */}
        {selectedCerts.size > 0 && (
          <div className="cert-bulk-bar">
            <span className="cert-bulk-count"><strong>{selectedCerts.size}</strong> selected</span>
            <button className="cert-action-btn"><Download size={13} /> Download All</button>
            <button className="cert-action-btn"><Mail size={13} /> Email All</button>
            <button className="cert-action-btn danger"><XCircle size={13} /> Revoke</button>
            <button className="cert-btn-ghost" style={{ borderRadius: '100px', padding: '6px 14px' }} onClick={() => setSelectedCerts(new Set())}>✕</button>
          </div>
        )}

        {/* ══ ISSUE DIALOG ═══════════════════════════════════════════════════ */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-white/10" style={{ maxWidth: 560 }}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Award size={18} color="#a78bfa" /> Issue New Certificate
              </DialogTitle>
            </DialogHeader>
            <div className="cert-dialog-form" style={{ marginTop: 8 }}>

              <div className="cert-form-field">
                <label className="cert-form-label">Certificate ID *</label>
                <div className="cert-id-row">
                  <input className="cert-form-input" placeholder="MU123456" value={formData.certificate_id}
                    onChange={e => setFormData({ ...formData, certificate_id: e.target.value })} />
                  <button className="cert-btn-secondary" onClick={() => setFormData({ ...formData, certificate_id: generateCertificateId() })}>
                    <Zap size={13} /> Auto
                  </button>
                </div>
              </div>

              <div className="cert-form-row">
                <div className="cert-form-field">
                  <label className="cert-form-label">Participant Name *</label>
                  <input className="cert-form-input" placeholder="Full Name" value={formData.participant_name}
                    onChange={e => setFormData({ ...formData, participant_name: e.target.value })} />
                </div>
                <div className="cert-form-field">
                  <label className="cert-form-label">Email *</label>
                  <input className="cert-form-input" type="email" placeholder="email@example.com" value={formData.participant_email}
                    onChange={e => setFormData({ ...formData, participant_email: e.target.value })} />
                </div>
              </div>

              <div className="cert-form-row">
                <div className="cert-form-field">
                  <label className="cert-form-label">Course / Tournament *</label>
                  <input className="cert-form-input" placeholder="e.g. BGMI Tournament" list="course-suggestions"
                    value={formData.course_name} onChange={e => setFormData({ ...formData, course_name: e.target.value })} />
                  <datalist id="course-suggestions">{COURSE_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
                </div>
                <div className="cert-form-field">
                  <label className="cert-form-label">Rank / Achievement</label>
                  <select className="cert-form-input cert-select" value={formData.rank}
                    onChange={e => setFormData({ ...formData, rank: e.target.value })}>
                    <option value="">Select rank…</option>
                    {RANK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="cert-form-field">
                <label className="cert-form-label">Notes (optional)</label>
                <input className="cert-form-input" placeholder="Any additional notes…" value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button className="cert-btn-secondary" onClick={() => setDialogOpen(false)}>Cancel</button>
                <button className="cert-btn-primary" onClick={handleAddCertificate}>
                  <Award size={15} /> Issue Certificate
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
};

export default CertificateManager;

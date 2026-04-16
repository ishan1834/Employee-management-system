



import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Briefcase, Check, XCircle, Eye, FileText, User, Image as ImageIcon, Mail, Send, Calendar, Clock, Video, MessageSquare, BarChart3, Download, TrendingUp, Users, ArrowUpRight, ArrowDownRight, PieChart, Activity, Search, Filter, RefreshCw, ExternalLink, ChevronDown, ChevronUp, Copy, Phone } from "lucide-react";

const ADMIN_PASSWORD = "thrylos@628400";

interface Application {
  id: string;
  created_at: string;
  full_name: string;
  mobile: string;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  date_of_birth: string | null;
  role: string;
  years_of_experience: string | null;
  skills: string | null;
  why_join: string | null;
  additional_notes: string | null;
  resume_url: string | null;
  aadhar_urls: string[] | null;
  additional_doc_urls: string[] | null;
  status: string;
  applicant_image_path: string | null;
}

interface OpenPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string | null;
  requirements: string | null;
  is_active: boolean;
}

interface PreviewFile {
  url: string;
  type: 'image' | 'pdf' | 'document';
  name: string;
}

const STATUS_FLOW = ['pending', 'shortlisted', 'interview', 'accepted', 'rejected'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  shortlisted: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  interview: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
  accepted: 'bg-green-500/10 border-green-500/30 text-green-500',
  rejected: 'bg-red-500/10 border-red-500/30 text-red-500',
};
const STATUS_ICONS: Record<string, string> = {
  pending: '⏳', shortlisted: '⭐', interview: '🎯', accepted: '✅', rejected: '❌',
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [activeTab, setActiveTab] = useState<"applications" | "positions" | "analytics">("applications");
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'full_name' | 'role'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Interview scheduling
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewData, setInterviewData] = useState({ date: '', time: '', platform: 'Discord', link: '' });
  const [interviewApp, setInterviewApp] = useState<Application | null>(null);

  // Custom email
  const [showCustomEmailModal, setShowCustomEmailModal] = useState(false);
  const [customEmailData, setCustomEmailData] = useState({ subject: '', body: '' });
  const [customEmailApp, setCustomEmailApp] = useState<Application | null>(null);

  // Bulk email
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkEmailData, setBulkEmailData] = useState({ subject: '', body: '', targetStatus: 'all' });

  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Position form state
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState<OpenPosition | null>(null);
  const [positionForm, setPositionForm] = useState({ title: "", department: "", location: "Remote", type: "Full-time", description: "", requirements: "", is_active: true });

  // Delete confirmation
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("thrylos_admin_auth");
    if (stored === "true") setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) { fetchApplications(); fetchPositions(); }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) { setIsAuthenticated(true); sessionStorage.setItem("thrylos_admin_auth", "true"); setError(""); }
    else { setError("Invalid password"); }
  };

  const handleLogout = () => { setIsAuthenticated(false); sessionStorage.removeItem("thrylos_admin_auth"); };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("job_applications").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setApplications((data as Application[]) || []);
    } catch (err) { console.error("Error:", err); } finally { setLoading(false); }
  };

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase.from("open_positions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setPositions((data as OpenPosition[]) || []);
    } catch (err) { console.error("Error:", err); }
  };

  const getDocumentUrl = (path: string, bucket: string = "career-documents") => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const getApplicantImageUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from("career-applicant-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const getFileType = (url: string): 'image' | 'pdf' | 'document' => {
    const lower = url.toLowerCase();
    if (lower.match(/\.(jpg|jpeg|png|gif|webp|bmp)/)) return 'image';
    if (lower.match(/\.pdf/)) return 'pdf';
    return 'document';
  };

  const openPreview = (url: string, name: string) => { setPreviewFile({ url, type: getFileType(url), name }); };

  const sendEmail = async (emailData: Record<string, string>) => {
    setSendingEmail(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/send-career-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emailData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to send email');
      toast({ title: "Email sent successfully!" });
      return true;
    } catch (err: any) {
      toast({ title: "Email failed", description: err.message, variant: "destructive" });
      return false;
    } finally { setSendingEmail(false); }
  };

  const updateApplicationStatus = async (id: string, status: string, sendNotification = true) => {
    try {
      const { error } = await supabase.from("job_applications").update({ status }).eq("id", id);
      if (error) throw error;
      toast({ title: `Application marked as ${status}!` });
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
      if (selectedApp?.id === id) setSelectedApp({ ...selectedApp, status });

      if (sendNotification) {
        const app = applications.find(a => a.id === id);
        if (app) {
          const emailType = status === 'shortlisted' ? 'shortlisted' : status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : null;
          if (emailType) await sendEmail({ to: app.email, name: app.full_name, type: emailType, role: app.role });
        }
      }
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const deleteApplication = async (id: string) => {
    try {
      const { error } = await supabase.from("job_applications").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Application deleted" });
      setApplications(prev => prev.filter(a => a.id !== id));
      if (selectedApp?.id === id) setSelectedApp(null);
      setDeleteConfirmApp(null);
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleInterviewSchedule = async () => {
    if (!interviewApp) return;
    await updateApplicationStatus(interviewApp.id, 'interview', false);
    await sendEmail({ to: interviewApp.email, name: interviewApp.full_name, type: 'interview_call', role: interviewApp.role, interviewDate: interviewData.date, interviewTime: interviewData.time, interviewPlatform: interviewData.platform, interviewLink: interviewData.link });
    setShowInterviewModal(false);
    setInterviewData({ date: '', time: '', platform: 'Discord', link: '' });
    setInterviewApp(null);
  };

  const handleCustomEmail = async () => {
    if (!customEmailApp) return;
    await sendEmail({ to: customEmailApp.email, name: customEmailApp.full_name, type: 'custom', customSubject: customEmailData.subject, customBody: customEmailData.body });
    setShowCustomEmailModal(false);
    setCustomEmailData({ subject: '', body: '' });
    setCustomEmailApp(null);
  };

  const handleBulkEmail = async () => {
    const targets = bulkEmailData.targetStatus === 'all' ? applications : applications.filter(a => a.status === bulkEmailData.targetStatus);
    setSendingEmail(true);
    let sent = 0;
    for (const app of targets) {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        await fetch(`https://${projectId}.supabase.co/functions/v1/send-career-email`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: app.email, name: app.full_name, type: 'custom', customSubject: bulkEmailData.subject, customBody: bulkEmailData.body }),
        });
        sent++;
      } catch (err) { console.error(`Failed to send to ${app.email}:`, err); }
    }
    setSendingEmail(false);
    toast({ title: `Bulk email sent to ${sent}/${targets.length} applicants` });
    setShowBulkEmailModal(false);
    setBulkEmailData({ subject: '', body: '', targetStatus: 'all' });
  };

  const handlePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPosition) {
        const { error } = await supabase.from("open_positions").update(positionForm).eq("id", editingPosition.id);
        if (error) throw error;
        toast({ title: "Position updated!" });
      } else {
        const { error } = await supabase.from("open_positions").insert([positionForm]);
        if (error) throw error;
        toast({ title: "Position created!" });
      }
      setShowPositionForm(false);
      setEditingPosition(null);
      setPositionForm({ title: "", department: "", location: "Remote", type: "Full-time", description: "", requirements: "", is_active: true });
      fetchPositions();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleEditPosition = (position: OpenPosition) => {
    setEditingPosition(position);
    setPositionForm({ title: position.title, department: position.department, location: position.location, type: position.type, description: position.description || "", requirements: position.requirements || "", is_active: position.is_active });
    setShowPositionForm(true);
  };

  const handleDeletePosition = async (id: string) => {
    if (!confirm("Delete this position?")) return;
    try {
      const { error } = await supabase.from("open_positions").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Position deleted!" });
      fetchPositions();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'City', 'State', 'Experience', 'Skills', 'Applied Date'];
    const rows = filteredApps.map(a => [a.full_name, a.email, a.mobile, a.role, a.status, a.city || '', a.state || '', a.years_of_experience || '', (a.skills || '').replace(/,/g, ';'), new Date(a.created_at).toLocaleDateString()]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `thrylos-applications-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported!" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const filteredApps = useMemo(() => {
    let apps = applications.filter((app) => {
      const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || app.email.toLowerCase().includes(searchTerm.toLowerCase()) || app.mobile.includes(searchTerm) || (app.skills || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !filterRole || app.role === filterRole;
      const matchesStatus = !filterStatus || app.status === filterStatus;
      const matchesDateFrom = !filterDateFrom || new Date(app.created_at) >= new Date(filterDateFrom);
      const matchesDateTo = !filterDateTo || new Date(app.created_at) <= new Date(filterDateTo + 'T23:59:59');
      return matchesSearch && matchesRole && matchesStatus && matchesDateFrom && matchesDateTo;
    });
    apps.sort((a, b) => {
      const aVal = a[sortField]; const bVal = b[sortField];
      const cmp = (aVal || '') < (bVal || '') ? -1 : (aVal || '') > (bVal || '') ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return apps;
  }, [applications, searchTerm, filterRole, filterStatus, filterDateFrom, filterDateTo, sortField, sortDir]);

  const roles = [...new Set(applications.map((a) => a.role))];

  const analytics = useMemo(() => {
    if (!applications.length) return null;
    const statusDist = STATUS_FLOW.reduce((acc, s) => { acc[s] = applications.filter(a => a.status === s).length; return acc; }, {} as Record<string, number>);
    const roleDist = applications.reduce((acc, a) => { acc[a.role] = (acc[a.role] || 0) + 1; return acc; }, {} as Record<string, number>);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyTrend: Record<string, number> = {};
    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) { dailyTrend[d.toISOString().split('T')[0]] = 0; }
    applications.forEach(a => { const day = a.created_at.split('T')[0]; if (dailyTrend[day] !== undefined) dailyTrend[day]++; });
    const totalApps = applications.length;
    const shortlisted = applications.filter(a => ['shortlisted', 'interview', 'accepted'].includes(a.status)).length;
    const interviewed = applications.filter(a => ['interview', 'accepted'].includes(a.status)).length;
    const accepted = applications.filter(a => a.status === 'accepted').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    const expDist = applications.reduce((acc, a) => { const exp = a.years_of_experience || 'Not specified'; acc[exp] = (acc[exp] || 0) + 1; return acc; }, {} as Record<string, number>);
    const locDist = applications.reduce((acc, a) => { const loc = a.state || a.city || 'Not specified'; acc[loc] = (acc[loc] || 0) + 1; return acc; }, {} as Record<string, number>);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const todayCount = applications.filter(a => a.created_at.startsWith(today)).length;
    const yesterdayCount = applications.filter(a => a.created_at.startsWith(yesterday)).length;
    const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - now.getDay());
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400000);
    const thisWeekCount = applications.filter(a => new Date(a.created_at) >= thisWeekStart).length;
    const lastWeekCount = applications.filter(a => { const d = new Date(a.created_at); return d >= lastWeekStart && d < thisWeekStart; }).length;
    const avgResponseTime = totalApps > 0 ? Math.round(applications.filter(a => a.status !== 'pending').reduce((sum, a) => { const created = new Date(a.created_at).getTime(); const now = Date.now(); return sum + (now - created) / (1000 * 60 * 60 * 24); }, 0) / Math.max(applications.filter(a => a.status !== 'pending').length, 1)) : 0;

    return {
      statusDist, roleDist, dailyTrend, totalApps, shortlisted, interviewed, accepted, rejected,
      shortlistRate: totalApps ? ((shortlisted / totalApps) * 100).toFixed(1) : '0',
      interviewRate: shortlisted ? ((interviewed / shortlisted) * 100).toFixed(1) : '0',
      acceptRate: totalApps ? ((accepted / totalApps) * 100).toFixed(1) : '0',
      rejectRate: totalApps ? ((rejected / totalApps) * 100).toFixed(1) : '0',
      expDist, locDist, todayCount, yesterdayCount, thisWeekCount, lastWeekCount, avgResponseTime,
    };
  }, [applications]);

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl text-gradient-brand mb-2">THRYLOS</h1>
            <p className="text-muted-foreground">Coordinator Admin Panel</p>
          </div>
          <form onSubmit={handleLogin} className="card-glass p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" className="form-input" />
              {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            </div>
            <button type="submit" className="w-full btn-thrylos py-4 rounded-xl text-foreground font-semibold uppercase tracking-wider hover:scale-[1.02] transition-transform">
              <span className="relative z-10">Login</span>
            </button>
          </form>
          <p className="text-center text-muted-foreground text-sm mt-6"><a href="/" className="text-primary hover:underline">&larr; Back to Careers</a></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/50 border-b border-border sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-2xl text-gradient-brand">THRYLOS</h1>
            <span className="text-muted-foreground text-sm hidden sm:block">/ Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowBulkEmailModal(true)} className="px-3 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm font-medium hover:bg-accent/20 transition-colors flex items-center gap-2">
              <Mail className="w-4 h-4" /> <span className="hidden sm:inline">Bulk Email</span>
            </button>
            <button onClick={exportCSV} className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={() => { fetchApplications(); fetchPositions(); }} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">Logout</button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {([
            { key: 'applications' as const, label: `Applications (${applications.length})`, icon: <Briefcase className="w-4 h-4" /> },
            { key: 'analytics' as const, label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
            { key: 'positions' as const, label: `Positions (${positions.length})`, icon: <Plus className="w-4 h-4" /> },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.key ? "btn-thrylos text-foreground" : "bg-secondary border border-border text-muted-foreground hover:text-foreground"}`}>
              <span className="relative z-10 flex items-center gap-2">{tab.icon} {tab.label}</span>
            </button>
          ))}
        </div>

        {/* ======== ANALYTICS TAB ======== */}
        {activeTab === "analytics" && analytics && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Applications', value: analytics.totalApps, sub: `Today: ${analytics.todayCount}`, trend: analytics.todayCount >= analytics.yesterdayCount ? 'up' : 'down', color: 'text-foreground' },
                { label: 'Shortlist Rate', value: `${analytics.shortlistRate}%`, sub: `${analytics.shortlisted} shortlisted`, trend: 'up', color: 'text-blue-400' },
                { label: 'Acceptance Rate', value: `${analytics.acceptRate}%`, sub: `${analytics.accepted} accepted`, trend: 'up', color: 'text-green-400' },
                { label: 'This Week', value: analytics.thisWeekCount, sub: `Last week: ${analytics.lastWeekCount}`, trend: analytics.thisWeekCount >= analytics.lastWeekCount ? 'up' : 'down', color: 'text-purple-400' },
                { label: 'Avg. Process Time', value: `${analytics.avgResponseTime}d`, sub: 'Days to decision', trend: 'up', color: 'text-orange-400' },
              ].map(kpi => (
                <div key={kpi.label} className="card-glass p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-muted-foreground text-xs">{kpi.label}</p>
                    {kpi.trend === 'up' ? <ArrowUpRight className="w-4 h-4 text-green-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                  </div>
                  <p className={`font-display text-3xl ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-muted-foreground text-xs mt-1">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Funnel */}
            <div className="card-glass p-6">
              <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Recruitment Funnel</h3>
              <div className="space-y-4">
                {[
                  { label: 'Applied', count: analytics.totalApps, pct: 100, color: 'bg-blue-500' },
                  { label: 'Shortlisted', count: analytics.shortlisted, pct: analytics.totalApps ? (analytics.shortlisted / analytics.totalApps) * 100 : 0, color: 'bg-purple-500' },
                  { label: 'Interviewed', count: analytics.interviewed, pct: analytics.totalApps ? (analytics.interviewed / analytics.totalApps) * 100 : 0, color: 'bg-orange-500' },
                  { label: 'Accepted', count: analytics.accepted, pct: analytics.totalApps ? (analytics.accepted / analytics.totalApps) * 100 : 0, color: 'bg-green-500' },
                  { label: 'Rejected', count: analytics.rejected, pct: analytics.totalApps ? (analytics.rejected / analytics.totalApps) * 100 : 0, color: 'bg-red-500' },
                ].map(step => (
                  <div key={step.label} className="flex items-center gap-4">
                    <span className="text-muted-foreground text-sm w-24">{step.label}</span>
                    <div className="flex-1 bg-secondary rounded-full h-8 overflow-hidden">
                      <div className={`h-full ${step.color} rounded-full flex items-center justify-end pr-3 transition-all duration-1000`} style={{ width: `${Math.max(step.pct, 2)}%` }}>
                        <span className="text-white text-xs font-bold">{step.count}</span>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-sm w-14 text-right">{step.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card-glass p-6">
                <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-accent" /> Status Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.statusDist).map(([status, count]) => {
                    const pct = analytics.totalApps ? ((count / analytics.totalApps) * 100).toFixed(0) : '0';
                    const colors: Record<string, string> = { pending: 'bg-orange-500', shortlisted: 'bg-blue-500', interview: 'bg-purple-500', accepted: 'bg-green-500', rejected: 'bg-red-500' };
                    return (
                      <div key={status} className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 rounded-lg p-2 -mx-2 transition-colors" onClick={() => { setFilterStatus(status); setActiveTab('applications'); }}>
                        <div className={`w-3 h-3 rounded-full ${colors[status] || 'bg-muted'}`} />
                        <span className="text-foreground capitalize flex-1">{status}</span>
                        <span className="text-muted-foreground text-sm">{count}</span>
                        <span className="text-muted-foreground text-xs w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="card-glass p-6">
                <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /> Role Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.roleDist).sort((a, b) => b[1] - a[1]).map(([role, count]) => {
                    const pct = analytics.totalApps ? (count / analytics.totalApps) * 100 : 0;
                    return (
                      <div key={role} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setFilterRole(role); setActiveTab('applications'); }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-foreground text-sm">{role}</span>
                          <span className="text-muted-foreground text-xs">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="bg-secondary rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Daily Trend */}
            <div className="card-glass p-6">
              <h3 className="font-display text-xl text-foreground mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-green-400" /> Application Trend (Last 30 Days)</h3>
              <div className="flex items-end gap-1 h-40">
                {Object.entries(analytics.dailyTrend).map(([day, count]) => {
                  const max = Math.max(...Object.values(analytics.dailyTrend), 1);
                  const height = (count / max) * 100;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center justify-end group relative">
                      <div className="absolute -top-8 bg-card border border-border rounded-md px-2 py-1 text-xs text-foreground hidden group-hover:block whitespace-nowrap z-10">{day}: {count}</div>
                      <div className="w-full bg-gradient-to-t from-primary/80 to-accent/80 rounded-t-sm transition-all duration-500 hover:from-primary hover:to-accent cursor-pointer min-h-[2px]" style={{ height: `${Math.max(height, 2)}%` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-muted-foreground text-xs">
                <span>{Object.keys(analytics.dailyTrend)[0]}</span>
                <span>{Object.keys(analytics.dailyTrend).slice(-1)[0]}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="card-glass p-6">
                <h3 className="font-display text-xl text-foreground mb-4">Experience Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(analytics.expDist).sort((a, b) => b[1] - a[1]).map(([exp, count]) => (
                    <div key={exp} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
                      <span className="text-foreground text-sm">{exp}</span>
                      <span className="text-muted-foreground text-sm font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card-glass p-6">
                <h3 className="font-display text-xl text-foreground mb-4">Top Locations</h3>
                <div className="space-y-2">
                  {Object.entries(analytics.locDist).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([loc, count]) => (
                    <div key={loc} className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
                      <span className="text-foreground text-sm">{loc}</span>
                      <span className="text-muted-foreground text-sm font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======== APPLICATIONS TAB ======== */}
        {activeTab === "applications" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
              {[
                { label: 'Total', count: applications.length, color: 'text-foreground', icon: STATUS_ICONS.pending, status: '' },
                { label: 'Pending', count: applications.filter(a => a.status === 'pending').length, color: 'text-orange-500', icon: STATUS_ICONS.pending, status: 'pending' },
                { label: 'Shortlisted', count: applications.filter(a => a.status === 'shortlisted').length, color: 'text-blue-500', icon: STATUS_ICONS.shortlisted, status: 'shortlisted' },
                { label: 'Interview', count: applications.filter(a => a.status === 'interview').length, color: 'text-purple-500', icon: STATUS_ICONS.interview, status: 'interview' },
                { label: 'Accepted', count: applications.filter(a => a.status === 'accepted').length, color: 'text-green-500', icon: STATUS_ICONS.accepted, status: 'accepted' },
                { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, color: 'text-red-500', icon: STATUS_ICONS.rejected, status: 'rejected' },
              ].map(stat => (
                <div key={stat.label} className={`card-glass p-5 cursor-pointer hover:border-primary/30 transition-all ${filterStatus === stat.status ? 'border-primary/50 bg-primary/5' : ''}`} onClick={() => setFilterStatus(stat.status)}>
                  <p className="text-muted-foreground text-sm flex items-center gap-1"><span>{stat.icon}</span> {stat.label}</p>
                  <p className={`font-display text-3xl mt-1 ${stat.color}`}>{stat.count}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="card-glass p-4 mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Search by name, email, phone, or skills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input pl-10" />
                </div>
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="form-input w-auto">
                  <option value="" className="bg-background">All Roles</option>
                  {roles.map((role) => <option key={role} value={role} className="bg-background">{role}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input w-auto">
                  <option value="" className="bg-background">All Status</option>
                  {STATUS_FLOW.map((s) => <option key={s} value={s} className="bg-background capitalize">{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-muted-foreground text-sm whitespace-nowrap">Date from:</span>
                  <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="form-input" />
                  <span className="text-muted-foreground text-sm">to:</span>
                  <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="form-input" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Sort:</span>
                  <select value={sortField} onChange={(e) => setSortField(e.target.value as any)} className="form-input w-auto text-sm">
                    <option value="created_at" className="bg-background">Date</option>
                    <option value="full_name" className="bg-background">Name</option>
                    <option value="role" className="bg-background">Role</option>
                  </select>
                  <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
                    {sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-muted-foreground text-sm">{filteredApps.length} results</p>
              </div>
            </div>

            {/* Applications List */}
            {loading ? (
              <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-20"><p className="text-muted-foreground">No applications found</p></div>
            ) : (
              <div className="grid gap-4">
                {filteredApps.map((app) => (
                  <div key={app.id} onClick={() => setSelectedApp(app)} className="card-glass p-6 cursor-pointer hover:border-primary/30 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {app.applicant_image_path ? (
                          <img src={getApplicantImageUrl(app.applicant_image_path) || ''} alt={app.full_name} className="h-12 w-12 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-foreground font-bold text-lg">{app.full_name.charAt(0).toUpperCase()}</div>
                        )}
                        <div>
                          <h3 className="text-foreground font-semibold text-lg">{app.full_name}</h3>
                          <p className="text-muted-foreground text-sm">{app.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium uppercase">{app.role}</span>
                        <span className={`px-3 py-1 rounded-full border text-xs font-medium capitalize ${STATUS_COLORS[app.status] || STATUS_COLORS.pending}`}>{STATUS_ICONS[app.status]} {app.status}</span>
                        <span className="text-muted-foreground text-sm">{new Date(app.created_at).toLocaleDateString()}</span>
                        {/* Quick actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button onClick={() => copyToClipboard(app.email)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground" title="Copy email"><Copy className="w-3.5 h-3.5" /></button>
                          <a href={`tel:${app.mobile}`} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground" title="Call"><Phone className="w-3.5 h-3.5" /></a>
                          <button onClick={() => { setCustomEmailApp(app); setShowCustomEmailModal(true); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground" title="Email"><Mail className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ======== POSITIONS TAB ======== */}
        {activeTab === "positions" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Manage Open Positions</h2>
              <Button onClick={() => { setEditingPosition(null); setPositionForm({ title: "", department: "", location: "Remote", type: "Full-time", description: "", requirements: "", is_active: true }); setShowPositionForm(true); }} className="btn-thrylos text-foreground">
                <span className="relative z-10 flex items-center"><Plus className="w-4 h-4 mr-2" /> Add Position</span>
              </Button>
            </div>
            {positions.length === 0 ? (
              <div className="text-center py-20"><Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No positions created yet</p></div>
            ) : (
              <div className="grid gap-4">
                {positions.map((position) => (
                  <div key={position.id} className="card-glass p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-foreground font-semibold text-lg">{position.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${position.is_active ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-secondary border border-border text-muted-foreground"}`}>
                            {position.is_active ? "Active" : "Inactive"}
                          </span>
                          <span className="text-muted-foreground text-xs">{applications.filter(a => a.role === position.title).length} applicants</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>{position.department}</span><span>&middot;</span><span>{position.location}</span><span>&middot;</span><span>{position.type}</span>
                        </div>
                        {position.description && <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{position.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditPosition(position)} className="border-border text-foreground hover:bg-secondary"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeletePosition(position.id)} className="border-destructive/30 text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Position Form Modal */}
      {showPositionForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowPositionForm(false)}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border p-6 flex items-center justify-between">
              <h2 className="font-display text-2xl text-foreground">{editingPosition ? "Edit Position" : "Add New Position"}</h2>
              <button onClick={() => setShowPositionForm(false)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handlePositionSubmit} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-foreground mb-2">Title *</label><Input value={positionForm.title} onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })} placeholder="e.g., Senior Developer" required className="bg-input border-border text-foreground" /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Department *</label><Input value={positionForm.department} onChange={(e) => setPositionForm({ ...positionForm, department: e.target.value })} placeholder="e.g., Engineering" required className="bg-input border-border text-foreground" /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-foreground mb-2">Location</label><Input value={positionForm.location} onChange={(e) => setPositionForm({ ...positionForm, location: e.target.value })} placeholder="e.g., Remote" className="bg-input border-border text-foreground" /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Type</label>
                  <select value={positionForm.type} onChange={(e) => setPositionForm({ ...positionForm, type: e.target.value })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:border-primary focus:outline-none">
                    <option value="Full-time" className="bg-background">Full-time</option><option value="Part-time" className="bg-background">Part-time</option><option value="Contract" className="bg-background">Contract</option><option value="Internship" className="bg-background">Internship</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-foreground mb-2">Description</label><Textarea value={positionForm.description} onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })} placeholder="Describe the role..." className="bg-input border-border text-foreground min-h-[100px]" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-2">Requirements</label><Textarea value={positionForm.requirements} onChange={(e) => setPositionForm({ ...positionForm, requirements: e.target.value })} placeholder="List requirements..." className="bg-input border-border text-foreground min-h-[100px]" /></div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_active" checked={positionForm.is_active} onChange={(e) => setPositionForm({ ...positionForm, is_active: e.target.checked })} className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-primary" />
                <label htmlFor="is_active" className="text-foreground">Active (visible on careers page)</label>
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setShowPositionForm(false)} className="flex-1 border-border text-foreground hover:bg-secondary">Cancel</Button>
                <Button type="submit" className="flex-1 btn-thrylos text-foreground"><span className="relative z-10">{editingPosition ? "Update Position" : "Create Position"}</span></Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedApp(null)}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                {selectedApp.applicant_image_path ? (
                  <button onClick={() => openPreview(getApplicantImageUrl(selectedApp.applicant_image_path) || '', 'Applicant Photo')} className="relative group">
                    <img src={getApplicantImageUrl(selectedApp.applicant_image_path) || ''} alt={selectedApp.full_name} className="h-14 w-14 rounded-full object-cover border-2 border-border group-hover:border-primary transition-all" />
                    <div className="absolute inset-0 rounded-full bg-background/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Eye className="w-5 h-5 text-foreground" /></div>
                  </button>
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-foreground font-bold text-xl">{selectedApp.full_name.charAt(0).toUpperCase()}</div>
                )}
                <div>
                  <h2 className="font-display text-2xl text-foreground">{selectedApp.full_name}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span>{selectedApp.email}</span>
                    <button onClick={() => copyToClipboard(selectedApp.email)} className="p-1 rounded hover:bg-secondary"><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium uppercase">{selectedApp.role}</span>
                <span className={`px-4 py-2 rounded-full border text-sm font-medium capitalize ${STATUS_COLORS[selectedApp.status] || STATUS_COLORS.pending}`}>{STATUS_ICONS[selectedApp.status]} {selectedApp.status}</span>
                <span className="px-4 py-2 rounded-full bg-secondary border border-border text-muted-foreground text-sm">{new Date(selectedApp.created_at).toLocaleString()}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {selectedApp.status === 'pending' && (
                  <Button onClick={() => updateApplicationStatus(selectedApp.id, 'shortlisted')} className="bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30"><Check className="w-4 h-4 mr-2" /> Shortlist</Button>
                )}
                {(selectedApp.status === 'shortlisted' || selectedApp.status === 'pending') && (
                  <Button onClick={() => { setInterviewApp(selectedApp); setShowInterviewModal(true); }} className="bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30"><Calendar className="w-4 h-4 mr-2" /> Schedule Interview</Button>
                )}
                {(selectedApp.status === 'interview' || selectedApp.status === 'shortlisted') && (
                  <Button onClick={() => updateApplicationStatus(selectedApp.id, 'accepted')} className="bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30"><Check className="w-4 h-4 mr-2" /> Accept</Button>
                )}
                {selectedApp.status !== 'rejected' && selectedApp.status !== 'accepted' && (
                  <Button onClick={() => updateApplicationStatus(selectedApp.id, 'rejected')} className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"><XCircle className="w-4 h-4 mr-2" /> Reject</Button>
                )}
                <Button onClick={() => { setCustomEmailApp(selectedApp); setShowCustomEmailModal(true); }} className="bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30"><Mail className="w-4 h-4 mr-2" /> Custom Email</Button>
                <Button onClick={() => setDeleteConfirmApp(selectedApp.id)} className="bg-red-900/20 border border-red-900/40 text-red-500 hover:bg-red-900/30"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirmApp === selectedApp.id && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
                  <p className="text-red-400 text-sm">Are you sure you want to permanently delete this application?</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDeleteConfirmApp(null)} className="border-border text-foreground">Cancel</Button>
                    <Button size="sm" onClick={() => deleteApplication(selectedApp.id)} className="bg-red-500 text-white hover:bg-red-600">Delete</Button>
                  </div>
                </div>
              )}

              {/* Applicant Photo */}
              {selectedApp.applicant_image_path && (
                <div className="space-y-4">
                  <h3 className="font-display text-xl text-foreground border-b border-border pb-2">Applicant Photo</h3>
                  <button onClick={() => openPreview(getApplicantImageUrl(selectedApp.applicant_image_path) || '', 'Applicant Photo')} className="relative group rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all">
                    <img src={getApplicantImageUrl(selectedApp.applicant_image_path) || ''} alt={selectedApp.full_name} className="w-40 h-40 object-cover" />
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Eye className="w-8 h-8 text-foreground" /></div>
                  </button>
                </div>
              )}

              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="font-display text-xl text-foreground border-b border-border pb-2">Personal Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">Phone</p><div className="flex items-center gap-2"><p className="text-foreground">{selectedApp.mobile}</p><a href={`tel:${selectedApp.mobile}`} className="text-primary"><Phone className="w-3.5 h-3.5" /></a></div></div>
                  <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">Email</p><div className="flex items-center gap-2"><p className="text-foreground">{selectedApp.email}</p><button onClick={() => copyToClipboard(selectedApp.email)} className="text-primary"><Copy className="w-3.5 h-3.5" /></button></div></div>
                  {selectedApp.date_of_birth && <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">Date of Birth</p><p className="text-foreground">{selectedApp.date_of_birth}</p></div>}
                  {selectedApp.city && <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">City</p><p className="text-foreground">{selectedApp.city}</p></div>}
                  {selectedApp.state && <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">State</p><p className="text-foreground">{selectedApp.state}</p></div>}
                  {selectedApp.country && <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">Country</p><p className="text-foreground">{selectedApp.country}</p></div>}
                </div>
                {selectedApp.address && <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">Address</p><p className="text-foreground">{selectedApp.address}</p></div>}
              </div>

              {/* Professional Info */}
              <div className="space-y-4">
                <h3 className="font-display text-xl text-foreground border-b border-border pb-2">Professional Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">Role</p><p className="text-foreground capitalize">{selectedApp.role}</p></div>
                  {selectedApp.years_of_experience && <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">Experience</p><p className="text-foreground">{selectedApp.years_of_experience}</p></div>}
                </div>
                {selectedApp.skills && <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">Skills</p><p className="text-foreground whitespace-pre-wrap">{selectedApp.skills}</p></div>}
                {selectedApp.why_join && <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">Why Join THRYLOS?</p><p className="text-foreground whitespace-pre-wrap">{selectedApp.why_join}</p></div>}
                {selectedApp.additional_notes && <div className="bg-secondary rounded-xl p-4"><p className="text-muted-foreground text-xs uppercase mb-1">Additional Notes</p><p className="text-foreground whitespace-pre-wrap">{selectedApp.additional_notes}</p></div>}
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="font-display text-xl text-foreground border-b border-border pb-2">Documents</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedApp.resume_url && (
                    <button onClick={() => openPreview(getDocumentUrl(selectedApp.resume_url!), 'Resume')} className="bg-secondary border border-border rounded-xl p-4 hover:bg-muted hover:border-primary/30 transition-all flex items-center gap-3 text-left">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
                      <div className="flex-1 min-w-0"><p className="text-foreground font-medium truncate">Resume</p><p className="text-muted-foreground text-xs">Click to preview</p></div>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                  {selectedApp.aadhar_urls?.map((url, i) => (
                    <button key={i} onClick={() => openPreview(getDocumentUrl(url), `Aadhar ${i + 1}`)} className="bg-secondary border border-border rounded-xl p-4 hover:bg-muted hover:border-accent/30 transition-all flex items-center gap-3 text-left">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><User className="h-5 w-5 text-accent" /></div>
                      <div className="flex-1 min-w-0"><p className="text-foreground font-medium truncate">Aadhar {i + 1}</p><p className="text-muted-foreground text-xs">Click to preview</p></div>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                  {selectedApp.additional_doc_urls?.map((url, i) => (
                    <button key={i} onClick={() => openPreview(getDocumentUrl(url), `Document ${i + 1}`)} className="bg-secondary border border-border rounded-xl p-4 hover:bg-muted hover:border-orange-500/30 transition-all flex items-center gap-3 text-left">
                      <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center"><FileText className="h-5 w-5 text-orange-500" /></div>
                      <div className="flex-1 min-w-0"><p className="text-foreground font-medium truncate">Document {i + 1}</p><p className="text-muted-foreground text-xs">Click to preview</p></div>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                  {!selectedApp.resume_url && !selectedApp.aadhar_urls?.length && !selectedApp.additional_doc_urls?.length && (
                    <p className="text-muted-foreground col-span-full">No documents uploaded</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Schedule Modal */}
      {showInterviewModal && interviewApp && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowInterviewModal(false)}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border p-6 flex items-center justify-between">
              <h2 className="font-display text-2xl text-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-400" /> Schedule Interview</h2>
              <button onClick={() => setShowInterviewModal(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-muted-foreground">Scheduling interview for <strong className="text-foreground">{interviewApp.full_name}</strong></p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-foreground mb-2">Date *</label><Input type="date" value={interviewData.date} onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })} className="bg-input border-border text-foreground" required /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Time *</label><Input type="time" value={interviewData.time} onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })} className="bg-input border-border text-foreground" required /></div>
              </div>
              <div><label className="block text-sm font-medium text-foreground mb-2">Platform</label>
                <select value={interviewData.platform} onChange={(e) => setInterviewData({ ...interviewData, platform: e.target.value })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:border-primary focus:outline-none">
                  <option value="Discord" className="bg-background">Discord</option><option value="Google Meet" className="bg-background">Google Meet</option><option value="Zoom" className="bg-background">Zoom</option><option value="Microsoft Teams" className="bg-background">Microsoft Teams</option><option value="Phone Call" className="bg-background">Phone Call</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-foreground mb-2">Meeting Link</label><Input value={interviewData.link} onChange={(e) => setInterviewData({ ...interviewData, link: e.target.value })} placeholder="https://..." className="bg-input border-border text-foreground" /></div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setShowInterviewModal(false)} className="flex-1 border-border text-foreground">Cancel</Button>
                <Button onClick={handleInterviewSchedule} disabled={!interviewData.date || !interviewData.time || sendingEmail} className="flex-1 bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30">
                  {sendingEmail ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent mr-2" /> Sending...</> : <><Send className="w-4 h-4 mr-2" /> Send Interview Call</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Email Modal */}
      {showCustomEmailModal && customEmailApp && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowCustomEmailModal(false)}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border p-6 flex items-center justify-between">
              <h2 className="font-display text-2xl text-foreground flex items-center gap-2"><Mail className="w-5 h-5 text-accent" /> Send Custom Email</h2>
              <button onClick={() => setShowCustomEmailModal(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-muted-foreground">Sending email to <strong className="text-foreground">{customEmailApp.full_name}</strong> ({customEmailApp.email})</p>
              <div><label className="block text-sm font-medium text-foreground mb-2">Subject *</label><Input value={customEmailData.subject} onChange={(e) => setCustomEmailData({ ...customEmailData, subject: e.target.value })} placeholder="Email subject..." className="bg-input border-border text-foreground" required /></div>
              <div><label className="block text-sm font-medium text-foreground mb-2">Message *</label><Textarea value={customEmailData.body} onChange={(e) => setCustomEmailData({ ...customEmailData, body: e.target.value })} placeholder="Write your message here..." className="bg-input border-border text-foreground min-h-[150px]" required /></div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setShowCustomEmailModal(false)} className="flex-1 border-border text-foreground">Cancel</Button>
                <Button onClick={handleCustomEmail} disabled={!customEmailData.subject || !customEmailData.body || sendingEmail} className="flex-1 bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30">
                  {sendingEmail ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent mr-2" /> Sending...</> : <><Send className="w-4 h-4 mr-2" /> Send Email</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Email Modal */}
      {showBulkEmailModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowBulkEmailModal(false)}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-border p-6 flex items-center justify-between">
              <h2 className="font-display text-2xl text-foreground flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Bulk Email</h2>
              <button onClick={() => setShowBulkEmailModal(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div><label className="block text-sm font-medium text-foreground mb-2">Target Group</label>
                <select value={bulkEmailData.targetStatus} onChange={(e) => setBulkEmailData({ ...bulkEmailData, targetStatus: e.target.value })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:border-primary focus:outline-none">
                  <option value="all" className="bg-background">All Applicants ({applications.length})</option>
                  {STATUS_FLOW.map(s => <option key={s} value={s} className="bg-background capitalize">{s} ({applications.filter(a => a.status === s).length})</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-foreground mb-2">Subject *</label><Input value={bulkEmailData.subject} onChange={(e) => setBulkEmailData({ ...bulkEmailData, subject: e.target.value })} placeholder="Email subject..." className="bg-input border-border text-foreground" required /></div>
              <div><label className="block text-sm font-medium text-foreground mb-2">Message *</label><Textarea value={bulkEmailData.body} onChange={(e) => setBulkEmailData({ ...bulkEmailData, body: e.target.value })} placeholder="Write your message..." className="bg-input border-border text-foreground min-h-[150px]" required /></div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setShowBulkEmailModal(false)} className="flex-1 border-border text-foreground">Cancel</Button>
                <Button onClick={handleBulkEmail} disabled={!bulkEmailData.subject || !bulkEmailData.body || sendingEmail} className="flex-1 btn-thrylos text-foreground">
                  <span className="relative z-10">{sendingEmail ? 'Sending...' : `Send to ${bulkEmailData.targetStatus === 'all' ? applications.length : applications.filter(a => a.status === bulkEmailData.targetStatus).length} applicants`}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-semibold text-lg">{previewFile.name}</h3>
              <div className="flex items-center gap-2">
                <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-secondary border border-border text-foreground hover:bg-muted transition-colors text-sm flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Open in new tab</a>
                <button onClick={() => setPreviewFile(null)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="flex-1 bg-secondary rounded-2xl border border-border overflow-hidden">
              {previewFile.type === 'image' ? (
                <img src={previewFile.url} alt={previewFile.name} className="w-full h-full object-contain max-h-[75vh]" />
              ) : previewFile.type === 'pdf' ? (
                <iframe src={previewFile.url} className="w-full h-[75vh]" title={previewFile.name} />
              ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-foreground text-lg mb-2">Preview not available</p>
                  <p className="text-muted-foreground mb-6">This file type cannot be previewed directly</p>
                  <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl btn-thrylos text-foreground font-medium hover:scale-105 transition-transform"><span className="relative z-10">Download File</span></a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

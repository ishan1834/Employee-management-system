




import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, MessageCircle, Search, Send, Filter, ChevronDown,
  ThumbsUp, ThumbsDown, Archive, Trash2, RefreshCw, Eye,
  EyeOff, Tag, Clock, User, AlertCircle, CheckCircle2,
  BarChart2, Inbox, ArrowUpRight, X, SlidersHorizontal,
  MoreHorizontal, Flag, Star, Paperclip, Bell, BellOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = 'open' | 'in_progress' | 'resolved' | 'closed';
type Priority = 'low' | 'medium' | 'high' | 'critical';
type Category = 'general' | 'suggestion' | 'bug' | 'appreciation' | 'complaint' | 'question';
type SortKey = 'created_at' | 'priority' | 'status' | 'votes';
type ViewMode = 'list' | 'compact' | 'analytics';

interface Feedback {
  id: string;
  subject: string;
  message: string;
  category: Category;
  status: Status;
  priority: Priority;
  is_anonymous: boolean;
  created_at: string;
  response?: string;
  responded_at?: string;
  vote_count?: number;
  tags?: string[];
  is_pinned?: boolean;
  from?: { name: string; role: string };
  to?: { name: string };
  responder?: { name: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: 'Open',        color: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',       icon: <Inbox className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/15 text-amber-400 border border-amber-500/30', icon: <Clock className="w-3 h-3" /> },
  resolved:    { label: 'Resolved',    color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
  closed:      { label: 'Closed',      color: 'bg-zinc-600/20 text-zinc-400 border border-zinc-600/30',    icon: <Archive className="w-3 h-3" /> },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  low:      { label: 'Low',      color: 'text-zinc-400',   dot: 'bg-zinc-500' },
  medium:   { label: 'Medium',   color: 'text-blue-400',   dot: 'bg-blue-500' },
  high:     { label: 'High',     color: 'text-orange-400', dot: 'bg-orange-500' },
  critical: { label: 'Critical', color: 'text-red-400',    dot: 'bg-red-500' },
};

const CATEGORY_ICONS: Record<Category, string> = {
  general: '💬', suggestion: '💡', bug: '🐛', appreciation: '🙏', complaint: '⚠️', question: '❓'
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) => (
  <div className={`flex items-center gap-3 rounded-xl border bg-white/3 px-4 py-3 ${color}`}>
    <div className="opacity-70">{icon}</div>
    <div>
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  </div>
);

const PriorityDot = ({ priority }: { priority: Priority }) => (
  <span className={`inline-block w-2 h-2 rounded-full ${PRIORITY_CONFIG[priority].dot}`} title={PRIORITY_CONFIG[priority].label} />
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FeedbackSystem: React.FC = () => {
  const { adminProfile } = useAuth();
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  // Data
  const [feedbacks, setFeedbacks]   = useState<Feedback[]>([]);
  const [admins, setAdmins]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  // Form
  const [showForm, setShowForm]     = useState(false);
  const [subject, setSubject]       = useState('');
  const [message, setMessage]       = useState('');
  const [category, setCategory]     = useState<Category>('general');
  const [priority, setPriority]     = useState<Priority>('medium');
  const [toAdminId, setToAdminId]   = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tagInput, setTagInput]     = useState('');
  const [tags, setTags]             = useState<string[]>([]);

  // Responses (per-card state)
  const [responseMap, setResponseMap] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  // Filters & UI
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [sortKey, setSortKey]         = useState<SortKey>('created_at');
  const [viewMode, setViewMode]       = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction]   = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    const [{ data: fbData }, { data: adminsData }] = await Promise.all([
      supabase
        .from('feedback' as any)
        .select('*, from:admins!feedback_from_admin_id_fkey(name, role), to:admins!feedback_to_admin_id_fkey(name), responder:admins!feedback_responded_by_fkey(name)')
        .order('created_at', { ascending: false }),
      supabase.from('admins').select('id, name, role'),
    ]);
    setFeedbacks((fbData as Feedback[]) || []);
    setAdmins(adminsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────────
  const stats = {
    total:      feedbacks.length,
    open:       feedbacks.filter(f => f.status === 'open').length,
    inProgress: feedbacks.filter(f => f.status === 'in_progress').length,
    resolved:   feedbacks.filter(f => f.status === 'resolved').length,
    critical:   feedbacks.filter(f => f.priority === 'critical').length,
  };

  const categoryBreakdown = (['general','suggestion','bug','appreciation','complaint','question'] as Category[])
    .map(c => ({ cat: c, count: feedbacks.filter(f => f.category === c).length }))
    .filter(x => x.count > 0);

  const filtered = feedbacks
    .filter(f => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        f.subject?.toLowerCase().includes(q) ||
        f.message?.toLowerCase().includes(q) ||
        f.from?.name?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q) ||
        f.tags?.some(t => t.toLowerCase().includes(q));
      const matchStatus   = filterStatus   === 'all' || f.status   === filterStatus;
      const matchCategory = filterCategory === 'all' || f.category === filterCategory;
      const matchPriority = filterPriority === 'all' || f.priority === filterPriority;
      return matchSearch && matchStatus && matchCategory && matchPriority;
    })
    .sort((a, b) => {
      if (sortKey === 'priority') {
        const order: Priority[] = ['critical','high','medium','low'];
        return order.indexOf(a.priority) - order.indexOf(b.priority);
      }
      if (sortKey === 'votes') return (b.vote_count || 0) - (a.vote_count || 0);
      if (sortKey === 'status') return a.status.localeCompare(b.status);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Missing fields', description: 'Subject and message are required.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('feedback' as any).insert({
      from_admin_id: adminProfile?.id,
      to_admin_id: toAdminId || null,
      subject, message, category, priority,
      is_anonymous: isAnonymous,
      tags,
      status: 'open',
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Feedback submitted!' });
    setSubject(''); setMessage(''); setCategory('general'); setPriority('medium');
    setToAdminId(''); setIsAnonymous(false); setTags([]); setTagInput('');
    setShowForm(false);
    fetchData();
  };

  const handleRespond = async (id: string) => {
    const text = responseMap[id];
    if (!text?.trim()) return;
    await supabase.from('feedback' as any).update({
      response: text,
      responded_by: adminProfile?.id,
      responded_at: new Date().toISOString(),
      status: 'resolved',
    } as any).eq('id', id);
    setResponseMap(prev => ({ ...prev, [id]: '' }));
    fetchData();
    toast({ title: '✅ Response sent!' });
  };

  const handleStatusChange = async (id: string, status: Status) => {
    await supabase.from('feedback' as any).update({ status } as any).eq('id', id);
    fetchData();
    toast({ title: `Status updated to ${status}` });
  };

  const handlePriorityChange = async (id: string, newPriority: Priority) => {
    await supabase.from('feedback' as any).update({ priority: newPriority } as any).eq('id', id);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback?')) return;
    await supabase.from('feedback' as any).delete().eq('id', id);
    fetchData();
    toast({ title: 'Deleted' });
  };

  const handlePin = async (id: string, pinned: boolean) => {
    await supabase.from('feedback' as any).update({ is_pinned: !pinned } as any).eq('id', id);
    fetchData();
  };

  const handleVote = async (id: string, dir: 1 | -1) => {
    const fb = feedbacks.find(f => f.id === id);
    if (!fb) return;
    await supabase.from('feedback' as any).update({ vote_count: (fb.vote_count || 0) + dir } as any).eq('id', id);
    fetchData();
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    if (bulkAction === 'delete') {
      if (!confirm(`Delete ${ids.length} items?`)) return;
      for (const id of ids) await supabase.from('feedback' as any).delete().eq('id', id);
    } else {
      await supabase.from('feedback' as any).update({ status: bulkAction } as any).in('id', ids);
    }
    setSelectedIds(new Set()); setBulkAction('');
    fetchData();
    toast({ title: `Bulk action applied to ${ids.length} items` });
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); }
    setTagInput('');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(f => f.id)));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080808]">
      <Header />
      <ModuleLayout
        title="Feedback Hub"
        description="Manage team feedback, suggestions & reports"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(v => v === 'analytics' ? 'list' : 'analytics')}
              className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            >
              <BarChart2 className="w-4 h-4 mr-1" /> {viewMode === 'analytics' ? 'List View' : 'Analytics'}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Plus className="w-4 h-4 mr-1" /> New Feedback
            </Button>
          </div>
        }
      >

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total"       value={stats.total}      icon={<MessageCircle className="w-4 h-4" />} color="border-white/8 text-zinc-200" />
          <StatCard label="Open"        value={stats.open}       icon={<Inbox className="w-4 h-4" />}         color="border-sky-500/20 text-sky-300" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<Clock className="w-4 h-4" />}         color="border-amber-500/20 text-amber-300" />
          <StatCard label="Resolved"    value={stats.resolved}   icon={<CheckCircle2 className="w-4 h-4" />}  color="border-emerald-500/20 text-emerald-300" />
          <StatCard label="Critical"    value={stats.critical}   icon={<AlertCircle className="w-4 h-4" />}   color="border-red-500/20 text-red-300" />
        </div>

        {/* ── Analytics View ── */}
        {viewMode === 'analytics' && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-white/8 bg-white/3">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-widest">By Category</h3>
                <div className="space-y-2">
                  {categoryBreakdown.map(({ cat, count }) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-sm w-24 text-zinc-300">{CATEGORY_ICONS[cat]} {cat}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${(count / feedbacks.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/8 bg-white/3">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-widest">By Status</h3>
                <div className="space-y-2">
                  {(['open','in_progress','resolved','closed'] as Status[]).map(s => {
                    const count = feedbacks.filter(f => f.status === s).length;
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <span className="text-sm w-24 text-zinc-300">{STATUS_CONFIG[s].label}</span>
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: feedbacks.length ? `${(count / feedbacks.length) * 100}%` : '0%',
                              background: s === 'open' ? '#38bdf8' : s === 'in_progress' ? '#fbbf24' : s === 'resolved' ? '#34d399' : '#52525b',
                            }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── New Feedback Form ── */}
        {showForm && (
          <Card className="mb-6 border-indigo-500/30 bg-indigo-950/20">
            <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
              <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-widest">New Feedback</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-6 w-6 p-0 text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <Input
                placeholder="Subject *"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-indigo-500/60 text-white placeholder:text-zinc-600"
              />
              <Textarea
                placeholder="Describe your feedback in detail... *"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="bg-white/5 border-white/10 focus:border-indigo-500/60 text-white placeholder:text-zinc-600 resize-none"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Category */}
                <Select value={category} onValueChange={v => setCategory(v as Category)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-zinc-300">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['general','suggestion','bug','appreciation','complaint','question'] as Category[]).map(c => (
                      <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Priority */}
                <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-zinc-300">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['low','medium','high','critical'] as Priority[]).map(p => (
                      <SelectItem key={p} value={p}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                          {PRIORITY_CONFIG[p].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* To Admin */}
                <Select value={toAdminId} onValueChange={setToAdminId}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-zinc-300">
                    <SelectValue placeholder="Direct to..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Anyone</SelectItem>
                    {admins.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Anonymous toggle */}
                <button
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`flex items-center justify-center gap-2 rounded-md border text-sm px-3 py-2 transition-colors ${
                    isAnonymous
                      ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  {isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {isAnonymous ? 'Anonymous' : 'Visible'}
                </button>
              </div>

              {/* Tags */}
              <div>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add tags (press Enter)..."
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    className="bg-white/5 border-white/10 text-sm text-zinc-300 placeholder:text-zinc-600"
                  />
                  <Button variant="outline" size="sm" onClick={addTag} className="border-white/10 bg-white/5 text-zinc-400">
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map(t => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-white/8 border border-white/10 px-2 py-0.5 text-xs text-zinc-300"
                      >
                        #{t}
                        <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-zinc-500">Cancel</Button>
                <Button size="sm" onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5">
                  <Send className="w-4 h-4 mr-1.5" /> Submit Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Search + Filter Bar ── */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <Input
              placeholder="Search by subject, message, author, tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/4 border-white/8 text-zinc-200 placeholder:text-zinc-600"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-white/10 bg-white/5 text-zinc-300 gap-1.5 hover:bg-white/10 ${showFilters ? 'border-indigo-500/50 text-indigo-300' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {(filterStatus !== 'all' || filterCategory !== 'all' || filterPriority !== 'all') && (
              <span className="bg-indigo-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {[filterStatus, filterCategory, filterPriority].filter(f => f !== 'all').length}
              </span>
            )}
          </Button>
          <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-zinc-300">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Latest</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="votes">Votes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl border border-white/8 bg-white/3">
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10 text-zinc-300 h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(['open','in_progress','resolved','closed'] as Status[]).map(s => (
                  <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={v => setFilterCategory(v as any)}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10 text-zinc-300 h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(['general','suggestion','bug','appreciation','complaint','question'] as Category[]).map(c => (
                  <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={v => setFilterPriority(v as any)}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10 text-zinc-300 h-8 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {(['low','medium','high','critical'] as Priority[]).map(p => (
                  <SelectItem key={p} value={p}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                      {PRIORITY_CONFIG[p].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost" size="sm"
              onClick={() => { setFilterStatus('all'); setFilterCategory('all'); setFilterPriority('all'); }}
              className="h-8 text-xs text-zinc-500 hover:text-zinc-200"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* ── Bulk Actions ── */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-950/20">
            <span className="text-sm text-indigo-300">{selectedIds.size} selected</span>
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-zinc-300 h-7 text-xs">
                <SelectValue placeholder="Bulk action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Mark Open</SelectItem>
                <SelectItem value="in_progress">Mark In Progress</SelectItem>
                <SelectItem value="resolved">Mark Resolved</SelectItem>
                <SelectItem value="closed">Mark Closed</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkAction} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500">Apply</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="h-7 text-xs text-zinc-500">Deselect</Button>
          </div>
        )}

        {/* ── Select All row ── */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between mb-2 px-1">
            <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="accent-indigo-500"
              />
              Select all ({filtered.length})
            </label>
            <Button variant="ghost" size="sm" onClick={fetchData} className="h-6 text-xs text-zinc-600 hover:text-zinc-300 gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>
        )}

        {/* ── Feed ── */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-28 rounded-xl border border-white/6 bg-white/3 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageCircle className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">No feedback found.</p>
            {search && <p className="text-zinc-600 text-xs mt-1">Try clearing your search or filters.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(fb => {
              const isExpanded = expandedId === fb.id;
              const sc = STATUS_CONFIG[fb.status] || STATUS_CONFIG.open;

              return (
                <Card
                  key={fb.id}
                  className={`border bg-white/3 transition-all duration-200 hover:bg-white/5 ${
                    fb.is_pinned ? 'border-amber-500/30' : 'border-white/8'
                  } ${selectedIds.has(fb.id) ? 'ring-1 ring-indigo-500/40' : ''}`}
                >
                  <CardContent className="p-4">
                    {/* Row 1: checkbox + subject + badges + actions */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(fb.id)}
                        onChange={() => toggleSelect(fb.id)}
                        className="mt-1 accent-indigo-500 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{CATEGORY_ICONS[fb.category as Category] || '💬'}</span>
                            <h3 className="font-semibold text-white text-sm leading-tight">{fb.subject}</h3>
                            {fb.is_pinned && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <PriorityDot priority={fb.priority || 'medium'} />
                            <Badge className={`${sc.color} flex items-center gap-1 text-xs py-0.5`}>
                              {sc.icon} {sc.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Meta */}
                        <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1.5 flex-wrap">
                          <User className="w-3 h-3" />
                          <span>{fb.is_anonymous ? 'Anonymous' : (fb.from?.name || 'Unknown')}</span>
                          {fb.to?.name && <><ArrowUpRight className="w-3 h-3" /><span>{fb.to.name}</span></>}
                          <span className="text-zinc-700">•</span>
                          <span className="capitalize">{fb.category}</span>
                          <span className="text-zinc-700">•</span>
                          <Clock className="w-3 h-3" />
                          <span>{new Date(fb.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </p>

                        {/* Tags */}
                        {fb.tags && fb.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {fb.tags.map(t => (
                              <span key={t} className="text-xs rounded-full bg-white/6 border border-white/8 px-2 py-0.5 text-zinc-400">#{t}</span>
                            ))}
                          </div>
                        )}

                        {/* Message preview / expanded */}
                        <p className={`text-sm text-zinc-300 mt-2 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {fb.message}
                        </p>
                        {fb.message?.length > 120 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 mt-1"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}

                        {/* Response */}
                        {fb.response && (
                          <div className="mt-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-3">
                            <p className="text-xs text-emerald-400 font-medium mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Response by {fb.responder?.name || 'Admin'}
                              {fb.responded_at && (
                                <span className="text-emerald-700 font-normal ml-1">
                                  · {new Date(fb.responded_at).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-emerald-200">{fb.response}</p>
                          </div>
                        )}

                        {/* Action bar */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {/* Voting */}
                          <div className="flex items-center gap-1 mr-1">
                            <button onClick={() => handleVote(fb.id, 1)} className="text-zinc-500 hover:text-emerald-400 transition-colors">
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-zinc-500 min-w-4 text-center">{fb.vote_count || 0}</span>
                            <button onClick={() => handleVote(fb.id, -1)} className="text-zinc-500 hover:text-red-400 transition-colors">
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Super admin controls */}
                          {isSuperAdmin && (
                            <>
                              <Select value={fb.status} onValueChange={v => handleStatusChange(fb.id, v as Status)}>
                                <SelectTrigger className="h-6 text-xs w-32 bg-white/5 border-white/10 text-zinc-300 px-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(['open','in_progress','resolved','closed'] as Status[]).map(s => (
                                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={fb.priority || 'medium'} onValueChange={v => handlePriorityChange(fb.id, v as Priority)}>
                                <SelectTrigger className="h-6 text-xs w-28 bg-white/5 border-white/10 text-zinc-300 px-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(['low','medium','high','critical'] as Priority[]).map(p => (
                                    <SelectItem key={p} value={p}>
                                      <span className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                                        {PRIORITY_CONFIG[p].label}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button
                                onClick={() => handlePin(fb.id, !!fb.is_pinned)}
                                className={`transition-colors ${fb.is_pinned ? 'text-amber-400' : 'text-zinc-600 hover:text-amber-400'}`}
                                title={fb.is_pinned ? 'Unpin' : 'Pin'}
                              >
                                <Star className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(fb.id)}
                                className="text-zinc-600 hover:text-red-400 transition-colors ml-auto"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Super admin respond input */}
                        {isSuperAdmin && fb.status !== 'closed' && (
                          <div className="flex gap-2 mt-3">
                            <Input
                              placeholder="Write a response..."
                              value={responseMap[fb.id] || ''}
                              onChange={e => setResponseMap(prev => ({ ...prev, [fb.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRespond(fb.id); } }}
                              className="bg-white/5 border-white/10 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleRespond(fb.id)}
                              disabled={!responseMap[fb.id]?.trim()}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

export default FeedbackSystem;

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PAGE_SIZE = 6;

const Tasks: React.FC = () => {
  const { adminProfile } = useAuth();
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  /* ================= FETCH ================= */

  const fetchTasks = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('tasks' as any)
      .select('*')
      .order('created_at', { ascending: false });

    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  /* ================= FILTER ================= */

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [tasks, search, statusFilter, categoryFilter]);

  /* ================= PAGINATION ================= */

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'pending').length
    };
  }, [tasks]);

  /* ================= BULK ================= */

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const bulkDelete = async () => {
    if (!selected.length) return;

    await supabase.from('tasks' as any).delete().in('id', selected);
    setLogs(prev => [`Deleted ${selected.length} tasks`, ...prev]);
    setSelected([]);
    fetchTasks();
  };

  const bulkComplete = async () => {
    if (!selected.length) return;

    await supabase.from('tasks' as any).update({ status: 'completed' }).in('id', selected);
    setLogs(prev => [`Completed ${selected.length} tasks`, ...prev]);
    setSelected([]);
    fetchTasks();
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <ModuleLayout title="Enterprise Tasks" description="Full dashboard control">

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card><CardContent className="p-4 text-center">{stats.total} Total</CardContent></Card>
          <Card><CardContent className="p-4 text-green-400">{stats.completed} Done</CardContent></Card>
          <Card><CardContent className="p-4 text-yellow-400">{stats.pending} Pending</CardContent></Card>
        </div>

        {/* ===== FILTERS ===== */}
        <div className="flex gap-3 mb-6">
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ===== BULK ACTIONS ===== */}
        {selected.length > 0 && (
          <div className="flex gap-2 mb-4 animate-fade">
            <Button onClick={bulkComplete}>Complete Selected</Button>
            <Button variant="destructive" onClick={bulkDelete}>Delete Selected</Button>
          </div>
        )}

        {/* ===== LIST ===== */}
        {loading ? (
          <p>Loading...</p>
        ) : paginated.map(t => (
          <Card key={t.id} className="hover-scale transition">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggleSelect(t.id)} />

                <button>
                  {t.status === 'completed' ? <CheckCircle2 /> : <Circle />}
                </button>

                <div>
                  <div>{t.title}</div>
                  <Badge>{t.category}</Badge>
                </div>
              </div>

              {isSuperAdmin && (
                <Button onClick={() => bulkDelete()}>
                  <Trash2 />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {/* ===== PAGINATION ===== */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => (
            <Button key={i} onClick={() => setPage(i + 1)} variant={page === i + 1 ? 'default' : 'outline'}>
              {i + 1}
            </Button>
          ))}
        </div>

        {/* ===== ACTIVITY LOG ===== */}
        <div className="mt-8">
          <h3 className="mb-2 text-sm text-gray-400">Activity</h3>
          {logs.map((l, i) => (
            <div key={i} className="text-xs text-gray-500">{l}</div>
          ))}
        </div>

      </ModuleLayout>
    </div>
  );
};

export default Tasks;

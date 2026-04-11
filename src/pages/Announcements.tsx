import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/* ====================== DEBOUNCE ====================== */

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value]);
  return debounced;
};

/* ====================== COMPONENT ====================== */

const Tasks: React.FC = () => {
  const { adminProfile } = useAuth();
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const [statusFilter, setStatusFilter] = useState('all');

  const cacheKey = 'tasks-cache';

  /* ====================== CACHE LOAD ====================== */

  const loadCache = () => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setTasks(JSON.parse(cached));
    }
  };

  const saveCache = (data: any[]) => {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  };

  /* ====================== FETCH ====================== */

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('tasks' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks(data || []);
      saveCache(data || []);
    } catch (err: any) {
      toast({
        title: 'Fetch failed',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  /* ====================== REALTIME ====================== */

  useEffect(() => {
    loadCache();
    fetchTasks();

    const channel = supabase
      .channel('tasks-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    const interval = setInterval(fetchTasks, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  /* ====================== OPTIMISTIC UPDATE ====================== */

  const toggleStatus = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    // optimistic update
    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    const { error } = await supabase
      .from('tasks' as any)
      .update({ status: newStatus })
      .eq('id', task.id);

    if (error) {
      toast({ title: 'Error', description: error.message });
      fetchTasks(); // rollback
    }
  };

  /* ====================== DELETE ====================== */

  const handleDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));

    const { error } = await supabase
      .from('tasks' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Delete failed' });
      fetchTasks();
    }
  };

  /* ====================== FILTER ====================== */

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.title?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tasks, debouncedSearch, statusFilter]);

  /* ====================== STATS ====================== */

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    return { total, completed, pending };
  }, [tasks]);

  /* ====================== UI ====================== */

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <ModuleLayout
        title="Tasks (Real-Time)"
        description="Live updates + optimized performance"
        actions={
          isSuperAdmin && (
            <Button>
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </Button>
          )
        }
      >

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card><CardContent className="p-4 text-center">{stats.total} Total</CardContent></Card>
          <Card><CardContent className="p-4 text-green-400">{stats.completed} Completed</CardContent></Card>
          <Card><CardContent className="p-4 text-yellow-400">{stats.pending} Pending</CardContent></Card>
        </div>

        {/* ===== SEARCH ===== */}
        <div className="flex gap-3 mb-6">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ===== LIST ===== */}
        {loading ? (
          <p>Loading...</p>
        ) : filtered.map(t => (
          <Card key={t.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleStatus(t)}>
                  {t.status === 'completed' ? <CheckCircle2 /> : <Circle />}
                </button>
                <span>{t.title}</span>
              </div>

              {isSuperAdmin && (
                <Button onClick={() => handleDelete(t.id)}>
                  <Trash2 />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

      </ModuleLayout>
    </div>
  );
};

export default Tasks;

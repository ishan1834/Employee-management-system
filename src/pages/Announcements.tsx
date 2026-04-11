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
import { CheckCircle2, Circle, Clock, Plus, Trash2, Search, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/* ====================== DEBOUNCE HOOK ====================== */

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

/* ====================== COMPONENT ====================== */

const Tasks: React.FC = () => {
  const { adminProfile } = useAuth();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const [taskTitle, setTaskTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [statusFilter, setStatusFilter] = useState('all');

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  /* ====================== FETCH ====================== */

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('tasks' as any)
        .select('*, admins!tasks_assigned_by_fkey(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks(data || []);
    } catch (err: any) {
      toast({
        title: 'Error loading tasks',
        description: err.message,
        variant: 'destructive'
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  /* ====================== CREATE ====================== */

  const handleCreate = async () => {
    if (!taskTitle.trim()) return;

    const { error } = await supabase.from('tasks' as any).insert({
      title: taskTitle,
      category,
      status: 'pending',
      assigned_by: adminProfile?.id
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Task created!' });
    setTaskTitle('');
    setShowForm(false);
    fetchTasks();
  };

  /* ====================== ACTIONS ====================== */

  const toggleStatus = async (id: string, status: string) => {
    const newStatus = status === 'completed' ? 'pending' : 'completed';
    await supabase.from('tasks' as any).update({ status: newStatus }).eq('id', id);
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete task?')) return;
    await supabase.from('tasks' as any).delete().eq('id', id);
    fetchTasks();
  };

  /* ====================== FILTER ====================== */

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, debouncedSearch, statusFilter]);

  /* ====================== STATS PANEL ====================== */

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;

    return { total, completed, pending };
  }, [tasks]);

  /* ====================== CATEGORY COLORS ====================== */

  const categoryColors: Record<string, string> = {
    urgent: 'bg-red-500/20 text-red-400',
    feature: 'bg-purple-500/20 text-purple-400',
    bug: 'bg-yellow-500/20 text-yellow-400',
    general: 'bg-blue-500/20 text-blue-400'
  };

  /* ====================== UI ====================== */

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <ModuleLayout 
        title="Tasks & Roadmap"
        description="Manage your tasks efficiently"
        actions={
          isSuperAdmin && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-1" /> New Task
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
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ===== TASK LIST ===== */}
        {loading ? (
          <p>Loading...</p>
        ) : filtered.map(t => (
          <Card key={t.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <button onClick={() => toggleStatus(t.id, t.status)}>
                  {t.status === 'completed' ? <CheckCircle2 /> : <Circle />}
                </button>
                <div>
                  <div>{t.title}</div>
                  <Badge className={categoryColors[t.category] || ''}>{t.category}</Badge>
                </div>
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

import React, { useState, useEffect } from 'react';
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

const Tasks: React.FC = () => {
  const { adminProfile } = useAuth();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [statusFilter, setStatusFilter] = useState('all');

  const isSuperAdmin = adminProfile?.role === 'super_admin';

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

  const filtered = tasks.filter(t =>
    t.title?.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'all' || t.status === statusFilter)
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <ModuleLayout title="Tasks" description="Manage tasks">
        
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filtered.map(t => (
          <Card key={t.id}>
            <CardContent className="p-4 flex justify-between">
              <span>{t.title}</span>
              <Button onClick={() => toggleStatus(t.id, t.status)}>Toggle</Button>
            </CardContent>
          </Card>
        ))}

      </ModuleLayout>
    </div>
  );
};

export default Tasks;

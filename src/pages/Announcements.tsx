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
    setLoading(true);

    const { data, error } = await supabase
      .from('tasks' as any)
      .select('*, admins!tasks_assigned_by_fkey(name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Unable to load tasks',
        description: error.message,
        variant: 'destructive'
      });
      setTasks([]);
      setLoading(false);
      return;
    }

    setTasks((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    if (!taskTitle.trim()) return;
    const { error } = await supabase.from('tasks' as any).insert({
      title: taskTitle,
      category,
      status: 'pending',
      assigned_by: adminProfile?.id
    } as any);
    
    if (error) { 
      toast({ title: 'Error', description: error.message, variant: 'destructive' }); 
      return; 
    }
    
    toast({ title: 'Task created!' });
    setTaskTitle('');
    setShowForm(false);
    fetchTasks();
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await supabase.from('tasks' as any).update({ status: newStatus } as any).eq('id', id);
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this task?')) return;
    await supabase.from('tasks' as any).delete().eq('id', id);
    fetchTasks();
  };

  const filtered = tasks.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const categoryColors: Record<string, string> = {
    urgent: 'bg-red-500/20 text-red-400',
    feature: 'bg-purple-500/20 text-purple-400',
    bug: 'bg-yellow-500/20 text-yellow-400',
    general: 'bg-blue-500/20 text-blue-400'
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <ModuleLayout 
        title="Tasks & Roadmap" 
        description="Internal development tasks and operational goals"
        actions={isSuperAdmin ? <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Task</Button> : undefined}
      >
        
        {showForm && isSuperAdmin && (
          <Card className="mb-6 border-white/10 bg-white/5">
            <CardContent className="p-4 flex flex-wrap gap-3 items-center">
              <Input 
                placeholder="What needs to be done?" 
                value={taskTitle} 
                onChange={e => setTaskTitle(e.target.value)} 
                className="flex-1 min-w-[200px] bg-white/5 border-white/10" 
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-32 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} size="sm">Add</Button>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Filter tasks..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-10 bg-white/5 border-white/10" 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40 bg-white/5 border-white/10">
              <div className="flex items-center gap-2"><Filter className="w-3 h-3" /> <SelectValue /></div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading tasks...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-10 border border-dashed border-white/10 rounded-lg">No tasks found.</p>
        ) : (
          <div className="grid gap-3">
            {filtered.map(t => (
              <Card key={t.id} className={`border-white/10 bg-white/5 transition-opacity ${t.status === 'completed' ? 'opacity-60' : ''}`}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <button 
                      onClick={() => toggleStatus(t.id, t.status)}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      {t.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${t.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
                          {t.title}
                        </span>
                        <Badge className={`text-[10px] px-2 py-0 h-4 ${categoryColors[t.category] || categoryColors.general}`}>
                          {t.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Added {new Date(t.created_at).toLocaleDateString()} by {t.admins?.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  {isSuperAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

export default Tasks;

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, GripVertical, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const columns = [
  { key: 'todo', label: 'To Do', color: 'border-t-blue-500' },
  { key: 'in_progress', label: 'In Progress', color: 'border-t-yellow-500' },
  { key: 'review', label: 'Review', color: 'border-t-purple-500' },
  { key: 'done', label: 'Done', color: 'border-t-green-500' }
];

const KanbanBoard: React.FC = () => {
  const { adminProfile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const fetchData = async () => {
    const [{ data: tasksData }, { data: adminsData }] = await Promise.all([
      supabase.from('kanban_tasks' as any).select('*, assigned:admins!kanban_tasks_assigned_to_fkey(name, role), creator:admins!kanban_tasks_created_by_fkey(name)').order('created_at', { ascending: false }),
      supabase.from('admins').select('id, name, role')
    ]);
    setTasks((tasksData as any[]) || []);
    setAdmins(adminsData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 5000); return () => clearInterval(i); }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    const { error } = await supabase.from('kanban_tasks' as any).insert({
      title, description, priority, assigned_to: assignedTo || adminProfile?.id,
      created_by: adminProfile?.id, due_date: dueDate || null
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Task created!' });
    setTitle(''); setDescription(''); setPriority('medium'); setAssignedTo(''); setDueDate(''); setShowForm(false);
    fetchData();
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    await supabase.from('kanban_tasks' as any).update({ status: newStatus } as any).eq('id', taskId);
    fetchData();
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete task?')) return;
    await supabase.from('kanban_tasks' as any).delete().eq('id', id);
    fetchData();
  };

  const filtered = tasks.filter(t =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.assigned?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-500/20 text-gray-400', medium: 'bg-blue-500/20 text-blue-400',
    high: 'bg-orange-500/20 text-orange-400', urgent: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout title="Task Board" description="Kanban-style task management"
        actions={<Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Task</Button>}>
        
        {showForm && (
          <Card className="mb-6 border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-3">
              <Input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} className="bg-white/5 border-white/10" />
              <Textarea placeholder="Description..." value={description} onChange={e => setDescription(e.target.value)} className="bg-white/5 border-white/10" />
              <div className="flex gap-3 flex-wrap">
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-28 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                </Select>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className="w-40 bg-white/5 border-white/10"><SelectValue placeholder="Assign to" /></SelectTrigger>
                  <SelectContent>{admins.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-40 bg-white/5 border-white/10" />
                <Button onClick={handleCreate} size="sm">Create</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>

        {loading ? <p className="text-gray-400">Loading...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map(col => (
              <div key={col.key} className={`bg-white/5 rounded-lg border border-white/10 border-t-4 ${col.color} p-3`}>
                <h3 className="font-semibold text-white mb-3 text-sm">{col.label} ({filtered.filter(t => t.status === col.key).length})</h3>
                <div className="space-y-2 min-h-[100px]">
                  {filtered.filter(t => t.status === col.key).map(task => (
                    <Card key={task.id} className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-medium text-white">{task.title}</h4>
                          <Badge className={`text-[10px] ${priorityColors[task.priority]}`}>{task.priority}</Badge>
                        </div>
                        {task.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">{task.assigned?.name || 'Unassigned'}</span>
                          {task.due_date && <span className="text-[10px] text-gray-500">{new Date(task.due_date).toLocaleDateString()}</span>}
                        </div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {columns.filter(c => c.key !== task.status).map(c => (
                            <Button key={c.key} variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => moveTask(task.id, c.key)}>{c.label}</Button>
                          ))}
                          {(isSuperAdmin || task.created_by === adminProfile?.id) && (
                            <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => deleteTask(task.id)}><Trash2 className="w-3 h-3 text-red-400" /></Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

export default KanbanBoard;

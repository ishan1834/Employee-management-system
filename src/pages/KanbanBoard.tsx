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

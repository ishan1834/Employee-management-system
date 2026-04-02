

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Code, Bug, Globe, Wrench, Loader2 } from 'lucide-react';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';
import { useAutoAttendance } from '@/hooks/useAutoAttendance';

interface TechWorkLog {
  id: string;
  admin_id: string;
  work_type: string;
  title: string;
  description: string | null;
  url: string | null;
  hours_spent: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const workTypes = [
  { value: 'page_created', label: 'Page Created', icon: Globe },
  { value: 'page_fixed', label: 'Page Fixed', icon: Wrench },
  { value: 'bug_fixed', label: 'Bug Fixed', icon: Bug },
  { value: 'feature_added', label: 'Feature Added', icon: Code },
  { value: 'other', label: 'Other', icon: Code },
];

const TechWorkDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const { markAttendanceAsPresent } = useAutoAttendance();
  const [workLogs, setWorkLogs] = useState<TechWorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLog, setEditingLog] = useState<TechWorkLog | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    work_type: '',
    title: '',
    description: '',
    url: '',
    hours_spent: 0,
    status: 'completed'
  });

  // Stats
  const [stats, setStats] = useState({
    totalWork: 0,
    pagesCreated: 0,
    pagesFixed: 0,
    bugsFixed: 0,
    featuresAdded: 0,
    totalHours: 0
  });

  const fetchWorkLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('tech_work_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkLogs(data || []);

      // Calculate stats
      const logs = data || [];
      setStats({
        totalWork: logs.length,
        pagesCreated: logs.filter(l => l.work_type === 'page_created').length,
        pagesFixed: logs.filter(l => l.work_type === 'page_fixed').length,
        bugsFixed: logs.filter(l => l.work_type === 'bug_fixed').length,
        featuresAdded: logs.filter(l => l.work_type === 'feature_added').length,
        totalHours: logs.reduce((sum, l) => sum + (l.hours_spent || 0), 0)
      });
    } catch (error) {
      console.error('Error fetching work logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkLogs();
    const interval = setInterval(fetchWorkLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (editingLog) {
      setFormData({
        work_type: editingLog.work_type,
        title: editingLog.title,
        description: editingLog.description || '',
        url: editingLog.url || '',
        hours_spent: editingLog.hours_spent,
        status: editingLog.status
      });
      setShowForm(true);
    }
  }, [editingLog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile?.id) return;

    setIsSubmitting(true);
    try {
      if (editingLog) {
        const { error } = await supabase
          .from('tech_work_logs')
          .update({
            ...formData,
            hours_spent: Number(formData.hours_spent)
          })
          .eq('id', editingLog.id);

        if (error) throw error;
        await logActivity(ActivityActions.UPDATE_TECH_WORK, { 
          title: formData.title, 
          work_type: formData.work_type 
        });
        toast({ title: 'Success', description: 'Work log updated successfully' });
      } else {
        const { error } = await supabase
          .from('tech_work_logs')
          .insert({
            ...formData,
            admin_id: adminProfile.id,
            hours_spent: Number(formData.hours_spent)
          });

        if (error) throw error;
        await logActivity(ActivityActions.CREATE_TECH_WORK, { 
          title: formData.title, 
          work_type: formData.work_type 
        });
        // Auto-mark attendance as present when work log is created
        await markAttendanceAsPresent();
        toast({ title: 'Success', description: 'Work log added successfully' });
      }

      setFormData({ work_type: '', title: '', description: '', url: '', hours_spent: 0, status: 'completed' });
      setEditingLog(null);
      setShowForm(false);
      fetchWorkLogs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work log?')) return;
    
    const logToDelete = workLogs.find(l => l.id === id);

    try {
      const { error } = await supabase.from('tech_work_logs').delete().eq('id', id);
      if (error) throw error;
      await logActivity(ActivityActions.DELETE_TECH_WORK, { 
        title: logToDelete?.title,
        work_type: logToDelete?.work_type 
      });
      toast({ title: 'Success', description: 'Work log deleted' });
      fetchWorkLogs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getWorkTypeIcon = (type: string) => {
    const workType = workTypes.find(w => w.value === type);
    if (workType) {
      const Icon = workType.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <Code className="h-4 w-4" />;
  };

  const getWorkTypeLabel = (type: string) => {
    return workTypes.find(w => w.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Tech Work Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gradient">{stats.totalWork}</p>
              <p className="text-sm text-muted-foreground">Total Work</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.pagesCreated}</p>
              <p className="text-sm text-muted-foreground">Pages Created</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.pagesFixed}</p>
              <p className="text-sm text-muted-foreground">Pages Fixed</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.bugsFixed}</p>
              <p className="text-sm text-muted-foreground">Bugs Fixed</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.featuresAdded}</p>
              <p className="text-sm text-muted-foreground">Features Added</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.totalHours}h</p>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Work Button */}
        {!showForm && (
          <Button className="mb-6 gradient-primary" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Work Log
          </Button>
        )}

export default TechWorkDashboard;

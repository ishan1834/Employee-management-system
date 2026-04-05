

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

    const logs = data || [];
    setWorkLogs(logs);

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


        


        {/* Add/Edit Form */}



        
        {showForm && (
          <Card className="mb-6 gradient-card border-white/10">
            <CardHeader>
              <CardTitle>{editingLog ? 'Edit Work Log' : 'Add New Work Log'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Work Type</Label>
                    <Select value={formData.work_type} onValueChange={(v) => setFormData({ ...formData, work_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                      <SelectContent>
                        {workTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Homepage redesign"
                      required
                    />
                  </div>
                  <div>
                    <Label>URL (optional)</Label>
                    <Input
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Hours Spent</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.hours_spent}
                      onChange={(e) => setFormData({ ...formData, hours_spent: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending_review">Pending Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the work done..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingLog ? 'Update' : 'Add'} Work Log
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingLog(null); setFormData({ work_type: '', title: '', description: '', url: '', hours_spent: 0, status: 'completed' }); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Work Logs Table */}
        <Card className="gradient-card border-white/10">
          <CardHeader>
            <CardTitle>Work Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {workLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No work logs yet. Add your first one!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getWorkTypeIcon(log.work_type)}
                          <span>{getWorkTypeLabel(log.work_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.title}</p>
                          {log.url && (
                            <a href={log.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                              {log.url}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{log.hours_spent}h</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'completed' ? 'default' : log.status === 'in_progress' ? 'secondary' : 'outline'}>
                          {log.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(log.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingLog(log)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(log.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


export default TechWorkDashboard;

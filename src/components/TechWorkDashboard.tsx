import React, { useState, useEffect, useCallback } from 'react';
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

// ==========================================
// 1. TYPES & CONFIGURATION
// ==========================================
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

// ==========================================
// 2. STATS CARDS COMPONENT
// ==========================================
const StatsGrid: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
    {[
      { label: 'Total Work', value: stats.totalWork, color: 'text-gradient' },
      { label: 'Pages Created', value: stats.pagesCreated, color: 'text-green-400' },
      { label: 'Pages Fixed', value: stats.pagesFixed, color: 'text-blue-400' },
      { label: 'Bugs Fixed', value: stats.bugsFixed, color: 'text-red-400' },
      { label: 'Features Added', value: stats.featuresAdded, color: 'text-purple-400' },
      { label: 'Total Hours', value: `${stats.totalHours}h`, color: 'text-yellow-400' },
    ].map((s, i) => (
      <Card key={i} className="gradient-card border-white/10">
        <CardContent className="p-4 text-center">
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-sm text-muted-foreground">{s.label}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);

// ==========================================
// 3. LOG ENTRY FORM COMPONENT
// ==========================================
const WorkLogForm: React.FC<{
  formData: any;
  setFormData: any;
  onSubmit: any;
  onCancel: any;
  isSubmitting: boolean;
  isEditing: boolean;
}> = ({ formData, setFormData, onSubmit, onCancel, isSubmitting, isEditing }) => (
  <Card className="mb-6 gradient-card border-white/10">
    <CardHeader>
      <CardTitle>{isEditing ? 'Edit Work Log' : 'Add New Work Log'}</CardTitle>
    </CardHeader>
    <CardContent>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Work Type</Label>
            <Select value={formData.work_type} onValueChange={(v) => setFormData({ ...formData, work_type: v })}>
              <SelectTrigger><SelectValue placeholder="Select work type" /></SelectTrigger>
              <SelectContent>
                {workTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div>
            <Label>URL (optional)</Label>
            <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} />
          </div>
          <div>
            <Label>Hours Spent</Label>
            <Input type="number" step="0.5" value={formData.hours_spent} onChange={(e) => setFormData({ ...formData, hours_spent: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} {isEditing ? 'Update' : 'Add'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </CardContent>
  </Card>
);

// ==========================================
// 4. DATA TABLE COMPONENT
// ==========================================
const WorkLogTable: React.FC<{ logs: TechWorkLog[]; onEdit: any; onDelete: any }> = ({ logs, onEdit, onDelete }) => {
  const getIcon = (type: string) => {
    const Icon = workTypes.find(w => w.value === type)?.icon || Code;
    return <Icon className="h-4 w-4" />;
  };

  return (
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
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                {getIcon(log.work_type)}
                <span>{workTypes.find(w => w.value === log.work_type)?.label || log.work_type}</span>
              </div>
            </TableCell>
            <TableCell>
              <p className="font-medium">{log.title}</p>
              {log.url && <a href={log.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">{log.url}</a>}
            </TableCell>
            <TableCell>{log.hours_spent}h</TableCell>
            <TableCell>
              <Badge variant={log.status === 'completed' ? 'default' : 'secondary'}>{log.status.replace('_', ' ')}</Badge>
            </TableCell>
            <TableCell>{new Date(log.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(log)}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(log.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// ==========================================
// 5. DATA HOOK (LOGIC & FETCHING)
// ==========================================
const useTechWorkData = () => {
  const [workLogs, setWorkLogs] = useState<TechWorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalWork: 0, pagesCreated: 0, pagesFixed: 0, bugsFixed: 0, featuresAdded: 0, totalHours: 0 });

  const fetchWorkLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('tech_work_logs').select('*').order('created_at', { ascending: false });
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
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }, []);

  return { workLogs, stats, isLoading, fetchWorkLogs };
};

// ==========================================
// 6. ACTION HANDLERS UTILITY
// ==========================================
const initialFormState = { work_type: '', title: '', description: '', url: '', hours_spent: 0, status: 'completed' };

// ==========================================
// 7. MAIN DASHBOARD ASSEMBLER
// ==========================================
const TechWorkDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const { markAttendanceAsPresent } = useAutoAttendance();
  const { workLogs, stats, isLoading, fetchWorkLogs } = useTechWorkData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLog, setEditingLog] = useState<TechWorkLog | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchWorkLogs();
    const interval = setInterval(fetchWorkLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchWorkLogs]);

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
      const payload = { ...formData, hours_spent: Number(formData.hours_spent) };
      if (editingLog) {
        const { error } = await supabase.from('tech_work_logs').update(payload).eq('id', editingLog.id);

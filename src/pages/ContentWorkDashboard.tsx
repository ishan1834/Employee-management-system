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
import { ArrowLeft, Plus, Edit, Trash2, Image, Video, FileText, Share2, Loader2 } from 'lucide-react';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';
import { useAutoAttendance } from '@/hooks/useAutoAttendance';

interface ContentWorkLog {
  id: string;
  admin_id: string;
  content_type: string;
  title: string;
  description: string | null;
  platform: string | null;
  file_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
const navigate = useNavigate();
const { adminProfile } = useAuth();
const { toast } = useToast();
const { logActivity } = useActivityLogger();
const { markAttendanceAsPresent } = useAutoAttendance();

const [contentLogs, setContentLogs] = useState<ContentWorkLog[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isSubmitting, setIsSubmitting] = useState(false);
const [editingLog, setEditingLog] = useState<ContentWorkLog | null>(null);
const [showForm, setShowForm] = useState(false);
const [formData, setFormData] = useState({
  content_type: '',
  title: '',
  description: '',
  platform: '',
  file_url: '',
  status: 'completed'
});

const [stats, setStats] = useState({
  totalContent: 0,
  posters: 0,
  images: 0,
  videos: 0,
  socialPosts: 0,
  blogs: 0
});

const fetchContentLogs = async () => {
  try {
    const { data, error } = await supabase
      .from('content_work_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setContentLogs(data || []);

    const logs = data || [];
    setStats({
      totalContent: logs.length,
      posters: logs.filter(l => l.content_type === 'poster').length,
      images: logs.filter(l => l.content_type === 'image').length,
      videos: logs.filter(l => l.content_type === 'video').length,
      socialPosts: logs.filter(l => l.content_type === 'social_post').length,
      blogs: logs.filter(l => l.content_type === 'blog').length
    });
  } catch (error) {
    console.error('Error fetching content logs:', error);
  } finally {
    setIsLoading(false);
  }
};
useEffect(() => {
  if (editingLog) {
    setFormData({
      content_type: editingLog.content_type,
      title: editingLog.title,
      description: editingLog.description || '',
      platform: editingLog.platform || '',
      file_url: editingLog.file_url || '',
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
        .from('content_work_logs')
        .update(formData)
        .eq('id', editingLog.id);

      if (error) throw error;

      await logActivity(ActivityActions.UPDATE_CONTENT_WORK, {
        title: formData.title,
        content_type: formData.content_type,
        platform: formData.platform
      });

      toast({ title: 'Success', description: 'Content log updated successfully' });
    } else {
      const { error } = await supabase
        .from('content_work_logs')
        .insert({
          ...formData,
          admin_id: adminProfile.id
        });

      if (error) throw error;

      await logActivity(ActivityActions.CREATE_CONTENT_WORK, {
        title: formData.title,
        content_type: formData.content_type,
        platform: formData.platform
      });

      await markAttendanceAsPresent();

      toast({ title: 'Success', description: 'Content log added successfully' });
    }

    setFormData({ content_type: '', title: '', description: '', platform: '', file_url: '', status: 'completed' });
    setEditingLog(null);
    setShowForm(false);
    fetchContentLogs();
  } catch (error: any) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' });
  } finally {
    setIsSubmitting(false);
  }
};

const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this content log?')) return;

  const logToDelete = contentLogs.find(l => l.id === id);

  try {
    const { error } = await supabase.from('content_work_logs').delete().eq('id', id);
    if (error) throw error;

    await logActivity(ActivityActions.DELETE_CONTENT_WORK, {
      title: logToDelete?.title,
      content_type: logToDelete?.content_type
    });

    toast({ title: 'Success', description: 'Content log deleted' });
    fetchContentLogs();
  } catch (error: any) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' });
  }
};
useEffect(() => {
  fetchContentLogs();
  const interval = setInterval(fetchContentLogs, 5000);
  return () => clearInterval(interval);
}, []);

const contentTypes = [
  { value: 'poster', label: 'Poster', icon: Image },
  { value: 'image', label: 'Image/Graphic', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'social_post', label: 'Social Post', icon: Share2 },
  { value: 'blog', label: 'Blog/Article', icon: FileText },
  { value: 'other', label: 'Other', icon: FileText },
];

const ContentWorkDashboard: React.FC = () => {
  return <div>Content Work Dashboard</div>;
};

export default ContentWorkDashboard;


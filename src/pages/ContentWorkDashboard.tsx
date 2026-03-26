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


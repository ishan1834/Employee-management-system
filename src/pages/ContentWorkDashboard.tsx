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

const contentTypes = [
  { value: 'poster', label: 'Poster', icon: Image },
  { value: 'image', label: 'Image/Graphic', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'social_post', label: 'Social Post', icon: Share2 },
  { value: 'blog', label: 'Blog/Article', icon: FileText },
  { value: 'other', label: 'Other', icon: FileText },
];

const platforms = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' },
];

const ContentWorkDashboard: React.FC = () => {
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

  // Stats
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

      // Calculate stats
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
        // Auto-mark attendance as present when work log is created
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

  const getContentTypeIcon = (type: string) => {
    const contentType = contentTypes.find(c => c.value === type);
    if (contentType) {
      const Icon = contentType.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getContentTypeLabel = (type: string) => {
    return contentTypes.find(c => c.value === type)?.label || type;
  };

  const getPlatformLabel = (platform: string) => {
    return platforms.find(p => p.value === platform)?.label || platform;
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
          <h1 className="text-2xl font-bold text-white">Content Work Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gradient">{stats.totalContent}</p>
              <p className="text-sm text-muted-foreground">Total Content</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-pink-400">{stats.posters}</p>
              <p className="text-sm text-muted-foreground">Posters</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.images}</p>
              <p className="text-sm text-muted-foreground">Images</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.videos}</p>
              <p className="text-sm text-muted-foreground">Videos</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.socialPosts}</p>
              <p className="text-sm text-muted-foreground">Social Posts</p>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.blogs}</p>
              <p className="text-sm text-muted-foreground">Blogs</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Content Button */}
        {!showForm && (
          <Button className="mb-6 gradient-primary" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Content Log
          </Button>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-6 gradient-card border-white/10">
            <CardHeader>
              <CardTitle>{editingLog ? 'Edit Content Log' : 'Add New Content Log'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Content Type</Label>
                    <Select value={formData.content_type} onValueChange={(v) => setFormData({ ...formData, content_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        {contentTypes.map(type => (
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
                      placeholder="e.g., Instagram promotional poster"
                      required
                    />
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <div className="md:col-span-2">
                    <Label>File URL (optional)</Label>
                    <Input
                      value={formData.file_url}
                      onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                      placeholder="https://drive.google.com/... or direct link"
                    />
                  </div>
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the content created..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="gradient-primary" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingLog ? 'Update' : 'Add'} Content Log
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingLog(null); setFormData({ content_type: '', title: '', description: '', platform: '', file_url: '', status: 'completed' }); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Content Logs Table */}
        <Card className="gradient-card border-white/10">
          <CardHeader>
            <CardTitle>Content Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {contentLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No content logs yet. Add your first one!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getContentTypeIcon(log.content_type)}
                          <span>{getContentTypeLabel(log.content_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.title}</p>
                          {log.file_url && (
                            <a href={log.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                              View file
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{log.platform ? getPlatformLabel(log.platform) : '-'}</TableCell>
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

export default ContentWorkDashboard;

import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, TrendingUp, Users, MessageSquare, 
  Heart, Share2, Eye, Send, BarChart3, Calendar, Trash2, Edit, X, ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';
import { useAutoAttendance } from '@/hooks/useAutoAttendance';

interface SocialMediaAnalytic {
  id: string;
  date: string;
  platform: string;
  posts_count: number;
  followers_gained: number;
  followers_lost: number;
  total_followers: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  requests_received: number;
  responses_sent: number;
  engagement_rate: number;
  reach: number;
  impressions: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const platforms = [
  'Instagram',
  'Facebook',
  'Twitter/X',
  'LinkedIn',
  'YouTube',
  'TikTok',
  'Pinterest',
  'Snapchat',
  'Threads'
];

const SocialMediaAnalytics: React.FC = () => {
  const { adminProfile } = useAuth();
  const { logActivity } = useActivityLogger();
  const { markAttendanceAsPresent } = useAutoAttendance();
  const [analytics, setAnalytics] = useState<SocialMediaAnalytic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<SocialMediaAnalytic | null>(null);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalFollowersGained: 0,
    totalEngagement: 0,
    avgEngagementRate: 0
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    platform: 'Instagram',
    posts_count: 0,
    followers_gained: 0,
    followers_lost: 0,
    total_followers: 0,
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    requests_received: 0,
    responses_sent: 0,
    engagement_rate: 0,
    reach: 0,
    impressions: 0,
    notes: ''
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_analytics')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as SocialMediaAnalytic[];
      setAnalytics(typedData);

      // Calculate stats
      const totalPosts = typedData.reduce((sum, item) => sum + item.posts_count, 0);
      const totalFollowersGained = typedData.reduce((sum, item) => sum + item.followers_gained, 0);
      const totalEngagement = typedData.reduce((sum, item) => 
        sum + item.likes_count + item.comments_count + item.shares_count, 0);
      const avgEngagementRate = typedData.length > 0 
        ? typedData.reduce((sum, item) => sum + Number(item.engagement_rate), 0) / typedData.length 
        : 0;

      setStats({
        totalPosts,
        totalFollowersGained,
        totalEngagement,
        avgEngagementRate: Math.round(avgEngagementRate * 100) / 100
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminProfile) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add analytics',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('social_media_analytics')
          .update({
            ...formData,
            engagement_rate: formData.engagement_rate
          } as any)
          .eq('id', editingId);

        if (error) throw error;
        
        await logActivity(ActivityActions.UPDATE_SOCIAL_ANALYTICS, { 
          platform: formData.platform, 
          date: formData.date 
        });

        toast({
          title: 'Analytics Updated',
          description: 'Social media analytics have been updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('social_media_analytics')
          .insert({
            ...formData,
            created_by: adminProfile.id
          } as any);

        if (error) throw error;
        
        await logActivity(ActivityActions.CREATE_SOCIAL_ANALYTICS, { 
          platform: formData.platform, 
          date: formData.date 
        });

        // Auto-mark attendance as present when analytics are logged
        await markAttendanceAsPresent();

        toast({
          title: 'Analytics Added',
          description: 'Social media analytics have been added successfully'
        });
      }

      setIsDialogOpen(false);
      setEditingId(null);
      resetForm();
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error saving analytics:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save analytics',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (item: SocialMediaAnalytic) => {
    setEditingId(item.id);
    setFormData({
      date: item.date,
      platform: item.platform,
      posts_count: item.posts_count,
      followers_gained: item.followers_gained,
      followers_lost: item.followers_lost,
      total_followers: item.total_followers,
      likes_count: item.likes_count,
      comments_count: item.comments_count,
      shares_count: item.shares_count,
      requests_received: item.requests_received,
      responses_sent: item.responses_sent,
      engagement_rate: Number(item.engagement_rate),
      reach: item.reach,
      impressions: item.impressions,
      notes: item.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    const recordToDelete = analytics.find(a => a.id === id);
    
    try {
      const { error } = await supabase
        .from('social_media_analytics')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await logActivity(ActivityActions.DELETE_SOCIAL_ANALYTICS, { 
        platform: recordToDelete?.platform,
        date: recordToDelete?.date 
      });

      toast({
        title: 'Record Deleted',
        description: 'Analytics record has been deleted'
      });

      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete record',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      platform: 'Instagram',
      posts_count: 0,
      followers_gained: 0,
      followers_lost: 0,
      total_followers: 0,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      requests_received: 0,
      responses_sent: 0,
      engagement_rate: 0,
      reach: 0,
      impressions: 0,
      notes: ''
    });
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      'Instagram': 'bg-blue-500/20 text-blue-300 border-blue-400/40',
      'Facebook': 'bg-blue-600/20 text-blue-300 border-blue-400/40',
      'Twitter/X': 'bg-gray-500/20 text-gray-300 border-gray-400/40',
      'LinkedIn': 'bg-blue-700/20 text-blue-300 border-blue-400/40',
      'YouTube': 'bg-gray-600/20 text-gray-300 border-gray-400/40',
      'TikTok': 'bg-gray-500/20 text-gray-300 border-gray-400/40',
      'Pinterest': 'bg-gray-500/20 text-gray-300 border-gray-400/40',
      'Snapchat': 'bg-gray-500/20 text-gray-300 border-gray-400/40',
      'Threads': 'bg-gray-500/20 text-gray-300 border-gray-400/40'
    };
    return colors[platform] || 'bg-gray-500/20 text-gray-300 border-gray-400/40';
  };

  // View single analytics detail
  if (viewingItem) {
    return (
      <ModuleLayout
        title="Analytics Details"
        description={`${viewingItem.platform} - ${new Date(viewingItem.date).toLocaleDateString()}`}
      >
        <div className="space-y-6">
          <Button
            variant="outline"
            onClick={() => setViewingItem(null)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Posts */}
            <Card className="bg-black border border-gray-600 hover:border-blue-500/50 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{viewingItem.posts_count}</p>
                    <p className="text-sm text-gray-400">Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Followers */}
            <Card className="bg-black border border-gray-600 hover:border-green-500/50 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-400">+{viewingItem.followers_gained}</p>
                    <p className="text-sm text-gray-400">Followers Gained</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement */}
            <Card className="bg-black border border-gray-600 hover:border-gray-400/50 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-500/10 rounded-xl border border-gray-500/30">
                    <Heart className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {viewingItem.likes_count + viewingItem.comments_count + viewingItem.shares_count}
                    </p>
                    <p className="text-sm text-gray-400">Total Engagement</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reach */}
            <Card className="bg-black border border-gray-600 hover:border-blue-400/50 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-400/10 rounded-xl border border-blue-400/30">
                    <Eye className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{viewingItem.reach.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Reach</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-black border border-gray-600">
              <CardHeader className="border-b border-gray-700">
                <CardTitle className="text-white text-lg">Engagement Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <span className="text-gray-300 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-gray-400" /> Likes
                  </span>
                  <span className="text-white font-semibold">{viewingItem.likes_count}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <span className="text-gray-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" /> Comments
                  </span>
                  <span className="text-white font-semibold">{viewingItem.comments_count}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <span className="text-gray-300 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-gray-400" /> Shares
                  </span>
                  <span className="text-white font-semibold">{viewingItem.shares_count}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <span className="text-gray-300 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-300" /> Engagement Rate
                  </span>
                  <span className="text-blue-400 font-semibold">{viewingItem.engagement_rate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black border border-gray-600">
              <CardHeader className="border-b border-gray-700">
                <CardTitle className="text-white text-lg">Audience Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <span className="text-gray-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" /> Total Followers
                  </span>
                  <span className="text-white font-semibold">{viewingItem.total_followers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <span className="text-gray-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" /> Followers Gained
                  </span>
                  <span className="text-green-400 font-semibold">+{viewingItem.followers_gained}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <span className="text-gray-300">Followers Lost</span>
                  <span className="text-red-400 font-semibold">-{viewingItem.followers_lost}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <span className="text-gray-300 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-300" /> Impressions
                  </span>
                  <span className="text-white font-semibold">{viewingItem.impressions.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requests & Notes */}
          <Card className="bg-black border border-gray-600">
            <CardHeader className="border-b border-gray-700">
              <CardTitle className="text-white text-lg">Activity & Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-gray-400 text-sm">Requests Received</p>
                  <p className="text-2xl font-bold text-white">{viewingItem.requests_received}</p>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-gray-400 text-sm">Responses Sent</p>
                  <p className="text-2xl font-bold text-white">{viewingItem.responses_sent}</p>
                </div>
              </div>
              {viewingItem.notes && (
                <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">Notes</p>
                  <p className="text-gray-300">{viewingItem.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout
      title="Social Media Analytics"
      description="Track posts, followers, engagement, and performance across all platforms"
    >
      <div className="space-y-6">
        {/* Stats Cards - Black, White, Silver, Blue Theme */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-black border border-gray-600 hover:border-blue-500/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{stats.totalPosts}</p>
                  <p className="text-sm text-gray-400">Total Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black border border-gray-600 hover:border-green-500/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-400">+{stats.totalFollowersGained}</p>
                  <p className="text-sm text-gray-400">Followers Gained</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black border border-gray-600 hover:border-gray-400/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-500/10 rounded-xl border border-gray-500/30">
                  <Heart className="w-6 h-6 text-gray-300" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{stats.totalEngagement.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">Total Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black border border-gray-600 hover:border-blue-400/50 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-400/10 rounded-xl border border-blue-400/30">
                  <Eye className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{stats.avgEngagementRate}%</p>
                  <p className="text-sm text-gray-400">Avg Engagement Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Analytics Header with Add Button */}
        <Card className="bg-black border border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700">
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-blue-400" />
              Daily Analytics
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingId(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Analytics
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-2 border-gray-500">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingId ? 'Edit Analytics' : 'Add Daily Analytics'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Date</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Platform</Label>
                      <Select
                        value={formData.platform}
                        onValueChange={(value) => setFormData({ ...formData, platform: value })}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600">
                          {platforms.map((platform) => (
                            <SelectItem key={platform} value={platform} className="text-white hover:bg-gray-800">
                              {platform}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Posts Count</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.posts_count}
                        onChange={(e) => setFormData({ ...formData, posts_count: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Followers Gained</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.followers_gained}
                        onChange={(e) => setFormData({ ...formData, followers_gained: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Followers Lost</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.followers_lost}
                        onChange={(e) => setFormData({ ...formData, followers_lost: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Total Followers</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.total_followers}
                        onChange={(e) => setFormData({ ...formData, total_followers: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Likes</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.likes_count}
                        onChange={(e) => setFormData({ ...formData, likes_count: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Comments</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.comments_count}
                        onChange={(e) => setFormData({ ...formData, comments_count: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Shares</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.shares_count}
                        onChange={(e) => setFormData({ ...formData, shares_count: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Requests Received</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.requests_received}
                        onChange={(e) => setFormData({ ...formData, requests_received: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Responses Sent</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.responses_sent}
                        onChange={(e) => setFormData({ ...formData, responses_sent: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Engagement Rate (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.engagement_rate}
                        onChange={(e) => setFormData({ ...formData, engagement_rate: parseFloat(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Reach</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.reach}
                        onChange={(e) => setFormData({ ...formData, reach: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Impressions</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.impressions}
                        onChange={(e) => setFormData({ ...formData, impressions: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Notes</Label>
                    <Textarea
                      placeholder="Any additional notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                      {editingId ? 'Update' : 'Add'} Analytics
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-40 bg-gray-800 rounded-lg animate-pulse border border-gray-700" />
                ))}
              </div>
            ) : analytics.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">No Analytics Yet</h3>
                <p className="text-gray-400">Start tracking your social media performance</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.map((item) => (
                  <Card key={item.id} className="bg-gray-900 border border-gray-600 hover:border-blue-500/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Badge className={getPlatformColor(item.platform)}>
                            {item.platform}
                          </Badge>
                          <p className="text-gray-400 text-sm mt-1">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingItem(item)}
                            className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-500/20"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 p-0 text-gray-400 hover:bg-gray-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 bg-gray-800 rounded border border-gray-700">
                          <p className="text-gray-400">Posts</p>
                          <p className="text-white font-semibold">{item.posts_count}</p>
                        </div>
                        <div className="p-2 bg-gray-800 rounded border border-gray-700">
                          <p className="text-gray-400">Followers</p>
                          <p className="text-green-400 font-semibold">+{item.followers_gained}</p>
                        </div>
                        <div className="p-2 bg-gray-800 rounded border border-gray-700">
                          <p className="text-gray-400">Engagement</p>
                          <div className="flex items-center gap-1 text-white">
                            <Heart className="w-3 h-3 text-gray-400" />
                            <span>{item.likes_count}</span>
                            <MessageSquare className="w-3 h-3 text-blue-400 ml-1" />
                            <span>{item.comments_count}</span>
                          </div>
                        </div>
                        <div className="p-2 bg-gray-800 rounded border border-gray-700">
                          <p className="text-gray-400">Reach</p>
                          <p className="text-blue-300 font-semibold">{item.reach.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
};

export default SocialMediaAnalytics;

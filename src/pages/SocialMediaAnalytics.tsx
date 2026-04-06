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
import { Plus, TrendingUp, Users, MessageSquare, Heart, Share2, Eye, BarChart3, Calendar, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';
import { useAutoAttendance } from '@/hooks/useAutoAttendance';
interface SocialMediaAnalytic {
 const SocialMediaAnalytics: React.FC = () => {
  const { adminProfile } = useAuth();
  const { logActivity } = useActivityLogger();
  const { markAttendanceAsPresent } = useAutoAttendance();

  const [analytics, setAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
const [stats, setStats] = useState({
  totalPosts: 0,
  totalFollowersGained: 0,
  totalEngagement: 0,
  avgEngagementRate: 0
});
 useEffect(() => {
  fetchAnalytics();
}, []);

const fetchAnalytics = async () => {
  const { data } = await supabase
    .from('social_media_analytics')
    .select('*');

  setAnalytics(data || []);
};
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!adminProfile) return;

  await supabase.from('social_media_analytics').insert(formData);
  await logActivity(ActivityActions.CREATE_SOCIAL_ANALYTICS, formData);

  fetchAnalytics();
};

const [formData, setFormData] = useState({
  date: '',
  platform: 'Instagram',
  posts_count: 0,
  followers_gained: 0
});

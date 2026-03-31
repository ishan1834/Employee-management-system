import React, { useEffect, useState, useCallback } from 'react';
import { 
  AlertCircle, AlertTriangle, Bell, Info, Send, User, 
  Users, BellRing, CheckCheck, X, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

// Integrations & Hooks
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface Notification {
  id: string;
  title: string;
  message: string;
  sender_id: string | null;
  recipient_type: string;
  recipients: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read_by: string[];
  created_at: string;
}

const NotificationBell: React.FC = () => {
  const { adminProfile } = useAuth();
  const { isSupported, permission, requestPermission, showNotification } = usePushNotifications();
  const { playSound } = useNotificationSound();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipientType: 'all',
    priority: 'normal' as const,
  });

  const fetchNotifications = useCallback(async () => {
    if (!adminProfile) return;
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const myNotifications = (data || []).filter((n: any) =>
        n.recipient_type === 'all' || (n.recipients && n.recipients.includes(adminProfile.id))
      );
      
      const unread = myNotifications.filter((n: any) => 
        !n.is_read_by || !n.is_read_by.includes(adminProfile.id)
      ).length;
      
      setUnreadCount(unread);
      setNotifications(myNotifications as Notification[]);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }, [adminProfile]);

  useEffect(() => {
    if (!adminProfile) return;
    fetchNotifications();

    const channel = supabase
      .channel('notifications-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, (payload) => {
        const newN = payload.new as any;
        const isForMe = newN.recipient_type === 'all' || newN.recipients?.includes(adminProfile.id);
        
        if (isForMe && newN.sender_id !== adminProfile.id) {
          playSound();
          fetchNotifications();
          showNotification({
            title: newN.priority === 'urgent' ? `🚨 ${newN.title}` : newN.title,
            body: newN.message,
            icon: '/notification-icon.png'
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [adminProfile, fetchNotifications, playSound, showNotification]);

  const markAllAsRead = async () => {
    if (!adminProfile || unreadCount === 0) return;
    setMarkingRead(true);
    try {
      const unreadIds = notifications
        .filter(n => !n.is_read_by?.includes(adminProfile.id))
        .map(n => n.id);

      // Optimistic update for UI feel
      setUnreadCount(0);
      
      // Batch update logic
      for (const id of unreadIds) {
        const notification = notifications.find(n => n.id === id);
        const newReadBy = [...(notification?.is_read_by || []), adminProfile.id];
        await supabase
          .from('admin_notifications')
          .update({ is_read_by: newReadBy })
          .eq('id', id);
      }
      
      toast({ title: 'Inbox Cleared', description: 'All notifications marked as read.' });
      fetchNotifications();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to sync read status.', variant: 'destructive' });
    } finally {
      setMarkingRead(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title || !formData.message) return;
    setSending(true);
    try {
      const { error } = await supabase.from('admin_notifications').insert({
        ...formData,
        sender_id: adminProfile?.id,
        recipients: formData.recipientType === 'selected' ? selectedAdmins : [],
      });
      if (error) throw error;
      setShowSendDialog(false);
      setFormData({ title: '', message: '', recipientType: 'all', priority: 'normal' });
      toast({ title: 'Notification Dispatched' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent': return { icon: <AlertCircle className="w-4 h-4 text-red-500" />, border: 'border-l-red-600 bg-red-500/5' };
      case 'high': return { icon: <AlertTriangle className="w-4 h-4 text-orange-500" />, border: 'border-l-orange-500 bg-orange-500/5' };
      default: return { icon: <Info className="w-4 h-4 text-blue-500" />, border: 'border-l-zinc-700 bg-zinc-800/10' };
    }
  };

  return (
    <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-white/5 shadow-inner">
      {/* Super Admin Send Action */}
      {adminProfile?.role === 'super_admin' && (
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors">
              <Send className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Broadcast Notification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest">Subject</Label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="bg-zinc-900 border-zinc-800 focus:ring-blue-500" 
                  placeholder="System Maintenance..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest">Priority & Group</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={formData.priority} onValueChange={(v: any) => setFormData({...formData, priority: v})}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formData.recipientType} onValueChange={v => setFormData({...formData, recipientType: v})}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="all">All Staff</SelectItem>
                      <SelectItem value="selected">Select Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase tracking-widest">Content</Label>
                <Textarea 
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="bg-zinc-900 border-zinc-800 min-h-[100px]" 
                  placeholder="Detailed message here..."
                />
              </div>
              <Button onClick={handleSend} disabled={sending} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-11">
                {sending ? <Loader2 className="animate-spin mr-2" /> : 'Dispatch Notification'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Main Bell UI */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
            <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-[bell-shake_0.5s_infinite]' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 text-[10px] font-bold text-white items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 sm:w-96 p-0 bg-zinc-950/95 backdrop-blur-xl border-zinc-800 shadow-2xl rounded-xl mr-4 overflow-hidden" align="end">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-100">Updates</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">System & Admin Logs</p>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={markingRead}
                className="h-7 text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 uppercase tracking-widest"
              >
                {markingRead ? 'Syncing...' : 'Mark All Read'}
              </Button>
            )}
          </div>

          <ScrollArea className="h-[400px]">
            <AnimatePresence>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                  <Bell className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-xs font-medium uppercase tracking-widest opacity-50">Clear Skies</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((n) => {
                    const isRead = n.is_read_by?.includes(adminProfile?.id || '');
                    const { icon, border } = getPriorityStyles(n.priority);
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 border-l-4 transition-all hover:bg-white/5 cursor-default group ${border} ${isRead ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-1 shrink-0">{icon}</div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-bold text-zinc-100 leading-none">{n.title}</h4>
                              <span className="text-[9px] text-zinc-500 font-mono whitespace-nowrap flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {format(new Date(n.created_at), 'HH:mm')}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-normal line-clamp-3 group-hover:line-clamp-none transition-all">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NotificationBell;

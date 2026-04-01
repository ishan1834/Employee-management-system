
import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, User, Shield, Award, Briefcase, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const NotificationCenter: React.FC = () => {
  const { adminProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0
  });

  useEffect(() => {
    fetchNotifications();
    
    // Real-time subscriptions for all tables
    const paymentChannel = supabase
      .channel('payment-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payment_verifications' },
        handlePaymentChange
      )
      .subscribe();

    const certificateChannel = supabase
      .channel('certificate-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'certificates' },
        handleCertificateChange
      )
      .subscribe();

    const internshipChannel = supabase
      .channel('internship-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'internships' },
        handleInternshipChange
      )
      .subscribe();

    const attendanceChannel = supabase
      .channel('attendance-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' },
        handleAttendanceChange
      )
      .subscribe();

    const chatChannel = supabase
      .channel('chat-notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_messages' },
        handleChatChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(paymentChannel);
      supabase.removeChannel(certificateChannel);
      supabase.removeChannel(internshipChannel);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(chatChannel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const notifications: Notification[] = [];

      // Fetch payment notifications
      const { data: payments } = await supabase
        .from('payment_verifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      payments?.forEach((payment: any) => {
        notifications.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          title: payment.payment_received ? 'Payment Verified' : 'New Payment Record',
          message: `${payment.user_name} - ₹${payment.amount || 0} (${payment.transaction_id})`,
          timestamp: payment.verified_at || payment.created_at,
          read: false
        });
      });

      // Fetch certificate notifications
      const { data: certificates } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      certificates?.forEach((cert: any) => {
        notifications.push({
          id: `cert-${cert.id}`,
          type: 'certificate',
          title: 'Certificate Issued',
          message: `${cert.participant_name || cert.recipient_name} - ${cert.course_name || cert.certificate_type} (${cert.certificate_id || cert.id})`,
          timestamp: cert.created_at,
          read: false
        });
      });

      // Fetch internship notifications
      const { data: internships } = await supabase
        .from('internships')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      internships?.forEach((intern: any) => {
        notifications.push({
          id: `intern-${intern.id}`,
          type: 'internship',
          title: 'Internship Record',
          message: `${intern.intern_name} - ${intern.department || 'General'} (${intern.status})`,
          timestamp: intern.created_at,
          read: false
        });
      });

      // Fetch attendance notifications (today only)
      // Use explicit YYYY-MM-DD format for PostgreSQL
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*, admin:admins(name)')
        .eq('date', today)
        .order('created_at', { ascending: false });

      attendance?.forEach((att: any) => {
        notifications.push({
          id: `attendance-${att.id}`,
          type: 'attendance',
          title: 'Attendance Marked',
          message: `${att.admin?.name || 'Admin'} marked ${att.status}`,
          timestamp: att.marked_at || att.created_at,
          read: false
        });
      });

      // Fetch chat notifications
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      messages?.forEach((msg: any) => {
        const content = msg.message || msg.content || '';
        notifications.push({
          id: `chat-${msg.id}`,
          type: 'chat',
          title: 'New Chat Message',
          message: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          timestamp: msg.created_at,
          read: false
        });
      });

      // Sort by timestamp
      notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Calculate stats
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayNotifications = notifications.filter(n => new Date(n.timestamp) >= todayStart);

      setNotifications(notifications.slice(0, 20)); // Show latest 20
      setStats({
        total: notifications.length,
        unread: notifications.length, // All are unread for now
        today: todayNotifications.length
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handlePaymentChange = (payload: any) => {
    console.log('Payment change:', payload);
    fetchNotifications();
  };

  const handleCertificateChange = (payload: any) => {
    console.log('Certificate change:', payload);
    fetchNotifications();
  };

  const handleInternshipChange = (payload: any) => {
    console.log('Internship change:', payload);
    fetchNotifications();
  };

  const handleAttendanceChange = (payload: any) => {
    console.log('Attendance change:', payload);
    fetchNotifications();
  };

  const handleChatChange = (payload: any) => {
    console.log('Chat change:', payload);
    fetchNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <Shield className="w-4 h-4 text-green-400" />;
      case 'certificate':
        return <Award className="w-4 h-4 text-yellow-400" />;
      case 'internship':
        return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'attendance':
        return <User className="w-4 h-4 text-purple-400" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'certificate':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'internship':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'attendance':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'chat':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <ModuleLayout
      title="Notification Center"
      description="Real-time alerts for all admin activities"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gradient">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Notifications</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats.unread}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{stats.today}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card className="gradient-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-2">Admin activities will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start space-x-3 p-4 bg-black/20 rounded-lg border border-white/10"
                  >
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">
                          {notification.title}
                        </p>
                        <Badge className={getNotificationColor(notification.type)}>
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
};

export default NotificationCenter;

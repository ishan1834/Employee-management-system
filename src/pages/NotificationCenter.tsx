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
}, []);

const fetchNotifications = async () => {
  try {
    const notifications: Notification[] = [];

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
        message: `${payment.user_name} - ₹${payment.amount || 0}`,
        timestamp: payment.created_at,
        read: false
      });
    });

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
        message: `${cert.recipient_name}`,
        timestamp: cert.created_at,
        read: false
      });
    });

    notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'payment':
      return <Shield className="w-4 h-4 text-green-400" />;
    case 'certificate':
      return <Award className="w-4 h-4 text-yellow-400" />;
    case 'chat':
      return <MessageSquare className="w-4 h-4 text-cyan-400" />;
    default:
      return <Bell className="w-4 h-4 text-gray-400" />;
  }
};

return (
  <ModuleLayout
    title="Notification Center"
    description="Real-time alerts for all admin activities"
  >
    <div className="space-y-6">

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent>{stats.total}</CardContent></Card>
        <Card><CardContent>{stats.unread}</CardContent></Card>
        <Card><CardContent>{stats.today}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.map(n => (
            <div key={n.id} className="flex gap-3 p-3 border rounded">
              {getNotificationIcon(n.type)}
              <div>
                <p>{n.title}</p>
                <p className="text-sm text-gray-400">{n.message}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  </ModuleLayout>
);
    setNotifications(notifications);

  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};
  useEffect(() => {
  fetchNotifications();

  const paymentChannel = supabase
    .channel('payment-notifications')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'payment_verifications' },
      () => fetchNotifications()
    )
    .subscribe();

  const chatChannel = supabase
    .channel('chat-notifications')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages' },
      () => fetchNotifications()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(paymentChannel);
    supabase.removeChannel(chatChannel);
  };
}, []);
  
  return (
    <ModuleLayout
      title="Notification Center"
      description="Real-time alerts for all admin activities"
    >
      <div>Loading...</div>
    </ModuleLayout>
  );
};

export default NotificationCenter;

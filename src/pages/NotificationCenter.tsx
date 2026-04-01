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

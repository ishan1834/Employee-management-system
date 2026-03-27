import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Check, X, Clock, Download, TrendingUp, Users, UserCheck, UserX, AlertCircle, Edit, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDateForDB, getMonthStartForDB, getMonthEndForDB } from '@/lib/utils';

const CHART_COLORS = ['#3b82f6', '#6b7280', '#1f2937'];

interface AttendanceRecord {
  id: string;
  admin_id: string;
  date: string;
  status: string;
}
const AttendanceTracker: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [reason, setReason] = useState('');

  const today = new Date();
  const todayStr = formatDateForDB(today);

  const getCurrentTimeBasedStatus = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'present';
    if (hour >= 11 && hour < 17) return 'late';
    return 'absent';
  };

  const getTimeBasedMessage = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "Attendance opens at 6 AM";
    if (hour < 11) return "Full attendance window";
    if (hour < 17) return "Late window";
    return "Absent window";
  };
    useEffect(() => {
    if (adminProfile) {
      fetchAdmins();
      fetchAttendanceData();
    }
  }, [selectedDate, adminProfile]);

  const fetchAdmins = async () => {
    const { data } = await supabase.from('admins').select('*');
    console.log(data);
  };

  const fetchAttendanceData = async () => {
    const { data } = await supabase.from('attendance').select('*');
    console.log(data);
  };  useEffect(() => {
    if (adminProfile) {
      fetchAdmins();
      fetchAttendanceData();
    }
  }, [selectedDate, adminProfile]);

  const fetchAdmins = async () => {
    const { data } = await supabase.from('admins').select('*');
    console.log(data);
  };

  const fetchAttendanceData = async () => {
    const { data } = await supabase.from('attendance').select('*');
    console.log(data);
  };
  const markAttendance = async () => {
    if (!adminProfile) return;

    const status = getCurrentTimeBasedStatus();

    await supabase.from('attendance').insert({
      admin_id: adminProfile.id,
      date: todayStr,
      status,
      reason
    });

    toast({
      title: "Attendance Marked",
      description: status,
    });
  };

  const getMonthlyStats = (data: any[]) => {
    const present = data.filter(d => d.status === 'present').length;
    const late = data.filter(d => d.status === 'late').length;
    const absent = data.filter(d => d.status === 'absent').length;

    return { present, late, absent };
  };

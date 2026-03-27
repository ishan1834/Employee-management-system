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
  check_in_time: string | null;
  marked_at: string | null;
  reason: string | null;
  override_status: string | null;
  override_reason: string | null;
  overridden_by: string | null;
  overridden_at: string | null;
  admin?: { name: string; email: string; role: string };
}

const AttendanceTracker: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [reason, setReason] = useState('');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [allAdmins, setAllAdmins] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [myAttendance, setMyAttendance] = useState<any>(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAdminForExport, setSelectedAdminForExport] = useState<string>('');
  
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [selectedRecordForOverride, setSelectedRecordForOverride] = useState<AttendanceRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>('present');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [showWorkLogWarning, setShowWorkLogWarning] = useState(false);
  const [hasWorkLogToday, setHasWorkLogToday] = useState<boolean | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [workLogOpen, setWorkLogOpen] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  const today = new Date();
  // Use utility function for consistent YYYY-MM-DD format
  const todayStr = formatDateForDB(today);
  const isToday = formatDateForDB(selectedDate) === todayStr;
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const getCurrentTimeBasedStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    
    if (hours >= 6 && hours < 11) {
      return 'present';
    } else if (hours >= 11 && hours < 17) {
      return 'late';
    } else {
      return 'absent';
    }
  };

  const getTimeBasedMessage = () => {
    const now = new Date();
    const hours = now.getHours();
    
    if (hours >= 6 && hours < 11) {
      return { status: 'Present', message: 'Mark now for full attendance (6 AM - 11 AM)', color: 'text-blue-500' };
    } else if (hours >= 11 && hours < 17) {
      return { status: 'Late', message: 'Late window (11 AM - 5 PM) - counts as half day', color: 'text-gray-400' };
    } else if (hours >= 17) {
      return { status: 'Absent', message: 'After 5 PM - marked as absent', color: 'text-gray-500' };
    } else {
      return { status: 'Early', message: 'Attendance opens at 6 AM', color: 'text-gray-500' };
    }
  };

  const checkWorkLogToday = async () => {
    if (!adminProfile) return;
    const role = adminProfile.role as string;
    // esports_admin and super_admin exempt from work log requirement
    if (role === 'esports_admin' || role === 'super_admin') {
      setHasWorkLogToday(true);
      return;
    }

    const todayStart = formatDateForDB(new Date()) + 'T00:00:00';
    const todayEnd = formatDateForDB(new Date()) + 'T23:59:59';
    let hasLog = false;

    try {
      if (role === 'tech_admin') {
        const { data } = await supabase
          .from('tech_work_logs')
          .select('id')
          .eq('admin_id', adminProfile.id)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .limit(1);
        hasLog = (data || []).length > 0;
      } else if (role === 'content_admin' || role === 'social_admin') {
        const { data } = await supabase
          .from('content_work_logs')
          .select('id')
          .eq('admin_id', adminProfile.id)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .limit(1);
        hasLog = (data || []).length > 0;
      } else if (role === 'hr_admin') {
        // HR admins need work logs too - check both content and tech logs
        const { data: contentData } = await supabase
          .from('content_work_logs')
          .select('id')
          .eq('admin_id', adminProfile.id)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .limit(1);
        const { data: techData } = await supabase
          .from('tech_work_logs')
          .select('id')
          .eq('admin_id', adminProfile.id)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .limit(1);
        hasLog = ((contentData || []).length > 0) || ((techData || []).length > 0);
      } else {
        hasLog = true;
      }
    } catch (err) {
      console.error('Error checking work log:', err);
      hasLog = true; // Don't block on error
    }

    console.log('Work log check result:', { role, hasLog });
    setHasWorkLogToday(hasLog);
  };

  useEffect(() => {
    if (adminProfile) {
      fetchAdmins();
      fetchAttendanceData();
      fetchTodayAttendance();
      fetchMyAttendance();
      fetchMonthlyAttendance();
      checkWorkLogToday();
    }
  }, [selectedDate, selectedMonth, adminProfile]);

  const fetchAdmins = async () => {
    try {
      const { data: admins, error } = await supabase
        .from('admins')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setAllAdmins(admins || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchAttendanceData = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const dateStr = formatDateForDB(selectedDate);
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`
          *,
          admin:admins!admin_id(name, email, role)
        `)
        .eq('date', dateStr)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAttendanceData(attendance || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const fetchTodayAttendance = async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`
          *,
          admin:admins!admin_id(name, email, role)
        `)
        .eq('date', todayStr);
      
      if (error) throw error;
      setTodayAttendance(attendance || []);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchMyAttendance = async () => {
    if (!adminProfile) return;
    
    try {
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('admin_id', adminProfile.id)
        .eq('date', todayStr)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setMyAttendance(attendance);
    } catch (error) {
      console.error('Error fetching my attendance:', error);
    }
  };

  const fetchMonthlyAttendance = async () => {
    if (!adminProfile) return;
    
    try {
      const monthStart = getMonthStartForDB(selectedMonth);
      const monthEnd = getMonthEndForDB(selectedMonth);
      
      let query = supabase
        .from('attendance')
        .select('*')
        .gte('date', monthStart)
        .lte('date', monthEnd);
      
      if (!isSuperAdmin) {
        query = query.eq('admin_id', adminProfile.id);
      }
      
      const { data: attendance, error } = await query;
      
      if (error) throw error;
      setMonthlyAttendance(attendance || []);
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
    }
  };

  const markAttendance = async () => {
    if (!adminProfile || !isToday) {
      toast({
        title: "Error",
        description: "You can only mark attendance for today",
        variant: "destructive",
      });
      return;
    }

    const currentHour = new Date().getHours();
    if (currentHour < 6) {
      toast({
        title: "Too Early",
        description: "Attendance marking opens at 6 AM",
        variant: "destructive",
      });
      return;
    }

    const status = getCurrentTimeBasedStatus();

    // Check if work log is missing (non-esports)
    const role = adminProfile.role as string;
    if (hasWorkLogToday === false && role !== 'esports_admin') {
      setShowWorkLogWarning(true);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('admin_id', adminProfile.id)
        .eq('date', todayStr)
        .single();

      if (existing) {
        toast({
          title: "Already Marked",
          description: "Your attendance for today has already been recorded",
          variant: "default",
        });
        return;
      }

      const { error } = await supabase
        .from('attendance')
        .insert({
          admin_id: adminProfile.id,
          date: todayStr,
          status: status,
          reason: reason || null,
          marked_by: adminProfile.id,
          marked_at: new Date().toISOString(),
          check_in_time: new Date().toISOString()
        } as any);

      if (error) throw error;

      await logActivity('Marked attendance', { 
        status: status, 
        date: todayStr,
        time: format(new Date(), 'HH:mm:ss'),
        reason: reason || undefined 
      });

      toast({
        title: "Attendance Marked",
        description: `Your attendance has been marked as "${status.charAt(0).toUpperCase() + status.slice(1)}"`,
      });

      setReason('');
      fetchMyAttendance();
      fetchMonthlyAttendance();
      if (isSuperAdmin) {
        fetchAttendanceData();
        fetchTodayAttendance();
      }
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const overrideAttendanceStatus = async () => {
    if (!adminProfile || !isSuperAdmin || !selectedRecordForOverride) return;

    if (!overrideReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the override",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          status: overrideStatus,
          override_status: overrideStatus,
          override_reason: overrideReason,
          overridden_by: adminProfile.id,
          overridden_at: new Date().toISOString(),
        } as any)
        .eq('id', selectedRecordForOverride.id);

      if (error) throw error;

      await logActivity('Overrode attendance status', {
        admin: selectedRecordForOverride.admin?.name,
        date: selectedRecordForOverride.date,
        old_status: selectedRecordForOverride.status,
        new_status: overrideStatus,
        reason: overrideReason,
      });

      toast({
        title: "Attendance Updated",
        description: `Status changed to ${overrideStatus} for ${selectedRecordForOverride.admin?.name}`,
      });

      setShowOverrideDialog(false);
      setSelectedRecordForOverride(null);
      setOverrideStatus('present');
      setOverrideReason('');
      fetchAttendanceData();
      fetchTodayAttendance();
      fetchMonthlyAttendance();
    } catch (error: any) {
      console.error('Error overriding attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [holidays, setHolidays] = useState<string[]>([]);

  // Fetch holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      const { data } = await supabase.from('holidays').select('date');
      setHolidays((data || []).map((h: any) => h.date));
    };
    fetchHolidays();
  }, []);

  // Calculate actual working days in the selected month (excluding weekends AND holidays)
  const getWorkingDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    
    // If current month, count up to today; otherwise count all days in month
    const lastDay = isCurrentMonth ? now.getDate() : new Date(year, month + 1, 0).getDate();
    
    let workingDays = 0;
    for (let day = 1; day <= lastDay; day++) {
      const d = new Date(year, month, day);
      const dayOfWeek = d.getDay();
      const dateStr = formatDateForDB(d);
      // Exclude weekends (0 = Sunday, 6 = Saturday) AND holidays
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
        workingDays++;
      }
    }
    return workingDays;
  };

  const getMonthlyStats = (adminId?: string) => {
    const relevantAttendance = adminId 
      ? monthlyAttendance.filter(a => a.admin_id === adminId)
      : monthlyAttendance;
    
    const present = relevantAttendance.filter(a => a.status === 'present').length;
    const late = relevantAttendance.filter(a => a.status === 'late').length;
    const absent = relevantAttendance.filter(a => a.status === 'absent').length;
    
    // Use actual working days in the month instead of just recorded days
    const workingDays = getWorkingDaysInMonth(selectedMonth);
    const score = present + (late * 0.5);
    
    // Cap the score to not exceed working days and percentage to 100%
    const cappedScore = Math.min(score, workingDays);
    const percentage = workingDays > 0 ? Math.min(100, Math.round((cappedScore / workingDays) * 100)) : 0;
    
    return { present, late, absent, totalDays: workingDays, score: cappedScore, percentage };
  };

  const myStats = getMonthlyStats(adminProfile?.id);

  const getAttendanceStats = () => {
    const total = allAdmins.length;
    const present = todayAttendance.filter(a => a.status === 'present').length;
    const absent = todayAttendance.filter(a => a.status === 'absent').length;
    const late = todayAttendance.filter(a => a.status === 'late').length;
    const notMarked = total - todayAttendance.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, late, notMarked, percentage };
  };

  const stats = getAttendanceStats();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-blue-500 text-white border-blue-500';
      case 'absent':
        return 'bg-gray-700 text-white border-gray-700';
      case 'late':
        return 'bg-gray-500 text-white border-gray-500';
      default:
        return 'bg-gray-600 text-white border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <Check className="h-4 w-4" />;
      case 'absent':
        return <X className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const exportAttendanceCSV = async (adminId?: string) => {
    try {
      const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      
      let query = supabase
        .from('attendance')
        .select(`
          *,
          admin:admins!admin_id(name, email, role)
        `)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: true });
      
      if (adminId) {
        query = query.eq('admin_id', adminId);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      const headers = ['Date', 'Admin Name', 'Email', 'Role', 'Status', 'Check-in Time', 'Reason'];
      const rows = (data || []).map(record => [
        record.date,
        record.admin?.name || 'Unknown',
        record.admin?.email || '',
        record.admin?.role?.replace('_', ' ') || '',
        record.status,
        record.marked_at ? format(new Date(record.marked_at), 'HH:mm:ss') : '',
        record.reason || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const adminName = adminId ? allAdmins.find(a => a.id === adminId)?.name || 'admin' : 'all-admins';
      link.download = `attendance-${adminName}-${format(selectedMonth, 'yyyy-MM')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Attendance data exported successfully",
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance data",
        variant: "destructive",
      });
    }
  };

  const monthlyChartData = [
    { name: 'Present', value: myStats.present, color: CHART_COLORS[0] },
    { name: 'Late', value: myStats.late, color: CHART_COLORS[1] },
    { name: 'Absent', value: myStats.absent, color: CHART_COLORS[2] },
  ];

  const timeInfo = getTimeBasedMessage();

  return (
    <ModuleLayout
      title="Attendance Tracker"
      description="Mark daily attendance with time-based status and view your attendance reports"
    >
      {/* Work Log Warning Dialog */}
      <Dialog open={showWorkLogWarning} onOpenChange={setShowWorkLogWarning}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Work Log Not Updated!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-gray-300">You have not submitted your work log for today.</p>
            <p className="text-red-400 font-medium">⚠️ You will be automatically marked ABSENT at 11:59 PM if your work log is not updated.</p>
            <p className="text-gray-400 text-sm">Please go to your work dashboard and submit your work log. Once submitted, your attendance will be automatically marked as present.</p>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setShowWorkLogWarning(false)} className="border-gray-600 text-gray-300">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Work Log Warning Banner */}
        {hasWorkLogToday === false && !myAttendance && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium">⚠️ Work Log Not Updated — Auto Absent at 11:59 PM</p>
              <p className="text-gray-400 text-sm">Your work log for today has not been submitted. You will be automatically marked ABSENT at 11:59 PM. Submit your work log in your dashboard to keep your attendance as present.</p>
            </div>
          </div>
        )}

        {/* Mark Attendance Card - Collapsible */}
        <Collapsible open={attendanceOpen} onOpenChange={setAttendanceOpen}>
          <Card className="bg-gray-900/50 border-gray-800">
            <CollapsibleTrigger asChild>
              <CardHeader className="p-4 sm:p-6 cursor-pointer hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="truncate">Mark Attendance - {format(today, "PP")}</span>
                    {myAttendance && (
                      <Badge className={`ml-2 ${getStatusBadgeClass(myAttendance.status)}`}>
                        {myAttendance.status.charAt(0).toUpperCase() + myAttendance.status.slice(1)}
                      </Badge>
                    )}
                  </CardTitle>
                  {attendanceOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </div>
                <CardDescription className={timeInfo.color}>
                  {timeInfo.message}
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {myAttendance ? (
                  <div className="text-center py-6">
                    <Badge className={`text-lg px-4 py-2 flex items-center gap-2 w-fit mx-auto ${getStatusBadgeClass(myAttendance.status)}`}>
                      {getStatusIcon(myAttendance.status)}
                      {myAttendance.status.charAt(0).toUpperCase() + myAttendance.status.slice(1)}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-3">
                      Marked at {format(new Date(myAttendance.marked_at), 'hh:mm a')}
                    </p>
                    {myAttendance.reason && (
                      <p className="text-sm text-gray-500 mt-1">
                        Reason: {myAttendance.reason}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-center py-4">
                      <p className="text-lg font-medium text-white">
                        Current Status: <span className={timeInfo.color}>{timeInfo.status}</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Based on current time ({format(new Date(), 'hh:mm a')})
                      </p>
                    </div>

                    {(getCurrentTimeBasedStatus() === 'late' || getCurrentTimeBasedStatus() === 'absent') && (
                      <div>
                        <label className="text-sm font-medium text-gray-300">Reason (Optional)</label>
                        <Textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Please provide a reason for late/absent..."
                          rows={3}
                          className="mt-1 bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    )}

                    <Button 
                      onClick={markAttendance} 
                      disabled={isLoading || new Date().getHours() < 6}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isLoading ? 'Marking...' : `Mark Attendance (${timeInfo.status})`}
                    </Button>
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Monthly Analytics Card - Collapsible */}
        <Collapsible open={workLogOpen} onOpenChange={setWorkLogOpen}>
          <Card className="bg-gray-900/50 border-gray-800">
            <CollapsibleTrigger asChild>
              <CardHeader className="p-4 sm:p-6 cursor-pointer hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      Monthly Analytics
                      <Badge variant="outline" className="ml-2 border-gray-700 text-gray-400">{myStats.percentage}%</Badge>
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-xs sm:text-sm">
                      {format(selectedMonth, "MMMM yyyy")}
                    </CardDescription>
                  </div>
                  {workLogOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs sm:text-sm w-fit">
                        <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Change Month
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedMonth}
                        onSelect={(date) => date && setSelectedMonth(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-2xl font-bold text-blue-500">{myStats.present}</p>
                    <p className="text-xs text-gray-500">Present</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-700/30 border border-gray-600/30">
                    <p className="text-2xl font-bold text-gray-400">{myStats.late}</p>
                    <p className="text-xs text-gray-500">Late (½ day)</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-800/50 border border-gray-700/30">
                    <p className="text-2xl font-bold text-gray-500">{myStats.absent}</p>
                    <p className="text-xs text-gray-500">Absent</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                    <p className="text-2xl font-bold text-white">{myStats.percentage}%</p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Attendance Score</span>
                    <span className="font-medium">{myStats.score.toFixed(1)} / {myStats.totalDays} working days</span>
                  </div>
                  <Progress value={myStats.percentage} className="h-2 bg-gray-800" />
                  <p className="text-xs text-gray-500 text-center">
                    {myStats.present} Present + {myStats.late} Late out of {myStats.totalDays} working days (excluding weekends)
                  </p>
                </div>
                <div className="h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={monthlyChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                      >
                        {monthlyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                    <p className="text-sm text-gray-500">Total Admins</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <UserCheck className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold text-blue-500">{stats.present}</p>
                    <p className="text-sm text-gray-500">Present Today</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-2xl font-bold text-gray-400">{stats.late}</p>
                    <p className="text-sm text-gray-500">Late Today</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <UserX className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-500">{stats.absent}</p>
                    <p className="text-sm text-gray-500">Absent Today</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto text-gray-500 mb-2" />
                    <p className="text-2xl font-bold text-gray-400">{stats.notMarked}</p>
                    <p className="text-sm text-gray-500">Not Marked</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Date Picker and Export */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
                  <CardTitle className="text-white text-sm sm:text-base">Attendance Records</CardTitle>
                  <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {format(selectedDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Select value={selectedAdminForExport} onValueChange={setSelectedAdminForExport}>
                      <SelectTrigger className="w-[180px] bg-gray-900 border-gray-800 text-white">
                        <SelectValue placeholder="Export for..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800">
                        <SelectItem value="all">All Admins</SelectItem>
                        {allAdmins.map(admin => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => exportAttendanceCSV(selectedAdminForExport === 'all' ? undefined : selectedAdminForExport)}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {attendanceData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attendance records for {format(selectedDate, "PPP")}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-400">Admin</TableHead>
                        <TableHead className="text-gray-400">Role</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Check-in Time</TableHead>
                        <TableHead className="text-gray-400">Reason</TableHead>
                        <TableHead className="text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceData.map((record) => (
                        <TableRow key={record.id} className="border-gray-800">
                          <TableCell className="text-white font-medium">{record.admin?.name || 'Unknown'}</TableCell>
                          <TableCell className="text-gray-400">{record.admin?.role?.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Badge className={`flex items-center gap-1 w-fit ${getStatusBadgeClass(record.status)}`}>
                              {getStatusIcon(record.status)}
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                            {record.override_status && (
                              <p className="text-xs text-gray-500 mt-1">
                                Overridden: {record.override_reason}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {record.marked_at ? format(new Date(record.marked_at), 'hh:mm a') : '-'}
                          </TableCell>
                          <TableCell className="text-gray-400">{record.reason || '-'}</TableCell>
                          <TableCell>
                            <Dialog open={showOverrideDialog && selectedRecordForOverride?.id === record.id} onOpenChange={(open) => {
                              setShowOverrideDialog(open);
                              if (!open) {
                                setSelectedRecordForOverride(null);
                                setOverrideStatus('present');
                                setOverrideReason('');
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRecordForOverride(record);
                                    setOverrideStatus(record.status);
                                  }}
                                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Override
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-gray-800">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Override Attendance Status</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  <div className="p-4 rounded-lg bg-gray-800/50">
                                    <p className="font-medium text-white">{record.admin?.name}</p>
                                    <p className="text-sm text-gray-400">Current: {record.status}</p>
                                    <p className="text-sm text-gray-400">Date: {record.date}</p>
                                  </div>
                                  <div>
                                    <Label className="text-gray-300">New Status</Label>
                                    <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                                      <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-gray-900 border-gray-800">
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="late">Late</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-gray-300">Reason for Override *</Label>
                                    <Textarea
                                      value={overrideReason}
                                      onChange={(e) => setOverrideReason(e.target.value)}
                                      placeholder="Please provide a reason..."
                                      rows={2}
                                      className="mt-1 bg-gray-800 border-gray-700 text-white"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => setShowOverrideDialog(false)}
                                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={overrideAttendanceStatus}
                                      disabled={isLoading}
                                      className="bg-blue-500 hover:bg-blue-600 text-white"
                                    >
                                      {isLoading ? 'Updating...' : 'Update Status'}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Admins Today Status */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-white">Today's Status - All Admins</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search admins..."
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      className="pl-9 bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {allAdmins
                    .filter((admin) => {
                      if (!adminSearchQuery) return true;
                      const q = adminSearchQuery.toLowerCase();
                      return admin.name?.toLowerCase().includes(q) || admin.role?.toLowerCase().includes(q) || admin.email?.toLowerCase().includes(q);
                    })
                    .map((admin) => {
                    const attendance = todayAttendance.find(a => a.admin_id === admin.id);
                    const status = attendance?.status || 'not_marked';
                    
                    return (
                      <div 
                        key={admin.id} 
                        className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{admin.name}</p>
                            <p className="text-xs text-gray-500">{admin.role?.replace('_', ' ')}</p>
                          </div>
                          <Badge className={`${getStatusBadgeClass(status)} flex items-center gap-1`}>
                            {getStatusIcon(status)}
                            {status === 'not_marked' ? 'Not Marked' : status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </div>
                        {attendance?.marked_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Checked in at {format(new Date(attendance.marked_at), 'hh:mm a')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ModuleLayout>
  );
};

export default AttendanceTracker;

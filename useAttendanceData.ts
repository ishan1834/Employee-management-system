import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from './types';
interface UseAttendanceDataProps {
  adminProfile: any;
  isSuperAdmin: boolean;
  selectedDate: Date;
  selectedMonth: Date;
}
const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
const [allAdmins, setAllAdmins] = useState<any[]>([]);
const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
const [myAttendance, setMyAttendance] = useState<any>(null);
const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);

const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const fetchAdmins = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    setAllAdmins(data || []);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
const fetchAttendanceData = async () => {
  if (!isSuperAdmin) return;

  setLoading(true);
  try {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('attendance')
      .select(`*, admin:admins!admin_id(name,email,role)`)
      .eq('date', dateStr)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAttendanceData(data || []);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
const fetchTodayAttendance = async () => {
  if (!isSuperAdmin) return;

  try {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('attendance')
      .select(`*, admin:admins!admin_id(name,email,role)`)
      .eq('date', todayStr);

    if (error) throw error;
    setTodayAttendance(data || []);
  } catch (err: any) {
    setError(err.message);
  }
};

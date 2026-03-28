// useAttendanceData.ts
// Custom React hook — handles all Supabase data fetching for AttendanceTracker

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

export const useAttendanceData = ({
  adminProfile,
  isSuperAdmin,
  selectedDate,
  selectedMonth,
}: UseAttendanceDataProps) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [allAdmins, setAllAdmins] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [myAttendance, setMyAttendance] = useState<any>(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);

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
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`*, admin:admins!admin_id(name, email, role)`)
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
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`*, admin:admins!admin_id(name, email, role)`)
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
      const todayStr = format(new Date(), 'yyyy-MM-dd');
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
      const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

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

  const refetchAll = () => {
    fetchAdmins();
    fetchAttendanceData();
    fetchTodayAttendance();
    fetchMyAttendance();
    fetchMonthlyAttendance();
  };

  useEffect(() => {
    if (adminProfile) {
      refetchAll();
    }
  }, [selectedDate, selectedMonth, adminProfile]);

  return {
    attendanceData,
    allAdmins,
    todayAttendance,
    myAttendance,
    monthlyAttendance,
    fetchAttendanceData,
    fetchTodayAttendance,
    fetchMyAttendance,
    fetchMonthlyAttendance,
  };
};

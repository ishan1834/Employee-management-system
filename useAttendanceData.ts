import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from './types';

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
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

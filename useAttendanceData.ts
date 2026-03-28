import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from './types';

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

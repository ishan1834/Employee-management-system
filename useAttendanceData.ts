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

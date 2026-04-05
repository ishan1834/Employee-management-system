// ============================================================
// useAttendanceData.ts — Version 1 (Enhanced)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from './types';

/* ============================================================ */
/* TYPES                                                        */
/* ============================================================ */

interface AdminProfile {
  id: string;
  name?: string;
  email?: string;
}

interface UseAttendanceDataProps {
  adminProfile: AdminProfile | null;
  isSuperAdmin: boolean;
  selectedDate: Date;
  selectedMonth: Date;
}

/* ============================================================ */
/* HOOK                                                         */
/* ============================================================ */

export const useAttendanceData = ({
  adminProfile,
  isSuperAdmin,
  selectedDate,
  selectedMonth,
}: UseAttendanceDataProps) => {

  /* ================= STATE ================= */

  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [allAdmins, setAllAdmins] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord | null>(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ============================================================ */
  /* GENERIC FETCH HANDLER (NEW FEATURE)                          */
  /* ============================================================ */

  const safeFetch = async (fn: Function) => {
    try {
      setLoading(true);
      setError(null);
      await fn();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================ */
  /* FETCH FUNCTIONS                                              */
  /* ============================================================ */

  const fetchAdmins = useCallback(async () => {
    await safeFetch(async () => {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      setAllAdmins(data || []);
    });
  }, []);

  const fetchAttendanceData = useCallback(async () => {
    if (!isSuperAdmin) return;

    await safeFetch(async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('attendance')
        .select(`*, admin:admins!admin_id(name, email, role)`)
        .eq('date', dateStr)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAttendanceData(data || []);
    });
  }, [selectedDate, isSuperAdmin]);

  const fetchTodayAttendance = useCallback(async () => {
    if (!isSuperAdmin) return;

    await safeFetch(async () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('attendance')
        .select(`*, admin:admins!admin_id(name, email, role)`)
        .eq('date', todayStr);

      if (error) throw error;

      setTodayAttendance(data || []);
    });
  }, [isSuperAdmin]);

  const fetchMyAttendance = useCallback(async () => {
    if (!adminProfile) return;

    await safeFetch(async () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('admin_id', adminProfile.id)
        .eq('date', todayStr)
        .maybeSingle();

      if (error) throw error;

      setMyAttendance(data);
    });
  }, [adminProfile]);

  const fetchMonthlyAttendance = useCallback(async () => {
    if (!adminProfile) return;

    await safeFetch(async () => {
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

      const { data, error } = await query;

      if (error) throw error;

      setMonthlyAttendance(data || []);
    });
  }, [selectedMonth, adminProfile, isSuperAdmin]);

  /* ============================================================ */
  /* REFETCH ALL (IMPROVED)                                       */
  /* ============================================================ */

  const refetchAll = useCallback(() => {
    fetchAdmins();
    fetchAttendanceData();
    fetchTodayAttendance();
    fetchMyAttendance();
    fetchMonthlyAttendance();
  }, [
    fetchAdmins,
    fetchAttendanceData,
    fetchTodayAttendance,
    fetchMyAttendance,
    fetchMonthlyAttendance,
  ]);

  /* ============================================================ */
  /* EFFECT                                                       */
  /* ============================================================ */

  useEffect(() => {
    if (adminProfile) {
      refetchAll();
    }
  }, [selectedDate, selectedMonth, adminProfile, refetchAll]);

  /* ============================================================ */
  /* RETURN                                                       */
  /* ============================================================ */

  return {
    attendanceData,
    allAdmins,
    todayAttendance,
    myAttendance,
    monthlyAttendance,

    loading,
    error,

    refetchAll,

    fetchAttendanceData,
    fetchTodayAttendance,
    fetchMyAttendance,
    fetchMonthlyAttendance,
  };
};

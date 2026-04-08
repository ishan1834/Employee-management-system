

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from './types';


/* ============================================================ */
/* TYPES                                                        */
/* ============================================================ */

interface AdminProfile {
  id: string;
  role?: string;
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
  const [monthlyAttendance, setMonthlyAttendance] = useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= CACHE KEY ================= */

  const cacheKey = `attendance-${format(selectedDate, 'yyyy-MM-dd')}`;
  const monthlyKey = `attendance-month-${format(selectedMonth, 'yyyy-MM')}`;

  /* ============================================================ */
  /* LOAD FROM CACHE (NEW FEATURE)                                */
  /* ============================================================ */

  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(cacheKey);
      const cachedMonth = localStorage.getItem(monthlyKey);

      if (cached) setAttendanceData(JSON.parse(cached));
      if (cachedMonth) setMonthlyAttendance(JSON.parse(cachedMonth));
    } catch (err) {
      console.warn('Cache error', err);
    }
  };

  /* ============================================================ */
  /* SAVE TO CACHE                                                */
  /* ============================================================ */

  const saveToCache = (data: AttendanceRecord[], isMonthly = false) => {
    const key = isMonthly ? monthlyKey : cacheKey;
    localStorage.setItem(key, JSON.stringify(data));
  };

  /* ============================================================ */
  /* FETCH                                                        */
  /* ============================================================ */

  const fetchAttendanceData = useCallback(async () => {
    if (!adminProfile) return;

    setLoading(true);
    setError(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      let query = supabase
        .from('attendance')
        .select(`*, admin:admins!admin_id(name, role)`)
        .eq('date', dateStr);

      // Role-based control
      if (!isSuperAdmin) {
        query = query.eq('admin_id', adminProfile.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAttendanceData(data || []);
      saveToCache(data || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, adminProfile, isSuperAdmin]);

  const fetchMonthlyAttendance = useCallback(async () => {
    if (!adminProfile) return;

    try {
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;

      setMonthlyAttendance(data || []);
      saveToCache(data || [], true);

    } catch (err: any) {
      setError(err.message);
    }
  }, [selectedMonth, adminProfile]);

  /* ============================================================ */
  /* BACKGROUND SYNC (NEW FEATURE)                                */
  /* ============================================================ */

  const intervalRef = useRef<any>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchAttendanceData();
    }, 15000); // every 15 sec

    return () => clearInterval(intervalRef.current);
  }, [fetchAttendanceData]);

  /* ============================================================ */
  /* DERIVED ANALYTICS (NEW)                                      */
  /* ============================================================ */

  const stats = useMemo(() => {
    const present = attendanceData.filter(a => a.status === 'present').length;
    const late = attendanceData.filter(a => a.status === 'late').length;
    const absent = attendanceData.filter(a => a.status === 'absent').length;

    const total = present + late + absent;

    return {
      present,
      late,
      absent,
      total,
      percentage: total ? Math.round((present / total) * 100) : 0,
    };
  }, [attendanceData]);

  /* ============================================================ */
  /* INIT                                                         */
  /* ============================================================ */

  useEffect(() => {
    loadFromCache();
    fetchAttendanceData();
    fetchMonthlyAttendance();
  }, [selectedDate, selectedMonth]);

  /* ============================================================ */
  /* RETURN                                                       */
  /* ============================================================ */

  return {
    attendanceData,
    monthlyAttendance,

    loading,
    error,

    stats,

    refetch: fetchAttendanceData,
  };
};

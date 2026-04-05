// ============================================================
// useAttendanceData.ts — Version 3 (Enterprise Level)
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from './types';

/* ============================================================ */
/* TYPES                                                        */
/* ============================================================ */

interface AdminProfile {
  id: string;
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

  /* ================= PAGINATION ================= */

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  /* ================= FILTERS ================= */

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /* ================= ABORT CONTROLLER ================= */

  const abortRef = useRef<AbortController | null>(null);

  /* ============================================================ */
  /* RETRY SYSTEM (NEW)                                           */
  /* ============================================================ */

  const retryFetch = async (fn: Function, retries = 2) => {
    try {
      await fn();
    } catch (err) {
      if (retries > 0) {
        console.warn('Retrying...', retries);
        return retryFetch(fn, retries - 1);
      } else {
        throw err;
      }
    }
  };

  /* ============================================================ */
  /* FETCH FUNCTIONS                                              */
  /* ============================================================ */

  const fetchAttendanceData = useCallback(async () => {
    if (!isSuperAdmin) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      await retryFetch(async () => {
        const { data, error } = await supabase
          .from('attendance')
          .select(`*, admin:admins!admin_id(name)`)
          .eq('date', dateStr)
          .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

        if (error) throw error;

        setAttendanceData(data || []);
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, page, isSuperAdmin]);

  const fetchMonthlyAttendance = useCallback(async () => {
    if (!adminProfile) return;

    setLoading(true);

    try {
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      await retryFetch(async () => {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .gte('date', start)
          .lte('date', end);

        if (error) throw error;

        setMonthlyAttendance(data || []);
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, adminProfile]);

  /* ============================================================ */
  /* OPTIMISTIC UPDATE (NEW)                                      */
  /* ============================================================ */

  const markAttendanceOptimistic = async (newRecord: AttendanceRecord) => {
    // optimistic update
    setAttendanceData(prev => [newRecord, ...prev]);

    try {
      const { error } = await supabase
        .from('attendance')
        .insert([newRecord]);

      if (error) throw error;

    } catch (err) {
      console.error(err);

      // rollback if failed
      setAttendanceData(prev =>
        prev.filter(r => r.id !== newRecord.id)
      );
    }
  };

  /* ============================================================ */
  /* FILTERED DATA (NEW)                                          */
  /* ============================================================ */

  const filteredData = attendanceData.filter(record => {
    const matchStatus =
      statusFilter === 'all' || record.status === statusFilter;

    const matchSearch =
      record.admin?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchStatus && matchSearch;
  });

  /* ============================================================ */
  /* EFFECT                                                       */
  /* ============================================================ */

  useEffect(() => {
    fetchAttendanceData();
    fetchMonthlyAttendance();
  }, [selectedDate, selectedMonth, page]);

  /* ============================================================ */
  /* RETURN                                                       */
  /* ============================================================ */

  return {
    attendanceData: filteredData,
    monthlyAttendance,

    loading,
    error,

    // pagination
    page,
    setPage,

    // filters
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,

    // actions
    refetch: fetchAttendanceData,
    markAttendanceOptimistic,
  };
};

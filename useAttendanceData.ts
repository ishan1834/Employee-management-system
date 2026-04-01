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

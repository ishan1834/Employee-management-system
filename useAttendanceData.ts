import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from './types';

export const useAttendanceData = ({
  adminProfile,
  isSuperAdmin,
  selectedDate,
  selectedMonth,
}: UseAttendanceDataProps) => {

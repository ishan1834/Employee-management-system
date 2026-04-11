import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateForDB } from '@/lib/utils';
export const useAutoAttendance = () => {
  const { adminProfile } = useAuth();
  const getTimeBasedStatus = (): string => {
    const now = new Date();
    const hours = now.getHours();
    if (hours >= 6 && hours < 11) return 'present';
    if (hours >= 11 && hours < 17) return 'late';
    return 'absent';
  };

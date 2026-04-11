import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateForDB } from '@/lib/utils';
export const useAutoAttendance = () => {
  const { adminProfile } = useAuth();

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

  const markAttendanceAsPresent = useCallback(async () => {
    if (!adminProfile?.id) return false;

    try {
      const today = formatDateForDB(new Date());
      const status = getTimeBasedStatus();
      
      // If after 5 PM, work log submission should NOT mark as present
      if (status === 'absent') {
        console.log('Auto-attendance: After 5 PM, not marking as present');
        return false;
      }
      
      // Check if attendance already exists for today
      const { data: existingAttendance, error: fetchError } = await supabase
        .from('attendance')
        .select('id, status')
        .eq('admin_id', adminProfile.id)
        .eq('date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking attendance:', fetchError);
        return false;
      }

      // If no attendance record exists, create one with time-based status
      if (!existingAttendance) {
        const { error: insertError } = await supabase
          .from('attendance')
          .insert({
            admin_id: adminProfile.id,
            date: today,
            status: status,
            check_in_time: new Date().toISOString(),
            marked_by: adminProfile.id,
            marked_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error marking attendance:', insertError);
          return false;
        }
        
        console.log(`Attendance auto-marked as ${status} due to work log (time-based)`);
        return true;
      }
      if (existingAttendance.status === 'absent' && status !== 'absent') {
        const { error: updateError } = await supabase
          .from('attendance')
          .update({
            status: status,
            check_in_time: new Date().toISOString()
          })
          .eq('id', existingAttendance.id);
        if (updateError) {
          console.error('Error updating attendance:', updateError);
          return false;
        }
        console.log(`Attendance updated from absent to ${status} due to work log`);
        return true;
      }
      return false; 
    } catch (error) {
      console.error('Error in auto-attendance:', error);
      return false;
    }
  }, [adminProfile?.id]);

  return { markAttendanceAsPresent };
};

export default useAutoAttendance;

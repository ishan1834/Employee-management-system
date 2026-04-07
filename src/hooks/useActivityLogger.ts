import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';




interface ActivityDetails {
  [key: string]: any;
}




export const useActivityLogger = () => {
  const { adminProfile } = useAuth();



  
  const logActivity = useCallback(async (action: string, details?: ActivityDetails, showToast: boolean = true) => {
    if (!adminProfile?.id) {
      console.log('No admin profile, skipping activity log');
      return;
    }



    
    try {
      const { error } = await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: adminProfile.id,
          action,
          details: details || {}
        } as any);



      
      if (error) {
        console.error('Error logging activity:', error);
      } else {
        console.log('Activity logged:', action);
        // Show toast notification for the activity
        if (showToast) {
          toast({
            title: "Activity Logged",
            description: action,
            duration: 2000,
          });
        }
      }
    } catch (error) {
      console.error('Error in logActivity:', error);
    }
  }, [adminProfile?.id]);

  return { logActivity };
};




// Standalone function for use outside of React components
export const logAdminActivity = async (adminId: string, action: string, details?: ActivityDetails) => {
  if (!adminId) return;


  

  try {
    const { error } = await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: adminId,
        action,
        details: details || {}
      } as any);



    
    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('Error in logAdminActivity:', error);
  }
};




// Action types for consistent logging
export const ActivityActions = {
  // Login/Auth
  LOGIN: 'Logged in',
  LOGOUT: 'Logged out',



  
  // Attendance
  MARK_ATTENDANCE: 'Marked attendance',
  UPDATE_ATTENDANCE: 'Updated attendance',
  
  // Employees


  
  VIEW_EMPLOYEE: 'Viewed employee details',
  CREATE_EMPLOYEE: 'Created employee',
  UPDATE_EMPLOYEE: 'Updated employee',
  DELETE_EMPLOYEE: 'Deleted employee',
  
  // Files


  
  UPLOAD_FILE: 'Uploaded file',
  DELETE_FILE: 'Deleted file',
  DOWNLOAD_FILE: 'Downloaded file',
  VIEW_FILE: 'Viewed file',
  
  // Notifications


  
  MARK_NOTIFICATION_READ: 'Marked notification as read',
  MARK_ALL_NOTIFICATIONS_READ: 'Marked all notifications as read',
  SEND_NOTIFICATION: 'Sent notification',



  
  // Certificates


  
  CREATE_CERTIFICATE: 'Created certificate',
  UPDATE_CERTIFICATE: 'Updated certificate',
  DELETE_CERTIFICATE: 'Deleted certificate',
  
  // Internships


  
  CREATE_INTERNSHIP: 'Created internship',
  UPDATE_INTERNSHIP: 'Updated internship',
  DELETE_INTERNSHIP: 'Deleted internship',
  
  // Esports


  
  CREATE_ESPORTS_PLAYER: 'Created esports player',
  UPDATE_ESPORTS_PLAYER: 'Updated esports player',
  DELETE_ESPORTS_PLAYER: 'Deleted esports player',
  
  // Social Media


  
  CREATE_SOCIAL_ORDER: 'Created social media order',
  UPDATE_SOCIAL_ORDER: 'Updated social media order',
  DELETE_SOCIAL_ORDER: 'Deleted social media order',
  CREATE_SOCIAL_ANALYTICS: 'Created social media analytics',
  UPDATE_SOCIAL_ANALYTICS: 'Updated social media analytics',
  DELETE_SOCIAL_ANALYTICS: 'Deleted social media analytics',
  
  // Tech Work


  
  CREATE_TECH_WORK: 'Created tech work log',
  UPDATE_TECH_WORK: 'Updated tech work log',
  DELETE_TECH_WORK: 'Deleted tech work log',
  
  // Content Work


  
  CREATE_CONTENT_WORK: 'Created content work log',
  UPDATE_CONTENT_WORK: 'Updated content work log',
  DELETE_CONTENT_WORK: 'Deleted content work log',
  
  // Payments


  
  CREATE_PAYMENT: 'Created payment verification',
  VERIFY_PAYMENT: 'Verified payment',
  DELETE_PAYMENT: 'Deleted payment',
  
  // Admin Management


  
  CREATE_ADMIN: 'Created admin',
  UPDATE_ADMIN: 'Updated admin',
  DELETE_ADMIN: 'Deleted admin',
  
  // Todos


  
  CREATE_TODO: 'Created todo',
  COMPLETE_TODO: 'Completed todo',
  DELETE_TODO: 'Deleted todo',
  
  // Export


  
  EXPORT_DATA: 'Exported data',
  EXPORT_ACTIVITY_SUMMARY: 'Exported activity summary'
};

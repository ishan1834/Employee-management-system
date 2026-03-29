// ============================================================
// types.ts
// Shared TypeScript interfaces, enums, constants, and helpers
// for AttendanceTracker System
// ============================================================

/* ========================================================= */
/* COLOR CONSTANTS                                           */
/* ========================================================= */

/**
 * Chart color palette used across analytics UI
 */
export const CHART_COLORS = ['#3b82f6', '#6b7280', '#1f2937'];

/**
 * Extended color palette (for future use)
 */
export const EXTENDED_COLORS = {
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  info: '#3b82f6',
  muted: '#6b7280',
};

/* ========================================================= */
/* ENUMS                                                     */
/* ========================================================= */

/**
 * Attendance status types (strict typing)
 */
export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  ABSENT = 'absent',
  NOT_MARKED = 'not_marked',
}

/**
 * Admin roles (can be extended later)
 */
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  SOCIAL_ADMIN = 'social_admin',
  ESPORTS_ADMIN = 'esports_admin',
  TECH_ADMIN = 'tech_admin',
  CONTENT_ADMIN = 'content_admin',
  HR_ADMIN = 'hr_admin',
}

/* ========================================================= */
/* BASE TYPES                                                */
/* ========================================================= */

/**
 * Basic Admin info
 */
export interface Admin {
  id?: string;
  name: string;
  email: string;
  role: AdminRole | string;
}

/**
 * Attendance override metadata
 */
export interface AttendanceOverride {
  override_status: string | null;
  override_reason: string | null;
  overridden_by: string | null;
  overridden_at: string | null;
}

/* ========================================================= */
/* MAIN ATTENDANCE RECORD                                   */
/* ========================================================= */

/**
 * Main attendance record structure
 */
export interface AttendanceRecord {
  id: string;
  admin_id: string;
  date: string;

  // Status fields
  status: AttendanceStatus | string;

  // Time tracking
  check_in_time: string | null;
  marked_at: string | null;

  // Reason for absence/late
  reason: string | null;

  // Override fields
  override_status: string | null;
  override_reason: string | null;
  overridden_by: string | null;
  overridden_at: string | null;

  // Optional nested admin
  admin?: Admin;
}

/* ========================================================= */
/* STATISTICS TYPES                                          */
/* ========================================================= */

/**
 * Daily attendance stats
 */
export interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  notMarked: number;
  percentage: number;
}

/**
 * Monthly stats
 */
export interface MonthlyStats {
  present: number;
  late: number;
  absent: number;
  totalDays: number;
  score: number;
  percentage: number;
}

/* ========================================================= */
/* FILTER TYPES                                              */
/* ========================================================= */

/**
 * Filters for attendance queries
 */
export interface AttendanceFilters {
  adminId?: string;
  date?: string;
  status?: AttendanceStatus;
}

/* ========================================================= */
/* HELPER FUNCTIONS (LIGHT ADDITION)                         */
/* ========================================================= */

/**
 * Check if attendance record is valid
 */
export const isValidAttendance = (record: AttendanceRecord): boolean => {
  return !!record && !!record.id && !!record.admin_id && !!record.date;
};

/**
 * Get readable label for status
 */
export const getStatusLabel = (status: string): string => {
  if (!status) return 'Unknown';
  if (status === 'not_marked') return 'Not Marked';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Get color based on status
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return EXTENDED_COLORS.success;
    case AttendanceStatus.LATE:
      return EXTENDED_COLORS.warning;
    case AttendanceStatus.ABSENT:
      return EXTENDED_COLORS.danger;
    default:
      return EXTENDED_COLORS.muted;
  }
};

/* ========================================================= */
/* DEFAULT VALUES                                            */
/* ========================================================= */

/**
 * Default empty attendance record (useful for initialization)
 */
export const DEFAULT_ATTENDANCE_RECORD: AttendanceRecord = {
  id: '',
  admin_id: '',
  date: '',
  status: AttendanceStatus.NOT_MARKED,
  check_in_time: null,
  marked_at: null,
  reason: null,
  override_status: null,
  override_reason: null,
  overridden_by: null,
  overridden_at: null,
  admin: undefined,
};

/* ========================================================= */
/* END OF FILE                                               */
/* ========================================================= */

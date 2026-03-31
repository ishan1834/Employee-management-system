import {
  format,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';

/* ============================================================ */
/* CORE STATUS TYPES                                            */
/* ============================================================ */

/**
 * Strict attendance status type
 */
export type AttendanceStatus = 'present' | 'late' | 'absent';

/**
 * Immutable status list (useful for validation/UI)
 */
export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  'present',
  'late',
  'absent',
];

/* ============================================================ */
/* ADMIN ENTITY                                                 */
/* ============================================================ */

export interface Admin {
  id: string;
  name: string;
  email: string;
  role?: string;
}

/* ============================================================ */
/* ATTENDANCE RECORD                                            */
/* ============================================================ */

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;

  admin_id?: string;
  marked_at?: string;

  reason?: string;

  admin?: Admin;
}

/* ============================================================ */
/* MONTHLY STATS                                                */
/* ============================================================ */

export interface MonthlyStats {
  present: number;
  late: number;
  absent: number;

  totalDays: number;

  score: number;
  percentage: number;
}

/* ============================================================ */
/* TYPE GUARDS (NEW — IMPROVEMENT)                              */
/* ============================================================ */

/**
 * Type-safe check for attendance status
 */
export const isAttendanceStatus = (value: any): value is AttendanceStatus => {
  return ATTENDANCE_STATUSES.includes(value);
};

/**
 * Safe record validation (stronger version)
 */
export const isValidAttendanceRecord = (record: any): record is AttendanceRecord => {
  return (
    record &&
    typeof record.date === 'string' &&
    isAttendanceStatus(record.status)
  );
};
// ============================================================
// PART 2 — TIME UTILITIES (Enhanced)
// ============================================================

/* ============================================================ */
/* CORE TIME HELPERS                                            */
/* ============================================================ */

/**
 * Convert hours + minutes → total minutes
 * (Base utility used across time logic)
 */
export const convertToMinutes = (hours: number, minutes: number): number => {
  return hours * 60 + minutes;
};

/**
 * Extract total minutes from Date
 */
export const getMinutesFromDate = (date: Date): number => {
  return convertToMinutes(date.getHours(), date.getMinutes());
};

/* ============================================================ */
/* TIME WINDOWS CONFIG (NEW — FLEXIBLE SYSTEM)                   */
/* ============================================================ */

/**
 * Centralized time ranges (easily configurable)
 */
export const ATTENDANCE_TIME_WINDOWS = {
  present: { start: 360, end: 660 },   // 6:00 → 10:59
  late: { start: 660, end: 1020 },     // 11:00 → 16:59
  absent: { start: 1020, end: 1440 },  // 17:00+
};

/* ============================================================ */
/* STATUS CALCULATION                                           */
/* ============================================================ */

/**
 * Returns attendance status based on time
 */
export const getCurrentTimeBasedStatus = (
  date: Date = new Date()
): AttendanceStatus => {

  const totalMinutes = getMinutesFromDate(date);

  if (
    totalMinutes >= ATTENDANCE_TIME_WINDOWS.present.start &&
    totalMinutes < ATTENDANCE_TIME_WINDOWS.present.end
  ) return 'present';

  if (
    totalMinutes >= ATTENDANCE_TIME_WINDOWS.late.start &&
    totalMinutes < ATTENDANCE_TIME_WINDOWS.late.end
  ) return 'late';

  return 'absent';
};

/* ============================================================ */
/* UI MESSAGE GENERATOR                                         */
/* ============================================================ */

/**
 * Returns user-friendly UI message
 */
export const getTimeBasedMessage = () => {
  const now = new Date();
  const minutes = getMinutesFromDate(now);

  // Present window
  if (
    minutes >= ATTENDANCE_TIME_WINDOWS.present.start &&
    minutes < ATTENDANCE_TIME_WINDOWS.present.end
  ) {
    return {
      status: 'Present',
      message: 'Mark your attendance now',
      color: 'text-blue-500',
    };
  }

  // Late window
  if (
    minutes >= ATTENDANCE_TIME_WINDOWS.late.start &&
    minutes < ATTENDANCE_TIME_WINDOWS.late.end
  ) {
    return {
      status: 'Late',
      message: 'Late entry window',
      color: 'text-yellow-500',
    };
  }

  // Absent window
  if (minutes >= ATTENDANCE_TIME_WINDOWS.absent.start) {
    return {
      status: 'Absent',
      message: 'Marked as absent',
      color: 'text-red-500',
    };
  }

  // Early case (before 6 AM)
  return {
    status: 'Early',
    message: 'Attendance opens at 6 AM',
    color: 'text-gray-400',
  };
};

/* ============================================================ */
/* EXTRA UTILITIES (NEW)                                        */
/* ============================================================ */

/**
 * Check if current time is within marking window
 */
export const isAttendanceOpen = (date: Date = new Date()): boolean => {
  const minutes = getMinutesFromDate(date);
  return minutes >= ATTENDANCE_TIME_WINDOWS.present.start;
};

/**
 * Get remaining time until attendance opens
 */
export const getMinutesUntilOpen = (): number => {
  const now = new Date();
  const minutes = getMinutesFromDate(now);

  if (minutes >= ATTENDANCE_TIME_WINDOWS.present.start) return 0;

  return ATTENDANCE_TIME_WINDOWS.present.start - minutes;
};

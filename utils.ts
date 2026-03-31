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

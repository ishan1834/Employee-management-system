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
// ============================================================
// PART 3 — STATUS + UI UTILITIES (Enhanced)
// ============================================================

/* ============================================================ */
/* STATUS STYLE CONFIG (NEW — CENTRALIZED DESIGN SYSTEM)         */
/* ============================================================ */

/**
 * Central mapping for all status UI styles
 */
export const STATUS_UI_CONFIG = {
  present: {
    label: 'Present',
    color: 'text-white',
    bg: 'bg-blue-500',
    border: 'border-blue-500',
    dot: 'bg-blue-400',
  },
  late: {
    label: 'Late',
    color: 'text-black',
    bg: 'bg-yellow-500',
    border: 'border-yellow-500',
    dot: 'bg-yellow-400',
  },
  absent: {
    label: 'Absent',
    color: 'text-white',
    bg: 'bg-red-500',
    border: 'border-red-500',
    dot: 'bg-red-400',
  },
};

/* ============================================================ */
/* BADGE CLASS GENERATOR                                        */
/* ============================================================ */

/**
 * Returns Tailwind class for badge
 */
export const getStatusBadgeClass = (status: AttendanceStatus): string => {
  const base = 'px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1';

  const config = STATUS_UI_CONFIG[status];

  if (!config) {
    return `${base} bg-gray-500 text-white border-gray-500`;
  }

  return `${base} ${config.bg} ${config.color} ${config.border}`;
};

/* ============================================================ */
/* LABEL + DISPLAY UTILITIES                                    */
/* ============================================================ */

/**
 * Get readable label (centralized)
 */
export const getStatusLabel = (status: AttendanceStatus): string => {
  return STATUS_UI_CONFIG[status]?.label || 'Unknown';
};

/**
 * Get color class only
 */
export const getStatusColor = (status: AttendanceStatus): string => {
  return STATUS_UI_CONFIG[status]?.bg || 'bg-gray-500';
};

/**
 * Get dot indicator class (for UI badges / lists)
 */
export const getStatusDot = (status: AttendanceStatus): string => {
  return STATUS_UI_CONFIG[status]?.dot || 'bg-gray-400';
};

/* ============================================================ */
/* ADVANCED UI HELPERS (NEW)                                    */
/* ============================================================ */

/**
 * Get full UI object (useful for components)
 */
export const getStatusUI = (status: AttendanceStatus) => {
  return STATUS_UI_CONFIG[status] || {
    label: 'Unknown',
    color: 'text-white',
    bg: 'bg-gray-500',
    border: 'border-gray-500',
    dot: 'bg-gray-400',
  };
};

/**
 * Check if status is critical (for alerts)
 */
export const isCriticalStatus = (status: AttendanceStatus): boolean => {
  return status === 'absent';
};

/**
 * Check if status is warning level
 */
export const isWarningStatus = (status: AttendanceStatus): boolean => {
  return status === 'late';
};

/**
 * Check if status is good
 */
export const isPositiveStatus = (status: AttendanceStatus): boolean => {
  return status === 'present';
};
// ============================================================
// PART 4 — DATE + VALIDATION UTILITIES (Enhanced)
// ============================================================

import {
  format,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  parseISO,
  isValid,
} from 'date-fns';

/* ============================================================ */
/* DATE HELPERS                                                 */
/* ============================================================ */

/**
 * Safely parse date string → Date object
 */
export const parseDateSafe = (date: string): Date | null => {
  try {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Format date safely
 */
export const formatDateSafe = (date: string, formatStr = 'dd MMM yyyy'): string => {
  const parsed = parseDateSafe(date);
  return parsed ? format(parsed, formatStr) : 'Invalid Date';
};

/* ============================================================ */
/* MONTH UTILITIES                                              */
/* ============================================================ */

/**
 * Get month start & end range
 */
export const getMonthRange = (date: Date) => ({
  start: startOfMonth(date),
  end: endOfMonth(date),
});

/**
 * Check if date belongs to current month
 */
export const isCurrentMonth = (date: Date): boolean => {
  return isSameMonth(date, new Date());
};

/**
 * Check if date is today
 */
export const isToday = (date: string): boolean => {
  const parsed = parseDateSafe(date);
  return parsed ? isSameDay(parsed, new Date()) : false;
};

/* ============================================================ */
/* DATE COMPARISON UTILITIES (NEW)                              */
/* ============================================================ */

/**
 * Check if two dates are same day
 */
export const isSameDaySafe = (date1: string, date2: string): boolean => {
  const d1 = parseDateSafe(date1);
  const d2 = parseDateSafe(date2);

  if (!d1 || !d2) return false;
  return isSameDay(d1, d2);
};

/**
 * Check if date is within a range
 */
export const isDateInRange = (date: string, start: Date, end: Date): boolean => {
  const parsed = parseDateSafe(date);
  if (!parsed) return false;

  return parsed >= start && parsed <= end;
};

/* ============================================================ */
/* VALIDATION UTILITIES                                         */
/* ============================================================ */

/**
 * Validate attendance record (strong version)
 */
export const isValidAttendanceRecord = (record: any): record is AttendanceRecord => {
  return (
    record &&
    typeof record.date === 'string' &&
    record.status &&
    ['present', 'late', 'absent'].includes(record.status)
  );
};

/**
 * Validate admin object
 */
export const isValidAdmin = (admin: any): admin is Admin => {
  return (
    admin &&
    typeof admin.id === 'string' &&
    typeof admin.name === 'string' &&
    typeof admin.email === 'string'
  );
};

/* ============================================================ */
/* SANITIZATION HELPERS (NEW)                                   */
/* ============================================================ */

/**
 * Clean string input
 */
export const sanitizeString = (value: any): string => {
  return String(value || '').trim();
};

/**
 * Normalize date format
 */
export const normalizeDate = (date: string): string => {
  const parsed = parseDateSafe(date);
  return parsed ? format(parsed, 'yyyy-MM-dd') : '';
};
// ============================================================
// PART 5 — STATS + CSV + PERFORMANCE UTILITIES (Enhanced)
// ============================================================

import { format, endOfMonth, isSameMonth } from 'date-fns';

/* ============================================================ */
/* STATISTICS UTILITIES                                         */
/* ============================================================ */

/**
 * Aggregate attendance counts (reusable)
 */
export const countAttendance = (records: AttendanceRecord[]) => {
  const counts = {
    present: 0,
    late: 0,
    absent: 0,
  };

  for (const record of records) {
    if (counts[record.status] !== undefined) {
      counts[record.status]++;
    }
  }

  return counts;
};

/**
 * Compute monthly stats
 */
export const computeMonthlyStats = (
  monthlyAttendance: AttendanceRecord[],
  selectedMonth: Date,
  adminId?: string
): MonthlyStats => {

  const filtered = adminId
    ? monthlyAttendance.filter(a => a.admin_id === adminId)
    : monthlyAttendance;

  const { present, late } = countAttendance(filtered);

  const today = new Date();

  const totalDays = isSameMonth(today, selectedMonth)
    ? today.getDate()
    : endOfMonth(selectedMonth).getDate();

  const absent = Math.max(totalDays - (present + late), 0);

  const score = present + late * 0.5;

  const percentage =
    totalDays > 0
      ? Math.round((score / totalDays) * 100)
      : 0;

  return { present, late, absent, totalDays, score, percentage };
};

/**
 * Compute today's attendance stats
 */
export const computeAttendanceStats = (
  allAdmins: Admin[],
  todayAttendance: AttendanceRecord[]
) => {

  const total = allAdmins.length;

  const counts = countAttendance(todayAttendance);

  const notMarked = Math.max(total - todayAttendance.length, 0);

  const percentage =
    total > 0
      ? Math.round((counts.present / total) * 100)
      : 0;

  return {
    total,
    ...counts,
    notMarked,
    percentage,
  };
};

/* ============================================================ */
/* CSV UTILITIES                                                */
/* ============================================================ */

/**
 * Escape CSV values safely
 */
export const escapeCSV = (value: any): string => {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
};

/**
 * Convert attendance data → CSV
 */
export const convertToCSV = (data: AttendanceRecord[]): string => {

  const headers = [
    'Date',
    'Name',
    'Email',
    'Role',
    'Status',
    'Time',
    'Reason',
  ];

  const rows = data.map(record => [
    record.date,
    record.admin?.name || 'Unknown',
    record.admin?.email || '',
    record.admin?.role || '',
    record.status,
    record.marked_at
      ? format(new Date(record.marked_at), 'HH:mm:ss')
      : '',
    record.reason || '',
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

/**
 * Build + download CSV (main function)
 */
export const buildAndDownloadCSV = (
  data: AttendanceRecord[],
  allAdmins: Admin[],
  adminId: string | undefined,
  selectedMonth: Date
) => {

  const csv = convertToCSV(data);

  const adminName = adminId
    ? allAdmins.find(a => a.id === adminId)?.name || 'admin'
    : 'all-admins';

  const filename = `attendance-${adminName}-${format(selectedMonth, 'yyyy-MM')}.csv`;

  downloadCSV(csv, filename);
};

/* ============================================================ */
/* LOGGING UTILITIES                                            */
/* ============================================================ */

/**
 * Structured logging (better debugging)
 */
export const logInfo = (message: string, data?: any) => {
  console.log(`[INFO]: ${message}`, data ?? '');
};

export const logError = (message: string, error?: any) => {
  console.error(`[ERROR]: ${message}`, error ?? '');
};

/* ============================================================ */
/* PERFORMANCE UTILITIES                                        */
/* ============================================================ */

/**
 * Debounce function (optimized)
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function (NEW — ADVANCED)
 */
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

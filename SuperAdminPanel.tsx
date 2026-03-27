/* ========================================================= */
/* EXTENDED SUPER ADMIN PANEL - THRYLOS ENTERPRISE EDITION  */
/* ========================================================= */

import React, { useMemo } from 'react';

/* ========================================================= */
/* UI COMPONENT IMPORTS                                      */
/* ========================================================= */

import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

import { Textarea } from '@/components/ui/textarea';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';

import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

/* ========================================================= */
/* ICONS                                                     */
/* ========================================================= */

import {
  CalendarIcon, Check, X, Clock, Download,
  Users, UserCheck, UserX, AlertCircle, Edit,
  ShieldAlert, Database, FileText, Settings2,
  Lock, Activity, Filter, ChevronRight
} from 'lucide-react';

/* ========================================================= */
/* UTILITIES & TYPES                                         */
/* ========================================================= */

import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { AttendanceRecord } from './types';
import { getStatusBadgeClass } from './utils';

/* ========================================================= */
/* NEW HELPER FUNCTIONS (EXPANSION)                          */
/* ========================================================= */

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'present': return <Check className="h-4 w-4" />;
    case 'absent': return <X className="h-4 w-4" />;
    case 'late': return <Clock className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const formatStatus = (status: string) => {
  if (!status) return 'Unknown';
  if (status === 'not_marked') return 'Not Marked';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getAttendanceByAdmin = (adminId: string, todayAttendance: any[]) => {
  return todayAttendance.find(a => a.admin_id === adminId);
};

const formatTime = (date?: string) => {
  if (!date) return '-';
  return format(new Date(date), 'hh:mm a');
};

const safeText = (value?: string) => value || 'N/A';

/**
 * NEW: Calculates the data integrity score for the current view
 */
const calculateDataHealth = (records: AttendanceRecord[]) => {
  if (records.length === 0) return 100;
  const missingData = records.filter(r => !r.marked_at).length;
  return Math.round(((records.length - missingData) / records.length) * 100);
};

/**
 * NEW: Returns color for the health indicator
 */
const getHealthColor = (score: number) => {
  if (score > 90) return 'text-emerald-500';
  if (score > 70) return 'text-amber-500';
  return 'text-rose-500';
};

/* ========================================================= */
/* INTERFACES                                                */
/* ========================================================= */

interface SuperAdminPanelProps {
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    notMarked: number;
    percentage: number;
  };
  attendanceData: AttendanceRecord[];
  allAdmins: any[];
  todayAttendance: any[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedAdminForExport: string;
  setSelectedAdminForExport: (id: string) => void;
  onExportCSV: (adminId?: string) => void;
  showOverrideDialog: boolean;
  setShowOverrideDialog: (open: boolean) => void;
  selectedRecordForOverride: AttendanceRecord | null;
  setSelectedRecordForOverride: (record: AttendanceRecord | null) => void;
  overrideStatus: string;
  setOverrideStatus: (status: string) => void;
  overrideReason: string;
  setOverrideReason: (reason: string) => void;
  onOverride: () => void;
  isLoading: boolean;
}

/* ========================================================= */
/* MAIN COMPONENT                                            */
/* ========================================================= */

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = (props) => {
  const {
    stats, attendanceData, allAdmins, todayAttendance,
    selectedDate, setSelectedDate, selectedAdminForExport,
    setSelectedAdminForExport, onExportCSV, showOverrideDialog,
    setShowOverrideDialog, selectedRecordForOverride,
    setSelectedRecordForOverride, overrideStatus, setOverrideStatus,
    overrideReason, setOverrideReason, onOverride, isLoading,
  } = props;

  const safePercentage = stats.total > 0 ? stats.percentage : 0;
  const dataHealthScore = useMemo(() => calculateDataHealth(attendanceData), [attendanceData]);
  const formattedDate = useMemo(() => format(selectedDate, 'PPP'), [selectedDate]);

  const renderStatCard = (icon: React.ReactNode, value: number, label: string, color: string) => (
    <Card className="bg-gray-900/50 border-gray-800 transition-all hover:border-gray-700">
      <CardContent className="p-6 text-center">
        <div className="flex justify-center mb-2">{icon}</div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">{label}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* HEADER SECTION WITH SYSTEM STATUS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-blue-500" />
            Control Center
          </h2>
          <p className="text-sm text-gray-500">Global attendance management & system overrides</p>
        </div>

        <div className="flex items-center gap-3 bg-gray-900/80 p-1 rounded-xl border border-gray-800">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-300 hover:bg-gray-800">
                <CalendarIcon className="mr-2 h-4 w-4 text-blue-400" />
                {formattedDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="bg-gray-950 border-gray-800 p-0" align="end">
              <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} />
            </PopoverContent>
          </Popover>
          <div className="h-4 w-[1px] bg-gray-800" />
          <Button variant="ghost" size="sm" className="text-gray-400">
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {renderStatCard(<Users className="h-6 w-6 text-blue-500" />, stats.total, 'Total', 'text-white')}
        {renderStatCard(<UserCheck className="h-6 w-6 text-emerald-500" />, stats.present, 'Present', 'text-emerald-400')}
        {renderStatCard(<Clock className="h-6 w-6 text-amber-500" />, stats.late, 'Late', 'text-amber-400')}
        {renderStatCard(<UserX className="h-6 w-6 text-rose-500" />, stats.absent, 'Absent', 'text-rose-400')}
        {renderStatCard(<AlertCircle className="h-6 w-6 text-gray-500" />, stats.notMarked, 'Pending', 'text-gray-400')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* EXPORT & UTILITIES BOX */}
        <Card className="lg:col-span-1 bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-purple-400" />
              Data Operations
            </CardTitle>
            <CardDescription>Export logs and manage archival</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-gray-500">Target Resource</Label>
              <Select value={selectedAdminForExport} onValueChange={setSelectedAdminForExport}>
                <SelectTrigger className="bg-gray-950 border-gray-800">
                  <SelectValue placeholder="Select Admin" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-gray-800">
                  <SelectItem value="all">Full Organization</SelectItem>
                  {allAdmins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold" onClick={() => onExportCSV(selectedAdminForExport)}>
              <Download className="h-4 w-4 mr-2" />
              Generate CSV Report
            </Button>
          </CardContent>
          <CardFooter className="border-t border-gray-800 pt-4 flex flex-col items-start gap-2">
            <div className="flex justify-between w-full text-[10px] font-black uppercase text-gray-500 tracking-tighter">
              <span>Data Integrity Score</span>
              <span className={getHealthColor(dataHealthScore)}>{dataHealthScore}%</span>
            </div>
            <Progress value={dataHealthScore} className="h-1.5 bg-gray-950" />
          </CardFooter>
        </Card>

        {/* RECENT RECORDS TABLE */}
        <Card className="lg:col-span-2 bg-gray-900/50 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">Active Session Logs</CardTitle>
              <CardDescription>Real-time synchronization data</CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
              {attendanceData.length} RECORDS
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-gray-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-950">
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase font-bold">Admin</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-center">Status</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Time</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.map((record) => (
                    <TableRow key={record.id} className="border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <TableCell className="font-medium text-gray-200">{safeText(record.admin?.name)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={`${getStatusBadgeClass(record.status)} border-none py-0.5 text-[10px]`}>
                          {formatStatus(record.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{formatTime(record.marked_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10"
                          onClick={() => {
                            setSelectedRecordForOverride(record);
                            setOverrideStatus(record.status);
                            setShowOverrideDialog(true);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OVERRIDE DIALOG */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Administrative Override
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
              <p className="text-xs text-gray-500 uppercase font-bold">Target User</p>
              <p className="text-sm font-semibold">{selectedRecordForOverride?.admin?.name || 'Unknown'}</p>
            </div>
            <div className="space-y-2">
              <Label>Status Override</Label>
              <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                <SelectTrigger className="bg-gray-900 border-gray-800 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-gray-800">
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late Arrival</SelectItem>
                  <SelectItem value="absent">Unexcused Absence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason for Adjustment</Label>
              <Textarea 
                placeholder="Enter justification for this record change..." 
                className="bg-gray-900 border-gray-800 resize-none h-24 text-sm"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowOverrideDialog(false)}>Cancel</Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-500 text-white" 
              onClick={onOverride}
              disabled={isLoading || !overrideReason}
            >
              {isLoading ? <RefreshCcw className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              Commit Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SYSTEM INTEGRITY FOOTER */}
      <div className="flex justify-between items-center p-6 border-t border-gray-800 mt-10 opacity-50">
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> System Live</span>
          <span>Build: 2026.03.v2</span>
        </div>
        <p className="text-[10px] text-gray-600 font-bold">&copy; THRYLOS ADMINISTRATIVE INFRASTRUCTURE</p>
      </div>

    </div>
  );
};

export default SuperAdminPanel;

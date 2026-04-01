import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  CalendarIcon, Plus, Check, X, Clock, FileText, 
  AlertCircle, User, Download, Briefcase, Heart, Palmtree, Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';

interface LeaveRequest {
  id: string;
  admin_id: string;
  subject: string;
  details: string | null;
  leave_date: string;
  leave_type: string;
  leave_category: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  admin?: { name: string; email: string; role: string };
  reviewer?: { name: string };
}

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LeaveBalance {
  id: string;
  admin_id: string;
  year: number;
  sick_leave_total: number;
  sick_leave_used: number;
  casual_leave_total: number;
  casual_leave_used: number;
  vacation_leave_total: number;
  vacation_leave_used: number;
}

interface AllLeaveBalances {
  [adminId: string]: LeaveBalance;
}

const LeaveManagement: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [allLeaveBalances, setAllLeaveBalances] = useState<AllLeaveBalances>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [selectedAdminForBalance, setSelectedAdminForBalance] = useState<Admin | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAdmin, setFilterAdmin] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    subject: '',
    details: '',
    leave_date: new Date(),
    leave_type: 'full_day',
    leave_category: 'casual',
  });
  
  const [balanceFormData, setBalanceFormData] = useState({
    sick_leave_total: 12,
    sick_leave_used: 0,
    casual_leave_total: 12,
    casual_leave_used: 0,
    vacation_leave_total: 15,
    vacation_leave_used: 0,
  });
  
  const [reviewNote, setReviewNote] = useState('');

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  useEffect(() => {
    if (adminProfile) {
      fetchLeaveRequests();
      fetchLeaveBalance();
      if (isSuperAdmin) {
        fetchAdmins();
      }
    }
  }, [adminProfile, filterStatus, filterAdmin]);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, name, email, role')
        .eq('is_active', true);
      
      if (error) throw error;
      setAdmins((data || []) as Admin[]);

      // Fetch leave balances for all admins if super admin
      if (isSuperAdmin && data) {
        await fetchAllLeaveBalances(data.map(a => a.id));
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchAllLeaveBalances = async (adminIds: string[]) => {
    const currentYear = new Date().getFullYear();
    
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('year', currentYear)
        .in('admin_id', adminIds);
      
      if (!error && data) {
        const balancesMap: AllLeaveBalances = {};
        data.forEach(balance => {
          balancesMap[balance.admin_id] = balance as LeaveBalance;
        });
        setAllLeaveBalances(balancesMap);
      }
    } catch (error) {
      console.error('Error fetching all leave balances:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    if (!adminProfile) return;
    
    const currentYear = new Date().getFullYear();
    
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('admin_id', adminProfile.id)
        .eq('year', currentYear)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No balance found, create one
        const { data: newBalance, error: insertError } = await supabase
          .from('leave_balances')
          .insert({
            admin_id: adminProfile.id,
            year: currentYear,
          })
          .select()
          .single();
        
        if (!insertError && newBalance) {
          setLeaveBalance(newBalance as LeaveBalance);
        }
      } else if (!error) {
        setLeaveBalance(data as LeaveBalance);
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    if (!adminProfile) return;
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (!isSuperAdmin) {
        query = query.eq('admin_id', adminProfile.id);
      } else if (filterAdmin !== 'all') {
        query = query.eq('admin_id', filterAdmin);
      }

      const { data, error } = await query;
      if (error) throw error;

      const adminIds = [...new Set((data || []).map(r => r.admin_id))];
      const reviewerIds = [...new Set((data || []).filter(r => r.reviewed_by).map(r => r.reviewed_by))];
      
      let adminData: Admin[] = [];
      if (adminIds.length > 0 || reviewerIds.length > 0) {
        const allIds = [...new Set([...adminIds, ...reviewerIds.filter(Boolean)])];
        const { data: adminsResult } = await supabase
          .from('admins')
          .select('id, name, email, role')
          .in('id', allIds);
        adminData = (adminsResult || []) as Admin[];
      }

      const requestsWithAdmin = (data || []).map(request => ({
        ...request,
        admin: adminData.find(a => a.id === request.admin_id),
        reviewer: request.reviewed_by ? adminData.find(a => a.id === request.reviewed_by) : undefined,
      }));

      setLeaveRequests(requestsWithAdmin as LeaveRequest[]);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitLeaveRequest = async () => {
    if (!adminProfile) return;
    
    if (!formData.subject.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subject",
        variant: "destructive",
      });
      return;
    }

    // Check leave balance
    if (leaveBalance) {
      const categoryKey = `${formData.leave_category}_leave_used` as keyof LeaveBalance;
      const totalKey = `${formData.leave_category}_leave_total` as keyof LeaveBalance;
      const used = leaveBalance[categoryKey] as number;
      const total = leaveBalance[totalKey] as number;
      
      if (used >= total) {
        toast({
          title: "Insufficient Leave Balance",
          description: `You have used all your ${formData.leave_category} leaves for this year`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          admin_id: adminProfile.id,
          subject: formData.subject,
          details: formData.details || null,
          leave_date: format(formData.leave_date, 'yyyy-MM-dd'),
          leave_type: formData.leave_type,
          leave_category: formData.leave_category,
          status: 'pending',
        });

      if (error) throw error;

      await logActivity('Submitted leave request', {
        subject: formData.subject,
        date: format(formData.leave_date, 'yyyy-MM-dd'),
        type: formData.leave_type,
        category: formData.leave_category,
      });

      toast({
        title: "Leave Request Submitted",
        description: "Your leave request has been sent for approval",
      });

      setShowRequestDialog(false);
      setFormData({
        subject: '',
        details: '',
        leave_date: new Date(),
        leave_type: 'full_day',
        leave_category: 'casual',
      });
      fetchLeaveRequests();
    } catch (error: any) {
      console.error('Error submitting leave request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reviewLeaveRequest = async (action: 'approved' | 'rejected') => {
    if (!adminProfile || !selectedRequest) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: action,
          reviewed_by: adminProfile.id,
          reviewed_at: new Date().toISOString(),
          review_note: reviewNote || null,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Update leave balance if approved
      if (action === 'approved' && selectedRequest.leave_category) {
        const category = selectedRequest.leave_category || 'casual';
        const usedKey = `${category}_leave_used`;
        const increment = selectedRequest.leave_type === 'half_day' ? 0.5 : 1;
        
        // Get current balance
        const { data: balance } = await supabase
          .from('leave_balances')
          .select('*')
          .eq('admin_id', selectedRequest.admin_id)
          .eq('year', new Date().getFullYear())
          .single();
        
        if (balance) {
          const currentUsed = (balance as any)[usedKey] || 0;
          await supabase
            .from('leave_balances')
            .update({ [usedKey]: currentUsed + increment })
            .eq('id', balance.id);
        }
      }

      await logActivity(`${action === 'approved' ? 'Approved' : 'Rejected'} leave request`, {
        request_id: selectedRequest.id,
        admin: selectedRequest.admin?.name,
        date: selectedRequest.leave_date,
        reason: reviewNote || undefined,
      });

      toast({
        title: `Leave Request ${action === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `The leave request has been ${action}`,
      });

      setShowReviewDialog(false);
      setSelectedRequest(null);
      setReviewNote('');
      fetchLeaveRequests();
      fetchLeaveBalance();
    } catch (error: any) {
      console.error('Error reviewing leave request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update leave request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openBalanceDialog = (admin: Admin) => {
    setSelectedAdminForBalance(admin);
    const existingBalance = allLeaveBalances[admin.id];
    if (existingBalance) {
      setBalanceFormData({
        sick_leave_total: existingBalance.sick_leave_total,
        sick_leave_used: existingBalance.sick_leave_used,
        casual_leave_total: existingBalance.casual_leave_total,
        casual_leave_used: existingBalance.casual_leave_used,
        vacation_leave_total: existingBalance.vacation_leave_total,
        vacation_leave_used: existingBalance.vacation_leave_used,
      });
    } else {
      setBalanceFormData({
        sick_leave_total: 12,
        sick_leave_used: 0,
        casual_leave_total: 12,
        casual_leave_used: 0,
        vacation_leave_total: 15,
        vacation_leave_used: 0,
      });
    }
    setShowBalanceDialog(true);
  };

  const handleSaveBalance = async () => {
    if (!selectedAdminForBalance) return;

    setIsLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const existingBalance = allLeaveBalances[selectedAdminForBalance.id];

      if (existingBalance) {
        // Update existing balance
        const { error } = await supabase
          .from('leave_balances')
          .update({
            sick_leave_total: balanceFormData.sick_leave_total,
            sick_leave_used: balanceFormData.sick_leave_used,
            casual_leave_total: balanceFormData.casual_leave_total,
            casual_leave_used: balanceFormData.casual_leave_used,
            vacation_leave_total: balanceFormData.vacation_leave_total,
            vacation_leave_used: balanceFormData.vacation_leave_used,
          })
          .eq('id', existingBalance.id);

        if (error) throw error;
      } else {
        // Create new balance
        const { error } = await supabase
          .from('leave_balances')
          .insert({
            admin_id: selectedAdminForBalance.id,
            year: currentYear,
            sick_leave_total: balanceFormData.sick_leave_total,
            sick_leave_used: balanceFormData.sick_leave_used,
            casual_leave_total: balanceFormData.casual_leave_total,
            casual_leave_used: balanceFormData.casual_leave_used,
            vacation_leave_total: balanceFormData.vacation_leave_total,
            vacation_leave_used: balanceFormData.vacation_leave_used,
          });

        if (error) throw error;
      }

      await logActivity('Adjusted leave balance', {
        admin_name: selectedAdminForBalance.name,
        sick_leave: `${balanceFormData.sick_leave_used}/${balanceFormData.sick_leave_total}`,
        casual_leave: `${balanceFormData.casual_leave_used}/${balanceFormData.casual_leave_total}`,
        vacation_leave: `${balanceFormData.vacation_leave_used}/${balanceFormData.vacation_leave_total}`,
      });

      toast({
        title: "Leave Balance Updated",
        description: `Leave balance for ${selectedAdminForBalance.name} has been updated successfully`,
      });

      setShowBalanceDialog(false);
      setSelectedAdminForBalance(null);
      fetchAdmins();
    } catch (error: any) {
      console.error('Error saving leave balance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update leave balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-blue-500 text-white border-blue-500';
      case 'rejected':
        return 'bg-gray-700 text-white border-gray-700';
      case 'pending':
        return 'bg-gray-500 text-white border-gray-500';
      default:
        return 'bg-gray-600 text-white border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sick':
        return <Heart className="h-4 w-4" />;
      case 'vacation':
        return <Palmtree className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const exportToCSV = async () => {
    try {
      const headers = ['Date', 'Admin', 'Subject', 'Category', 'Leave Type', 'Status', 'Reviewed By', 'Review Note'];
      const rows = leaveRequests.map(request => [
        request.leave_date,
        request.admin?.name || 'Unknown',
        request.subject,
        request.leave_category || 'casual',
        request.leave_type.replace('_', ' '),
        request.status,
        request.reviewer?.name || '-',
        request.review_note || '-',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leave-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Leave requests exported successfully",
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export leave requests",
        variant: "destructive",
      });
    }
  };

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;
  const approvedCount = leaveRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = leaveRequests.filter(r => r.status === 'rejected').length;

  const getLeaveBalancePercentage = (used: number, total: number) => {
    return total > 0 ? Math.round((used / total) * 100) : 0;
  };

  return (
    <ModuleLayout
      title="Leave Management"
      description="Request and manage leave applications"
    >
      <div className="space-y-6">
        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Casual Leave</p>
                  <p className="text-xl font-bold text-white">
                    {leaveBalance ? leaveBalance.casual_leave_total - leaveBalance.casual_leave_used : 12} 
                    <span className="text-sm text-gray-500"> / {leaveBalance?.casual_leave_total || 12}</span>
                  </p>
                </div>
              </div>
              <Progress 
                value={getLeaveBalancePercentage(leaveBalance?.casual_leave_used || 0, leaveBalance?.casual_leave_total || 12)} 
                className="h-2 bg-gray-800"
              />
              <p className="text-xs text-gray-500 mt-1">
                {leaveBalance?.casual_leave_used || 0} used
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Heart className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Sick Leave</p>
                  <p className="text-xl font-bold text-white">
                    {leaveBalance ? leaveBalance.sick_leave_total - leaveBalance.sick_leave_used : 12}
                    <span className="text-sm text-gray-500"> / {leaveBalance?.sick_leave_total || 12}</span>
                  </p>
                </div>
              </div>
              <Progress 
                value={getLeaveBalancePercentage(leaveBalance?.sick_leave_used || 0, leaveBalance?.sick_leave_total || 12)} 
                className="h-2 bg-gray-800"
              />
              <p className="text-xs text-gray-500 mt-1">
                {leaveBalance?.sick_leave_used || 0} used
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Palmtree className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Vacation Leave</p>
                  <p className="text-xl font-bold text-white">
                    {leaveBalance ? leaveBalance.vacation_leave_total - leaveBalance.vacation_leave_used : 15}
                    <span className="text-sm text-gray-500"> / {leaveBalance?.vacation_leave_total || 15}</span>
                  </p>
                </div>
              </div>
              <Progress 
                value={getLeaveBalancePercentage(leaveBalance?.vacation_leave_used || 0, leaveBalance?.vacation_leave_total || 15)} 
                className="h-2 bg-gray-800"
              />
              <p className="text-xs text-gray-500 mt-1">
                {leaveBalance?.vacation_leave_used || 0} used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Request Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Request Leave</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-gray-300">Subject *</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Reason for leave"
                      className="mt-1 bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Leave Category *</Label>
                    <Select 
                      value={formData.leave_category} 
                      onValueChange={(v) => setFormData({ ...formData, leave_category: v })}
                    >
                      <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800">
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="vacation">Vacation Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Leave Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full mt-1 justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.leave_date, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800">
                        <Calendar
                          mode="single"
                          selected={formData.leave_date}
                          onSelect={(date) => date && setFormData({ ...formData, leave_date: date })}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-gray-300">Leave Type</Label>
                    <Select 
                      value={formData.leave_type} 
                      onValueChange={(v) => setFormData({ ...formData, leave_type: v })}
                    >
                      <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800">
                        <SelectItem value="full_day">Full Day</SelectItem>
                        <SelectItem value="half_day">Half Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Additional Details</Label>
                    <Textarea
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      placeholder="Any additional information..."
                      rows={3}
                      className="mt-1 bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowRequestDialog(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                      Cancel
                    </Button>
                    <Button onClick={submitLeaveRequest} disabled={isLoading} className="bg-blue-500 hover:bg-blue-600 text-white">
                      {isLoading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] bg-gray-900 border-gray-800 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {isSuperAdmin && (
              <Select value={filterAdmin} onValueChange={setFilterAdmin}>
                <SelectTrigger className="w-[150px] bg-gray-900 border-gray-800 text-white">
                  <SelectValue placeholder="Admin" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="all">All Admins</SelectItem>
                  {admins.map(admin => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isSuperAdmin && (
            <Button variant="outline" onClick={exportToCSV} className="border-gray-700 text-gray-300 hover:bg-gray-800">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Stats Cards for Super Admin */}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4 flex items-center gap-4">
                <Clock className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{pendingCount}</p>
                  <p className="text-sm text-gray-500">Pending Requests</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4 flex items-center gap-4">
                <Check className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-500">{approvedCount}</p>
                  <p className="text-sm text-gray-500">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4 flex items-center gap-4">
                <X className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-400">{rejectedCount}</p>
                  <p className="text-sm text-gray-500">Rejected</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leave Balance Management for Super Admin */}
        {isSuperAdmin && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                Adjust Leave Balances
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manually adjust leave balances for admins (carry forward, bonus leaves, corrections)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {admins.map(admin => {
                  const balance = allLeaveBalances[admin.id];
                  return (
                    <Card key={admin.id} className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-white">{admin.name}</p>
                            <p className="text-xs text-gray-500">{admin.role.replace('_', ' ')}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openBalanceDialog(admin)}
                            className="border-gray-700 text-gray-300 hover:bg-gray-700"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Adjust
                          </Button>
                        </div>
                        {balance ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-300">
                              <span>Casual:</span>
                              <span>{balance.casual_leave_total - balance.casual_leave_used}/{balance.casual_leave_total}</span>
                            </div>
                            <div className="flex justify-between text-gray-300">
                              <span>Sick:</span>
                              <span>{balance.sick_leave_total - balance.sick_leave_used}/{balance.sick_leave_total}</span>
                            </div>
                            <div className="flex justify-between text-gray-300">
                              <span>Vacation:</span>
                              <span>{balance.vacation_leave_total - balance.vacation_leave_used}/{balance.vacation_leave_total}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No balance record</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leave Requests Table */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5" />
              {isSuperAdmin ? 'All Leave Requests' : 'My Leave Requests'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {isSuperAdmin 
                ? 'Review and manage leave requests from all admins'
                : 'View your leave request history and status'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leave requests found</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      {isSuperAdmin && <TableHead className="text-gray-400">Admin</TableHead>}
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Subject</TableHead>
                      <TableHead className="text-gray-400">Category</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Review Note</TableHead>
                      {isSuperAdmin && <TableHead className="text-gray-400">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request.id} className="border-gray-800">
                        {isSuperAdmin && (
                          <TableCell className="text-white">
                            <div>
                              <p className="font-medium">{request.admin?.name}</p>
                              <p className="text-xs text-gray-500">
                                {request.admin?.role?.replace('_', ' ')}
                              </p>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="text-white">{format(new Date(request.leave_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-white">
                          <div>
                            <p className="font-medium">{request.subject}</p>
                            {request.details && (
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {request.details}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-700 text-gray-300 flex items-center gap-1 w-fit">
                            {getCategoryIcon(request.leave_category || 'casual')}
                            {(request.leave_category || 'casual').charAt(0).toUpperCase() + (request.leave_category || 'casual').slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-700 text-gray-300">
                            {request.leave_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`flex items-center gap-1 w-fit ${getStatusBadgeClass(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {request.review_note ? (
                            <span className="text-sm">{request.review_note}</span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            {request.status === 'pending' && (
                              <Dialog open={showReviewDialog && selectedRequest?.id === request.id} onOpenChange={(open) => {
                                setShowReviewDialog(open);
                                if (!open) setSelectedRequest(null);
                              }}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSelectedRequest(request)}
                                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                  >
                                    Review
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-gray-900 border-gray-800">
                                  <DialogHeader>
                                    <DialogTitle className="text-white">Review Leave Request</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 mt-4">
                                    <div className="p-4 rounded-lg bg-gray-800/50">
                                      <p className="font-medium text-white">{request.admin?.name}</p>
                                      <p className="text-sm text-gray-400">{request.subject}</p>
                                      <p className="text-sm mt-2 text-gray-300">
                                        <strong>Date:</strong> {format(new Date(request.leave_date), 'PPP')}
                                      </p>
                                      <p className="text-sm text-gray-300">
                                        <strong>Category:</strong> {(request.leave_category || 'casual').charAt(0).toUpperCase() + (request.leave_category || 'casual').slice(1)}
                                      </p>
                                      <p className="text-sm text-gray-300">
                                        <strong>Type:</strong> {request.leave_type.replace('_', ' ')}
                                      </p>
                                      {request.details && (
                                        <p className="text-sm mt-2 text-gray-300">
                                          <strong>Details:</strong> {request.details}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <Label className="text-gray-300">Review Note (Optional)</Label>
                                      <Textarea
                                        value={reviewNote}
                                        onChange={(e) => setReviewNote(e.target.value)}
                                        placeholder="Add a note for the admin..."
                                        rows={2}
                                        className="mt-1 bg-gray-800 border-gray-700 text-white"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button 
                                        variant="outline"
                                        onClick={() => reviewLeaveRequest('rejected')}
                                        disabled={isLoading}
                                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Reject
                                      </Button>
                                      <Button 
                                        onClick={() => reviewLeaveRequest('approved')}
                                        disabled={isLoading}
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                      >
                                        <Check className="h-4 w-4 mr-2" />
                                        Approve
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            {request.status !== 'pending' && (
                              <span className="text-xs text-gray-500">
                                {request.reviewer?.name && `by ${request.reviewer.name}`}
                              </span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Adjustment Dialog */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Adjust Leave Balance - {selectedAdminForBalance?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 rounded-lg bg-gray-800/50">
              <p className="text-sm text-gray-400">
                Adjust leave totals and used counts for {selectedAdminForBalance?.name}. 
                Use this for carry-forward leaves, bonus grants, or corrections.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">Casual Total</Label>
                <Input
                  type="number"
                  value={balanceFormData.casual_leave_total}
                  onChange={(e) => setBalanceFormData({ ...balanceFormData, casual_leave_total: parseInt(e.target.value) || 0 })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Casual Used</Label>
                <Input
                  type="number"
                  value={balanceFormData.casual_leave_used}
                  onChange={(e) => setBalanceFormData({ ...balanceFormData, casual_leave_used: parseInt(e.target.value) || 0 })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">Sick Total</Label>
                <Input
                  type="number"
                  value={balanceFormData.sick_leave_total}
                  onChange={(e) => setBalanceFormData({ ...balanceFormData, sick_leave_total: parseInt(e.target.value) || 0 })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Sick Used</Label>
                <Input
                  type="number"
                  value={balanceFormData.sick_leave_used}
                  onChange={(e) => setBalanceFormData({ ...balanceFormData, sick_leave_used: parseInt(e.target.value) || 0 })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">Vacation Total</Label>
                <Input
                  type="number"
                  value={balanceFormData.vacation_leave_total}
                  onChange={(e) => setBalanceFormData({ ...balanceFormData, vacation_leave_total: parseInt(e.target.value) || 0 })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Vacation Used</Label>
                <Input
                  type="number"
                  value={balanceFormData.vacation_leave_used}
                  onChange={(e) => setBalanceFormData({ ...balanceFormData, vacation_leave_used: parseInt(e.target.value) || 0 })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBalanceDialog(false)} 
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveBalance} 
                disabled={isLoading} 
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
};

export default LeaveManagement;

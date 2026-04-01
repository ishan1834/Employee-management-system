// Commit 1: Base setup for Leave Management module

import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Interfaces for type safety
interface LeaveRequest {
  id: string;
  admin_id: string;
  subject: string;
  leave_date: string;
  leave_type: string;
  leave_category: string;
  status: string;
}

interface LeaveBalance {
  id: string;
  admin_id: string;
  year: number;
  casual_leave_total: number;
  casual_leave_used: number;
}

const LeaveManagement: React.FC = () => {
  const { adminProfile } = useAuth();

  // State initialization
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);

  // Commit 2: Fetch leave requests and leave balance from Supabase

useEffect(() => {
  if (adminProfile) {
    fetchLeaveRequests();
    fetchLeaveBalance();
  }
}, [adminProfile]);

// Fetch leave requests
const fetchLeaveRequests = async () => {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    setLeaveRequests(data || []);
  } catch (err) {
    console.error("Error fetching requests:", err);
  }
};

// Fetch leave balance
const fetchLeaveBalance = async () => {
  const currentYear = new Date().getFullYear();

  try {
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('admin_id', adminProfile.id)
      .eq('year', currentYear)
      .single();

    if (!error) {
      setLeaveBalance(data);
    }
  } catch (err) {
    console.error("Error fetching balance:", err);
  }
};

  // Commit 3: Add leave request form and submission logic

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const [formData, setFormData] = useState({
  subject: '',
  leave_date: new Date(),
  leave_type: 'full_day',
  leave_category: 'casual',
});

// Submit leave request
const submitLeaveRequest = async () => {
  if (!formData.subject.trim()) return;

  try {
    const { error } = await supabase
      .from('leave_requests')
      .insert({
        admin_id: adminProfile.id,
        subject: formData.subject,
        leave_date: formData.leave_date.toISOString(),
        leave_type: formData.leave_type,
        leave_category: formData.leave_category,
        status: 'pending',
      });

    if (error) throw error;

    fetchLeaveRequests();
  } catch (err) {
    console.error("Submit error:", err);
  }
};

// UI Button
<Button onClick={submitLeaveRequest}>
  Submit Leave
</Button>
  // Basic effect hook
  useEffect(() => {
    if (adminProfile) {
      console.log("Component mounted");
    }
  }, [adminProfile]);

  return (
    <ModuleLayout title="Leave Management" description="Manage leave requests">
      <Card>
        <CardContent>
          <p>Leave module initialized</p>
        </CardContent>
      </Card>
    </ModuleLayout>
  );
};

export default LeaveManagement;

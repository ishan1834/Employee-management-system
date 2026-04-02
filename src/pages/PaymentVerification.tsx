// feat: add PaymentVerification types, state and data fetching
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface PaymentVerificationItem {
  id: string;
  user_name: string;
  transaction_id: string;
  amount: number | null;
  payment_received: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

const PaymentVerification: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentVerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data || []) as PaymentVerificationItem[]);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);
};
// feat: add real-time Supabase subscription for payment changes

useEffect(() => {
  fetchPayments();

  const channel = supabase
    .channel('payment-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'payment_verifications' },
      () => fetchPayments()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
// feat: add handleAddPayment and handleVerifyPayment action handlers

const [dialogOpen, setDialogOpen] = useState(false);
const [formData, setFormData] = useState({
  user_name: '',
  user_email: '',
  transaction_id: '',
  amount: ''
});

const handleAddPayment = async () => {
  if (!formData.user_name || !formData.transaction_id) {
    toast({
      title: "Error",
      description: "Please fill in all required fields",
      variant: "destructive"
    });
    return;
  }

  try {
    const { error } = await supabase
      .from('payment_verifications')
      .insert({
        user_name: formData.user_name,
        transaction_id: formData.transaction_id,
        amount: parseFloat(formData.amount) || null
      } as any);

    if (error) throw error;

    toast({ title: "Success", description: "Payment record added successfully" });
    setDialogOpen(false);
    setFormData({ user_name: '', user_email: '', transaction_id: '', amount: '' });
    fetchPayments();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to add payment record",
      variant: "destructive"
    });
  }
};

const handleVerifyPayment = async (paymentId: string, verified: boolean) => {
  if (!adminProfile) return;

  try {
    const updateData: any = {
      payment_received: verified,
      verified_by: adminProfile.id,
      verified_at: verified ? new Date().toISOString() : null
    };

    const { error } = await supabase
      .from('payment_verifications')
      .update(updateData)
      .eq('id', paymentId);

    if (error) throw error;

    toast({
      title: "Success",
      description: `Payment ${verified ? 'verified' : 'unverified'} successfully`
    });
    fetchPayments();
  } catch (error: any) {
    toast({ title: "Error", description: "Failed to update payment status", variant: "destructive" });
  }
};

export default PaymentVerification;

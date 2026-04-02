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

export default PaymentVerification;


import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Check, X, Download } from 'lucide-react';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    transaction_id: '',
    amount: ''
  });

  useEffect(() => {
    fetchPayments();
    
    // Real-time subscription
    const channel = supabase
      .channel('payment-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payment_verifications' },
        () => fetchPayments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

      toast({
        title: "Success",
        description: "Payment record added successfully"
      });

      setDialogOpen(false);
      setFormData({ user_name: '', user_email: '', transaction_id: '', amount: '' });
      fetchPayments();
    } catch (error: any) {
      console.error('Error adding payment:', error);
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
        verified_by: adminProfile.id
      };

      if (verified) {
        updateData.verified_at = new Date().toISOString();
      } else {
        updateData.verified_at = null;
      }

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
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  const pendingPayments = payments.filter(p => !p.payment_received).length;
  const verifiedPayments = payments.filter(p => p.payment_received).length;
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <ModuleLayout
      title="Payment Verification"
      description="Verify user payments and manage transaction records"
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Add Payment Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user_name">User Name</Label>
                <Input
                  id="user_name"
                  value={formData.user_name}
                  onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  className="bg-black/50 border-white/10"
                  required
                />
              </div>
              <div>
                <Label htmlFor="user_email">User Email (Optional)</Label>
                <Input
                  id="user_email"
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="transaction_id">Transaction ID</Label>
                <Input
                  id="transaction_id"
                  value={formData.transaction_id}
                  onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                  className="bg-black/50 border-white/10"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPayment} className="gradient-primary">
                  Add Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gradient">{payments.length}</p>
                <p className="text-sm text-muted-foreground">Total Payments</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{pendingPayments}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{verifiedPayments}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gradient">₹{totalAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Amount</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="gradient-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Payment Records
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="shimmer h-12 rounded" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.user_name}</TableCell>
                      <TableCell className="font-mono">{payment.transaction_id}</TableCell>
                      <TableCell>
                        {payment.amount ? `₹${payment.amount.toLocaleString()}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={payment.payment_received 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }>
                          {payment.payment_received ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVerifyPayment(payment.id, true)}
                            disabled={payment.payment_received}
                            title="Verify Payment"
                          >
                            <Check className="w-4 h-4 text-green-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVerifyPayment(payment.id, false)}
                            disabled={!payment.payment_received}
                            title="Unverify Payment"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
};

export default PaymentVerification;

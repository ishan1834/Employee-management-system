import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, UserPlus, Key, Trash2, Mail, ShieldAlert } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdminManagement: React.FC = () => {
  const { adminProfile } = useAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', role: 'admin'
  });

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const fetchAdmins = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('admins')
      .select('*')
      .order('role', { ascending: false });
    setAdmins(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin) fetchAdmins();
  }, [isSuperAdmin]);

  const handleInvokeAction = async (action: string, payload: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: { action, ...payload }
      });

      if (error) throw error;
      
      toast({ title: "Success", description: data.message });
      fetchAdmins();
      if (action === 'create_admin') setShowCreateForm(false);
    } catch (err: any) {
      toast({ 
        title: "Action Failed", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  };

  const handleSetPassword = (userId: string) => {
    const newPass = prompt("Enter new password (min 6 chars):");
    if (newPass && newPass.length >= 6) {
      handleInvokeAction('set_password', { userId, newPassword: newPass });
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white p-6">
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold">Access Denied</h1>
          <p className="text-gray-400">Only Super Admins can access this module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <ModuleLayout 
        title="Admin Management" 
        description="Manage system access levels and administrative credentials"
        actions={<Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm"><UserPlus className="w-4 h-4 mr-2" /> Invite Admin</Button>}
      >

        {showCreateForm && (
          <Card className="mb-8 border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Create New Administrator
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input 
                  placeholder="Full Name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="bg-white/5 border-white/10"
                />
                <Input 
                  placeholder="Email Address" 
                  type="email"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email

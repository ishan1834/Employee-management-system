import React, { useState, useEffect } from "react";

// Layout & UI
import ModuleLayout from "@/components/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

// Icons
import { Plus, Edit, Trash2, Eye, UserPlus, Coffee, Ban, CheckCircle, Key } from "lucide-react";

// Hooks & Context
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

// Supabase & Types
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/types/database";
import { roleNames } from "@/types/auth";
import { castToAdminProfiles } from "@/utils/adminTypeCasting";

// Components
import AccessRestrictedState from "@/components/AccessRestrictedState";

// Types
type AdminProfile = Database["public"]["Tables"]["admins"]["Row"] & {
  status?: string;
};

/* ========================================================= */
/* TYPES                                                     */
/* ========================================================= */

type AdminRole =
  | "super_admin"
  | "social_admin"
  | "esports_admin"
  | "tech_admin"
  | "content_admin"
  | "hr_admin";

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
}

/* ========================================================= */
/* COMPONENT                                                 */
/* ========================================================= */

const AdminManagement: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();

  /* ============================= */
  /* STATE MANAGEMENT              */
  /* ============================= */

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);

  const [selectedAdmin, setSelectedAdmin] = useState<AdminProfile | null>(null);

  const [newPassword, setNewPassword] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    otp_email: "",
    role: "social_admin" as AdminRole,
    password: "",
    avatar: "",
    avatarFile: null as File | null,
  });

  /* ============================= */
  /* HANDLERS                      */
  /* ============================= */

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | File | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      otp_email: "",
      role: "social_admin",
      password: "",
      avatar: "",
      avatarFile: null,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (admin: AdminProfile) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      otp_email: "",
      role: admin.role,
      password: "",
      avatar: admin.avatar || "",
      avatarFile: null,
    });
    setDialogOpen(true);
  };

  const openPasswordDialog = (admin: AdminProfile) => {
    setSelectedAdmin(admin);
    setNewPassword("");
    setPasswordDialogOpen(true);
  };

  /* ============================= */
  /* SMALL VALIDATION (LIGHT)      */
  /* ============================= */

  const isFormValid = () => {
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.role !== ""
    );
  };

  /* ============================= */
  /* TOAST HELPERS                 */
  /* ============================= */

  const showSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
    });
  };

  const showError = (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  /* ============================= */
  /* DEBUG (OPTIONAL)              */
  /* ============================= */

  // console.log("Admins:", admins);
  // console.log("Selected Admin:", selectedAdmin);

  /* ========================================================= */
  /* RETURN (UI PART COMES BELOW)                              */
  /* ========================================================= */

  return (
    <div>
      {/* UI will go here */}
      <h1 className="text-xl font-bold">Admin Management</h1>
    </div>
  );
};

export default AdminManagement;

  useEffect(() => {
    fetchAdmins();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('admin-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'admins' },
        () => fetchAdmins()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Use the type casting utility
      const typedAdmins = castToAdminProfiles(data || []);
      setAdmins(typedAdmins);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      if (!formData.name || !formData.email || !formData.password) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
        return;
      }
      if (formData.password.length < 6) {
        toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
        return;
      }

      // Use edge function to create admin without switching session
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: {
          action: 'create_admin',
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          avatar: formData.avatar || null
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Success", description: "Admin created successfully. They can now login with their credentials." });
      setDialogOpen(false);
      resetForm();
      fetchAdmins();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast({ title: "Error", description: error.message || "Failed to create admin", variant: "destructive" });
    }
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      // Upload new avatar if file selected
      let avatarUrl = formData.avatar;
      if (formData.avatarFile && selectedAdmin.user_id) {
        const fileExt = formData.avatarFile.name.split('.').pop();
        const fileName = `avatars/${selectedAdmin.user_id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(fileName, formData.avatarFile, { upsert: true });
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('admins')
        .update({
          name: formData.name,
          email: formData.email,
          otp_email: formData.otp_email || null,
          role: formData.role,
          avatar: avatarUrl || null
        })
        .eq('id', selectedAdmin.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin updated successfully"
      });

      setDialogOpen(false);
      setSelectedAdmin(null);
      resetForm();
      fetchAdmins();
    } catch (error: any) {
      console.error('Error updating admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update admin",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedAdmin || !newPassword) {
      toast({ title: "Error", description: "Please enter a new password", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (!selectedAdmin.user_id) {
      toast({ title: "Error", description: "This admin has no linked auth user", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-management', {
        body: { action: 'set_password', userId: selectedAdmin.user_id, newPassword }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Success", description: "Password updated successfully" });
      setPasswordDialogOpen(false);
      setNewPassword('');
      setSelectedAdmin(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update password", variant: "destructive" });
    }
  };

  const openPasswordDialog = (admin: AdminProfile) => {
    setSelectedAdmin(admin);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const handleToggleActive = async (admin: AdminProfile) => {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ is_active: !admin.is_active })
        .eq('id', admin.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Admin ${admin.is_active ? 'deactivated' : 'activated'} successfully`
      });
    } catch (error: any) {
      console.error('Error toggling admin status:', error);
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive"
      });
    }
  };

  const handleSetStatus = async (admin: AdminProfile, status: string) => {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ status })
        .eq('id', admin.id);

      if (error) throw error;

      const statusMessages: { [key: string]: string } = {
        'active': 'Admin is now active and can login',
        'on_leave': 'Admin marked as on leave - they cannot login',
        'suspended': 'Admin has been suspended - they cannot login'
      };

      toast({
        title: "Status Updated",
        description: statusMessages[status] || 'Status updated successfully'
      });

      fetchAdmins();
    } catch (error: any) {
      console.error('Error updating admin status:', error);
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string = 'active') => {
    switch (status) {
      case 'on_leave':
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"><Coffee className="w-3 h-3 mr-1" />On Leave</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20"><Ban className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      otp_email: '',
      role: 'social_admin',
      password: '',
      avatar: '',
      avatarFile: null
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setSelectedAdmin(null);
    setDialogOpen(true);
  };

  const openEditDialog = (admin: AdminProfile) => {
    setFormData({
      name: admin.name,
      email: admin.email,
      otp_email: (admin as any).otp_email || '',
      role: admin.role as any,
      password: '',
      avatar: admin.avatar || '',
      avatarFile: null
    });
    setSelectedAdmin(admin);
    setDialogOpen(true);
  };

  const getRoleBadgeColor = (role: AdminProfile['role']) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-red-500/10 text-red-400 border-red-500/20',
      betting_admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      trading_admin: 'bg-green-500/10 text-green-400 border-green-500/20',
      social_admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      esports_admin: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      tech_admin: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      content_admin: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      hr_admin: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return colors[role] || 'bg-muted text-muted-foreground border-border';
  };

  if (adminProfile?.role !== 'super_admin') {
    return (
      <ModuleLayout title="Access Denied">
        <AccessRestrictedState />
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout
      title="Admin Management"
      description="Manage admin accounts, roles, and permissions"
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedAdmin ? 'Edit Admin' : 'Create New Admin'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="email">Login Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-black/50 border-white/10"
                  placeholder="Email used to login"
                />
              </div>
              <div>
                <Label htmlFor="otp_email">OTP Email (Optional)</Label>
                <Input
                  id="otp_email"
                  type="email"
                  value={formData.otp_email}
                  onChange={(e) => setFormData({ ...formData, otp_email: e.target.value })}
                  className="bg-black/50 border-white/10"
                  placeholder="Email where OTP will be sent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If empty, OTP will be sent to login email
                </p>
              </div>
              <div>
                <Label htmlFor="avatar">Avatar Image</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, avatarFile: file, avatar: URL.createObjectURL(file) });
                    }
                  }}
                  className="bg-black/50 border-white/10"
                />
                {formData.avatar && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={formData.avatar} alt="Preview" />
                      <AvatarFallback className="bg-gray-700 text-white text-xs">
                        {formData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-400">Preview</span>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value: any) => 
                  setFormData({ ...formData, role: value })
                }>
                  <SelectTrigger className="bg-black/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="social_admin">Social Media Admin</SelectItem>
                    <SelectItem value="esports_admin">eSports Admin</SelectItem>
                    <SelectItem value="tech_admin">Tech Admin</SelectItem>
                    <SelectItem value="content_admin">Content Admin</SelectItem>
                    <SelectItem value="hr_admin">HR Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!selectedAdmin && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-black/50 border-white/10"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={selectedAdmin ? handleUpdateAdmin : handleCreateAdmin}
                  className="gradient-primary"
                >
                  {selectedAdmin ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gradient">{admins.length}</p>
                <p className="text-sm text-muted-foreground">Total Admins</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {admins.filter(a => a.is_active && (a.status === 'active' || !a.status)).length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {admins.filter(a => a.status === 'on_leave').length}
                </p>
                <p className="text-sm text-muted-foreground">On Leave</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">
                  {admins.filter(a => a.status === 'suspended' || !a.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Suspended</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gradient-card border-white/10">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {admins.filter(a => a.role === 'super_admin').length}
                </p>
                <p className="text-sm text-muted-foreground">Super Admins</p>
              </div>
            </CardContent>
          </Card>
        </div>

        

        {/* Admins Table */}
        <Card className="gradient-card border-white/10">
          <CardHeader>
            <CardTitle>All Admins</CardTitle>
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
                    <TableHead>Admin</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={admin.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xs">
                              {admin.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{admin.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(admin.role)}>
                          {roleNames[admin.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={admin.is_active}
                            onCheckedChange={() => handleToggleActive(admin)}
                          />
                          <span className={admin.is_active ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
                            {admin.is_active ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(admin.status)}
                      </TableCell>
                      <TableCell>
                        {admin.last_login 
                          ? new Date(admin.last_login).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(admin)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPasswordDialog(admin)}
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Select
                            value={admin.status || 'active'}
                            onValueChange={(value) => handleSetStatus(admin, value)}
                          >
                            <SelectTrigger className="w-[110px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  Active
                                </span>
                              </SelectItem>
                              <SelectItem value="on_leave">
                                <span className="flex items-center gap-1">
                                  <Coffee className="w-3 h-3 text-yellow-500" />
                                  On Leave
                                </span>
                              </SelectItem>
                              <SelectItem value="suspended">
                                <span className="flex items-center gap-1">
                                  <Ban className="w-3 h-3 text-red-500" />
                                  Suspended
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
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

      

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password for {selectedAdmin?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To reset the password for this admin, they can use the "Forgot Password" option on the login page. 
              This will send a password reset email to: <strong>{selectedAdmin?.email}</strong>
            </p>
            <div>
              <Label htmlFor="newPassword">New Password (for reference only)</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-black/50 border-white/10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Note: Direct password updates require admin access to the backend dashboard.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                Close
              </Button>
              <Button
                onClick={handleUpdatePassword}
                className="gradient-primary"
              >
                Update Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
};

export default AdminManagement;

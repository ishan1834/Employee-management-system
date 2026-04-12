import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Lock, Edit, Eye, Upload, AlertTriangle, CheckCircle, Users, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AdminEmployeeData {
  id: string;
  admin_id: string;
  employee_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_joining: string | null;
  date_of_birth: string | null;
  department: string | null;
  designation: string | null;
  gender: string | null;
  marital_status: string | null;
  current_address: string | null;
  permanent_address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  aadhar_number: string | null;
  pan_number: string | null;
  profile_image_url: string | null;
  aadhar_document_url: string | null;
  pan_document_url: string | null;
  offer_letter_url: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  notes: string | null;
  salary: number | null;
  is_locked: boolean;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

const initialFormData = {
  employee_id: '',
  full_name: '',
  email: '',
  phone: '',
  date_of_joining: '',
  date_of_birth: '',
  department: '',
  designation: '',
  gender: '',
  marital_status: '',
  current_address: '',
  permanent_address: '',
  city: '',
  state: '',
  pincode: '',
  aadhar_number: '',
  pan_number: '',
  bank_account_number: '',
  bank_name: '',
  ifsc_code: '',
  upi_id: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relation: '',
  notes: '',
  salary: '',
};

const AdminEmployeeProfile: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [myData, setMyData] = useState<AdminEmployeeData | null>(null);
  const [allAdminsData, setAllAdminsData] = useState<(AdminEmployeeData & { admin_name?: string })[]>([]);
  const [formData, setFormData] = useState(initialFormData);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<AdminEmployeeData | null>(null);
  const [files, setFiles] = useState<{
    profile_image: File | null;
    aadhar_document: File | null;
    pan_document: File | null;
    offer_letter: File | null;
  }>({
    profile_image: null,
    aadhar_document: null,
    pan_document: null,
    offer_letter: null,
  });

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  useEffect(() => {
    if (adminProfile) {
      fetchMyData();
      if (isSuperAdmin) {
        fetchAllAdminsData();
      }
    }
  }, [adminProfile]);

  const fetchMyData = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_employee_data')
        .select('*')
        .eq('admin_id', adminProfile?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setMyData(data as AdminEmployeeData);
        setFormData({
          employee_id: data.employee_id || '',
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          date_of_joining: data.date_of_joining || '',
          date_of_birth: data.date_of_birth || '',
          department: data.department || '',
          designation: data.designation || '',
          gender: data.gender || '',
          marital_status: data.marital_status || '',
          current_address: data.current_address || '',
          permanent_address: data.permanent_address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          aadhar_number: data.aadhar_number || '',
          pan_number: data.pan_number || '',
          bank_account_number: data.bank_account_number || '',
          bank_name: data.bank_name || '',
          ifsc_code: data.ifsc_code || '',
          upi_id: data.upi_id || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          emergency_contact_relation: data.emergency_contact_relation || '',
          notes: data.notes || '',
          salary: data.salary?.toString() || '',
        });
      } else {
        // Pre-fill with admin data
        setFormData(prev => ({
          ...prev,
          full_name: adminProfile?.name || '',
          email: adminProfile?.email || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllAdminsData = async () => {
    try {
      const { data: employeeData, error } = await supabase
        .from('admin_employee_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch admin names
      const { data: admins } = await supabase
        .from('admins')
        .select('id, name');

      const adminMap = new Map(admins?.map(a => [a.id, a.name]) || []);
      
      const enrichedData = (employeeData || []).map(ed => ({
        ...ed as AdminEmployeeData,
        admin_name: adminMap.get(ed.admin_id) || 'Unknown'
      }));

      setAllAdminsData(enrichedData);
    } catch (error) {
      console.error('Error fetching all admins data:', error);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${adminProfile?.id}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('employee-documents')
      .upload(fileName, file, { upsert: true });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }
    
    const { data: urlData } = supabase.storage.from('employee-documents').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async (isLocking: boolean = false) => {
    if (!adminProfile) return;
    setIsSaving(true);

    try {
      // Upload files
      let profile_image_url = myData?.profile_image_url || null;
      let aadhar_document_url = myData?.aadhar_document_url || null;
      let pan_document_url = myData?.pan_document_url || null;
      let offer_letter_url = myData?.offer_letter_url || null;

      if (files.profile_image) {
        profile_image_url = await uploadFile(files.profile_image, 'profile-images');
      }
      if (files.aadhar_document) {
        aadhar_document_url = await uploadFile(files.aadhar_document, 'aadhar');
      }
      if (files.pan_document) {
        pan_document_url = await uploadFile(files.pan_document, 'pan');
      }
      if (files.offer_letter) {
        offer_letter_url = await uploadFile(files.offer_letter, 'offer-letters');
      }

      const dataToSave = {
        admin_id: adminProfile.id,
        employee_id: formData.employee_id || null,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        date_of_joining: formData.date_of_joining || null,
        date_of_birth: formData.date_of_birth || null,
        department: formData.department || null,
        designation: formData.designation || null,
        gender: formData.gender || null,
        marital_status: formData.marital_status || null,
        current_address: formData.current_address || null,
        permanent_address: formData.permanent_address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        aadhar_number: formData.aadhar_number || null,
        pan_number: formData.pan_number || null,
        profile_image_url,
        aadhar_document_url,
        pan_document_url,
        offer_letter_url,
        bank_account_number: formData.bank_account_number || null,
        bank_name: formData.bank_name || null,
        ifsc_code: formData.ifsc_code || null,
        upi_id: formData.upi_id || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        emergency_contact_relation: formData.emergency_contact_relation || null,
        notes: formData.notes || null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        is_locked: isLocking,
        locked_at: isLocking ? new Date().toISOString() : null,
      };

      if (myData) {
        const { error } = await supabase
          .from('admin_employee_data')
          .update(dataToSave)
          .eq('id', myData.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_employee_data')
          .insert(dataToSave);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: isLocking 
          ? "Your employee data has been saved and locked. It cannot be edited anymore."
          : "Employee data saved successfully"
      });

      setConfirmDialogOpen(false);
      fetchMyData();
      if (isSuperAdmin) fetchAllAdminsData();
    } catch (error: any) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save employee data",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuperAdminUpdate = async () => {
    if (!selectedData) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('admin_employee_data')
        .update({
          employee_id: formData.employee_id || null,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          date_of_joining: formData.date_of_joining || null,
          date_of_birth: formData.date_of_birth || null,
          department: formData.department || null,
          designation: formData.designation || null,
          gender: formData.gender || null,
          marital_status: formData.marital_status || null,
          current_address: formData.current_address || null,
          permanent_address: formData.permanent_address || null,
          city: formData.city || null,
          state: formData.state || null,
          pincode: formData.pincode || null,
          aadhar_number: formData.aadhar_number || null,
          pan_number: formData.pan_number || null,
          bank_account_number: formData.bank_account_number || null,
          bank_name: formData.bank_name || null,
          ifsc_code: formData.ifsc_code || null,
          upi_id: formData.upi_id || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          emergency_contact_relation: formData.emergency_contact_relation || null,
          notes: formData.notes || null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
        })
        .eq('id', selectedData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee data updated successfully"
      });

      setEditDialogOpen(false);
      fetchAllAdminsData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update data",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openViewDialog = (data: AdminEmployeeData) => {
    setSelectedData(data);
    setViewDialogOpen(true);
  };

  const openEditDialog = (data: AdminEmployeeData) => {
    setSelectedData(data);
    setFormData({
      employee_id: data.employee_id || '',
      full_name: data.full_name || '',
      email: data.email || '',
      phone: data.phone || '',
      date_of_joining: data.date_of_joining || '',
      date_of_birth: data.date_of_birth || '',
      department: data.department || '',
      designation: data.designation || '',
      gender: data.gender || '',
      marital_status: data.marital_status || '',
      current_address: data.current_address || '',
      permanent_address: data.permanent_address || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
      aadhar_number: data.aadhar_number || '',
      pan_number: data.pan_number || '',
      bank_account_number: data.bank_account_number || '',
      bank_name: data.bank_name || '',
      ifsc_code: data.ifsc_code || '',
      upi_id: data.upi_id || '',
      emergency_contact_name: data.emergency_contact_name || '',
      emergency_contact_phone: data.emergency_contact_phone || '',
      emergency_contact_relation: data.emergency_contact_relation || '',
      notes: data.notes || '',
      salary: data.salary?.toString() || '',
    });
    setEditDialogOpen(true);
  };

  const renderFormFields = (readOnly: boolean = false) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Personal Information */}
      <div className="lg:col-span-3">
        <h3 className="text-lg font-semibold mb-3 text-white">Personal Information</h3>
      </div>
      
      <div>
        <Label>Employee ID</Label>
        <Input
          value={formData.employee_id}
          onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Full Name *</Label>
        <Input
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          disabled={readOnly}
          required
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Email *</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={readOnly}
          required
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Phone</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Date of Birth</Label>
        <Input
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Gender</Label>
        <Select
          value={formData.gender}
          onValueChange={(v) => setFormData({ ...formData, gender: v })}
          disabled={readOnly}
        >
          <SelectTrigger className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0">
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Marital Status</Label>
        <Select
          value={formData.marital_status}
          onValueChange={(v) => setFormData({ ...formData, marital_status: v })}
          disabled={readOnly}
        >
          <SelectTrigger className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="married">Married</SelectItem>
            <SelectItem value="divorced">Divorced</SelectItem>
            <SelectItem value="widowed">Widowed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Work Information */}
      <div className="lg:col-span-3 mt-4">
        <h3 className="text-lg font-semibold mb-3 text-white">Work Information</h3>
      </div>
      
      <div>
        <Label>Date of Joining</Label>
        <Input
          type="date"
          value={formData.date_of_joining}
          onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Department</Label>
        <Input
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Designation</Label>
        <Input
          value={formData.designation}
          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Salary</Label>
        <Input
          type="number"
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>

      {/* Address */}
      <div className="lg:col-span-3 mt-4">
        <h3 className="text-lg font-semibold mb-3 text-white">Address Information</h3>
      </div>
      
      <div className="lg:col-span-2">
        <Label>Current Address</Label>
        <Textarea
          value={formData.current_address}
          onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div className="lg:col-span-1">
        <Label>City</Label>
        <Input
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>State</Label>
        <Input
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Pincode</Label>
        <Input
          value={formData.pincode}
          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div className="lg:col-span-2">
        <Label>Permanent Address</Label>
        <Textarea
          value={formData.permanent_address}
          onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>

      {/* ID Documents */}
      <div className="lg:col-span-3 mt-4">
        <h3 className="text-lg font-semibold mb-3 text-white">ID Documents</h3>
      </div>
      
      <div>
        <Label>Aadhar Number</Label>
        <Input
          value={formData.aadhar_number}
          onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>PAN Number</Label>
        <Input
          value={formData.pan_number}
          onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>

      {/* Bank Details */}
      <div className="lg:col-span-3 mt-4">
        <h3 className="text-lg font-semibold mb-3 text-white">Bank Details</h3>
      </div>
      
      <div>
        <Label>Bank Name</Label>
        <Input
          value={formData.bank_name}
          onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Account Number</Label>
        <Input
          value={formData.bank_account_number}
          onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>IFSC Code</Label>
        <Input
          value={formData.ifsc_code}
          onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>UPI ID</Label>
        <Input
          value={formData.upi_id}
          onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>

      {/* Emergency Contact */}
      <div className="lg:col-span-3 mt-4">
        <h3 className="text-lg font-semibold mb-3 text-white">Emergency Contact</h3>
      </div>
      
      <div>
        <Label>Contact Name</Label>
        <Input
          value={formData.emergency_contact_name}
          onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Contact Phone</Label>
        <Input
          value={formData.emergency_contact_phone}
          onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>
      <div>
        <Label>Relationship</Label>
        <Input
          value={formData.emergency_contact_relation}
          onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
      </div>

      {/* Notes */}
      <div className="lg:col-span-3 mt-4">
        <Label>Additional Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          disabled={readOnly}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
          rows={3}
        />
      </div>
    </div>
  );

  const renderDocumentUploads = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div className="lg:col-span-2">
        <h3 className="text-lg font-semibold mb-3 text-white">Document Uploads</h3>
      </div>
      
      <div>
        <Label>Profile Image</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setFiles({ ...files, profile_image: e.target.files?.[0] || null })}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
        {myData?.profile_image_url && (
          <a href={myData.profile_image_url} target="_blank" className="text-xs text-blue-400 hover:underline mt-1 block">
            View current image
          </a>
        )}
      </div>
      <div>
        <Label>Aadhar Document</Label>
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFiles({ ...files, aadhar_document: e.target.files?.[0] || null })}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
        {myData?.aadhar_document_url && (
          <a href={myData.aadhar_document_url} target="_blank" className="text-xs text-blue-400 hover:underline mt-1 block">
            View current document
          </a>
        )}
      </div>
      <div>
        <Label>PAN Document</Label>
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFiles({ ...files, pan_document: e.target.files?.[0] || null })}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
        {myData?.pan_document_url && (
          <a href={myData.pan_document_url} target="_blank" className="text-xs text-blue-400 hover:underline mt-1 block">
            View current document
          </a>
        )}
      </div>
      <div>
        <Label>Offer Letter</Label>
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFiles({ ...files, offer_letter: e.target.files?.[0] || null })}
          className="bg-black/60 border border-white/10 text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
        />
        {myData?.offer_letter_url && (
          <a href={myData.offer_letter_url} target="_blank" className="text-xs text-blue-400 hover:underline mt-1 block">
            View current document
          </a>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <ModuleLayout title="Employee Profile">
        <div className="text-center py-12">Loading...</div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout
      title="Employee Profile"
      description="Manage your employee information and documents"
    >
      <Tabs defaultValue="my-profile" className="space-y-6">
        <TabsList className="bg-black/70 border border-white/10 backdrop-blur-xl">
          <TabsTrigger value="my-profile" className="data-[state=active]:bg-white/10 text-white">
            <User className="w-4 h-4 mr-2" />
            My Profile
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="all-admins" className="data-[state=active]:bg-white/10 text-white">
              <Users className="w-4 h-4 mr-2" />
              All Admins Data
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-profile">
          <Card className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {myData?.is_locked ? (
                  <>
                    <Lock className="w-5 h-5 text-yellow-400" />
                    Profile Locked
                  </>
                ) : (
                  <>
                    <Edit className="w-5 h-5 text-blue-400" />
                    Edit Profile
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {myData?.is_locked 
                  ? "Your profile has been submitted and locked. Contact super admin for any changes."
                  : "Fill in your employee details. Once submitted and locked, only super admins can edit."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myData?.is_locked ? (
                <>
                  <Alert className="mb-6 border-yellow-500/20 bg-yellow-500/10">
                    <Lock className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-400">
                      This profile was locked on {new Date(myData.locked_at!).toLocaleDateString()}. 
                      Contact super admin if you need to make changes.
                    </AlertDescription>
                  </Alert>
                  {renderFormFields(true)}
                  
                  {/* Show document links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {myData.profile_image_url && (
                      <a href={myData.profile_image_url} target="_blank" className="text-blue-400 hover:underline">
                        📷 View Profile Image
                      </a>
                    )}
                    {myData.aadhar_document_url && (
                      <a href={myData.aadhar_document_url} target="_blank" className="text-blue-400 hover:underline">
                        📄 View Aadhar
                      </a>
                    )}
                    {myData.pan_document_url && (
                      <a href={myData.pan_document_url} target="_blank" className="text-blue-400 hover:underline">
                        📄 View PAN
                      </a>
                    )}
                    {myData.offer_letter_url && (
                      <a href={myData.offer_letter_url} target="_blank" className="text-blue-400 hover:underline">
                        📄 View Offer Letter
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {renderFormFields(false)}
                  {renderDocumentUploads()}
                  
                  <div className="flex gap-4 mt-8">
                    <Button
                      onClick={() => handleSubmit(false)}
                      disabled={isSaving}
                      className="border-white/20 text-white hover:bg-white/5"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button
                      onClick={() => setConfirmDialogOpen(true)}
                      disabled={isSaving || !formData.full_name || !formData.email}
                      className="bg-white text-black hover:bg-gray-200 font-semibold"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Submit and Lock Profile
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="all-admins">
            <Card className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle>All Admin Employee Data</CardTitle>
                <CardDescription>View and edit employee data for all admins</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin Name</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allAdminsData.map((data) => (
                      <TableRow key={data.id}>
                        <TableCell>{data.admin_name}</TableCell>
                        <TableCell>{data.employee_id || '-'}</TableCell>
                        <TableCell>{data.department || '-'}</TableCell>
                        <TableCell>{data.designation || '-'}</TableCell>
                        <TableCell>
                          {data.is_locked ? (
                            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                              <Lock className="w-3 h-3 mr-1" /> Locked
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                              <Edit className="w-3 h-3 mr-1" /> Editable
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => openViewDialog(data)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(data)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allAdminsData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No admin employee data submitted yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="bg-black/90 border border-white/10 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-5 h-5" />
              Confirm Submission
            </DialogTitle>
            <DialogDescription>
              <Alert className="mt-4 border-yellow-500/20 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400">
                  <strong>Warning:</strong> Once you submit and lock your profile, you will NOT be able to edit it anymore. 
                  Only a Super Admin can make changes after locking.
                </AlertDescription>
              </Alert>
              <p className="mt-4 text-muted-foreground">
                Please review all your information carefully before proceeding. Are you sure you want to submit and lock your employee profile?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="border-white/20 text-white hover:bg-white/5" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleSubmit(true)} 
              disabled={isSaving}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isSaving ? 'Submitting...' : 'Yes, Submit & Lock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Employee Data - {selectedData?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedData && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Employee ID:</strong> {selectedData.employee_id || '-'}</div>
                  <div><strong>Email:</strong> {selectedData.email}</div>
                  <div><strong>Phone:</strong> {selectedData.phone || '-'}</div>
                  <div><strong>DOB:</strong> {selectedData.date_of_birth || '-'}</div>
                  <div><strong>Gender:</strong> {selectedData.gender || '-'}</div>
                  <div><strong>Marital Status:</strong> {selectedData.marital_status || '-'}</div>
                  <div><strong>Department:</strong> {selectedData.department || '-'}</div>
                  <div><strong>Designation:</strong> {selectedData.designation || '-'}</div>
                  <div><strong>Date of Joining:</strong> {selectedData.date_of_joining || '-'}</div>
                  <div><strong>Salary:</strong> {selectedData.salary || '-'}</div>
                  <div className="col-span-2"><strong>Current Address:</strong> {selectedData.current_address || '-'}</div>
                  <div><strong>City:</strong> {selectedData.city || '-'}</div>
                  <div><strong>State:</strong> {selectedData.state || '-'}</div>
                  <div><strong>Pincode:</strong> {selectedData.pincode || '-'}</div>
                  <div><strong>Aadhar:</strong> {selectedData.aadhar_number || '-'}</div>
                  <div><strong>PAN:</strong> {selectedData.pan_number || '-'}</div>
                  <div><strong>Bank:</strong> {selectedData.bank_name || '-'}</div>
                  <div><strong>Account:</strong> {selectedData.bank_account_number || '-'}</div>
                  <div><strong>IFSC:</strong> {selectedData.ifsc_code || '-'}</div>
                  <div><strong>UPI:</strong> {selectedData.upi_id || '-'}</div>
                  <div><strong>Emergency Contact:</strong> {selectedData.emergency_contact_name || '-'}</div>
                  <div><strong>Emergency Phone:</strong> {selectedData.emergency_contact_phone || '-'}</div>
                </div>
                <div className="flex gap-4 flex-wrap">
                  {selectedData.profile_image_url && (
                    <a href={selectedData.profile_image_url} target="_blank" className="text-blue-400 hover:underline">
                      📷 Profile Image
                    </a>
                  )}
                  {selectedData.aadhar_document_url && (
                    <a href={selectedData.aadhar_document_url} target="_blank" className="text-blue-400 hover:underline">
                      📄 Aadhar
                    </a>
                  )}
                  {selectedData.pan_document_url && (
                    <a href={selectedData.pan_document_url} target="_blank" className="text-blue-400 hover:underline">
                      📄 PAN
                    </a>
                  )}
                  {selectedData.offer_letter_url && (
                    <a href={selectedData.offer_letter_url} target="_blank" className="text-blue-400 hover:underline">
                      📄 Offer Letter
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Super Admin Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee Data (Super Admin)</DialogTitle>
          </DialogHeader>
          {renderFormFields(false)}
          <DialogFooter className="mt-6">
            <Button className="border-white/20 text-white hover:bg-white/5" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSuperAdminUpdate} disabled={isSaving} className="bg-white text-black hover:bg-gray-200 font-semibold">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
};

export default AdminEmployeeProfile;

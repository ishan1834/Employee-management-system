
import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Users, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Internship {
  id: string;
  intern_name: string;
  email: string;
  department: string;
  start_date: string;
  end_date: string | null;
  status: string;
  mentor_id: string | null;
  intern_id: string | null;
  intern_email: string | null;
  join_date: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

const InternshipTracker: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    intern_name: '',
    intern_email: '',
    intern_id: '',
    department: '',
    join_date: ''
  });

 useEffect(() => {
  const loadData = async () => {
    await fetchInternships();
  };

  const handleChange = (payload: unknown) => {
    console.log('Change detected:', payload);
    loadData();
  };

  loadData();

  const subscription = supabase
    .channel('realtime-internships')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'internships',
      },
      handleChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}, []);

  const fetchInternships = async () => {
    try {
      const { data, error } = await supabase
        .from('internships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInternships((data || []) as Internship[]);
    } catch (error) {
      console.error('Error fetching internships:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInternship = async () => {
    if (!adminProfile) return;

    if (!formData.intern_name || !formData.intern_email || !formData.join_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('internships')
        .insert({
          intern_name: formData.intern_name,
          email: formData.intern_email,
          intern_email: formData.intern_email,
          intern_id: formData.intern_id || null,
          department: formData.department,
          start_date: formData.join_date,
          join_date: formData.join_date,
          assigned_to: adminProfile.id,
          mentor_id: adminProfile.id
        } as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Internship record added successfully"
      });

      setDialogOpen(false);
      setFormData({
        intern_name: '',
        intern_email: '',
        intern_id: '',
        department: '',
        join_date: ''
      });
      fetchInternships();
    } catch (error: any) {
      console.error('Error adding internship:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add internship record",
        variant: "destructive"
      });
    }
  };

  const activeInternships = internships.filter(i => i.status === 'active').length;
  const completedInternships = internships.filter(i => i.status === 'completed').length;

  return (
    <ModuleLayout
      title="Internship Tracker"
      description="Manage intern records, track attendance, and monitor progress"
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Intern
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle>Add New Intern</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="intern_name">Intern Name</Label>
                <Input
                  id="intern_name"
                  value={formData.intern_name}
                  onChange={(e) => setFormData({ ...formData, intern_name: e.target.value })}
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="intern_email">Email</Label>
                <Input
                  id="intern_email"
                  type="email"
                  value={formData.intern_email}
                  onChange={(e) => setFormData({ ...formData, intern_email: e.target.value })}
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="intern_id">Intern ID</Label>
                <Input
                  id="intern_id"
                  value={formData.intern_id}
                  onChange={(e) => setFormData({ ...formData, intern_id: e.target.value })}
                  className="bg-black/50 border-white/10"
                  placeholder="INT001"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="bg-black/50 border-white/10"
                  placeholder="Esports, Marketing, Development, etc."
                />
              </div>
              <div>
                <Label htmlFor="join_date">Join Date</Label>
                <Input
                  id="join_date"
                  type="date"
                  value={formData.join_date}
                  onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddInternship} className="gradient-primary">
                  Add Intern
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="gradient-card border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Interns</p>
                  <p className="text-2xl font-bold text-gradient">{activeInternships}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-gradient">{completedInternships}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Interns</p>
                  <p className="text-2xl font-bold text-gradient">{internships.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Internships Table */}
        <Card className="gradient-card border-white/10">
          <CardHeader>
            <CardTitle>Internship Records</CardTitle>
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
                    <TableHead>Intern ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {internships.map((internship) => (
                    <TableRow key={internship.id}>
                      <TableCell className="font-mono font-semibold text-blue-400">
                        {internship.intern_id || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">{internship.intern_name}</TableCell>
                      <TableCell>{internship.intern_email || internship.email}</TableCell>
                      <TableCell>{internship.department || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(internship.join_date || internship.start_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={internship.status === 'active'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }>
                          {internship.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {internship.end_date ? new Date(internship.end_date).toLocaleDateString() : 'N/A'}
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

export default InternshipTracker;

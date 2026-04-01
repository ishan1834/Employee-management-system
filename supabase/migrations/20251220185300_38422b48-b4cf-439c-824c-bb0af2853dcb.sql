import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserPlus, Search, FileText, Phone, Mail, 
  MapPin, Briefcase, Landmark, MoreVertical, 
  Trash2, Edit, User, Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const EmployeeManagement: React.FC = () => {
  const { adminProfile } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name', { ascending: true });
    
    if (error) {
      toast({ title: "Fetch failed", description: error.message, variant: "destructive" });
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action is permanent.`)) return;
    
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Employee record removed." });
      fetchEmployees();
    }
  };

  const filtered = employees.filter(e => {
    const matchesSearch = e.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          e.employee_id.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || e.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <ModuleLayout 
        title="Employee Directory" 
        description="Manage staff records, payroll details, and compliance documents"
        actions={
          <div className="flex gap-2">
             <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-2" /> Export</Button>
             <Button size="sm"><UserPlus className="w-4 h-4 mr-2" /> Add Employee</Button>
          </div>
        }
      >
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Staff', value: employees.length, color: 'text-blue-400' },
            { label: 'Active', value: employees.filter(e => e.status === 'active').length, color: 'text-green-400' },
            { label: 'On Leave', value: employees.filter(e => e.status === 'on_leave').length, color: 'text-yellow-400' },
            { label: 'Departments', value: new Set(employees.map(e => e.department)).size, color: 'text-purple-400' },
          ].map((stat, i) => (
            <Card key={i} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 uppercase font-semibold">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by name or Employee ID..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-10 bg-white/5 border-white/10" 
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Employee List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-10 text-center text-gray-500">Loading directory...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500 border border-dashed border-white/10 rounded-lg">
              No employee records found.
            </div>
          ) : (
            filtered.map(emp => (
              <Card key={emp.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all group">
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Profile & Basic Info */}
                  <div className="flex items-center gap-4 min-w-[250px]">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
                      {emp.profile_image_url ? (
                        <img src={emp.profile_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{emp.full_name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 leading-none">{emp.employee_id}</Badge>
                        <span>{emp.designation}</span>
                      </p>
                    </div>
                  </div>

                  {/* Department & Location */}
                  <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8 flex-1">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-gray-500 font-bold flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Dept
                      </p>
                      <p className="text-sm text-gray-300">{emp.department}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-gray-500 font-bold flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Contact
                      </p>
                      <p className="text-sm text-gray-300">{emp.email}</p>
                    </div>
                    <div className="hidden lg:block space-y-1">
                      <p className="text-[10px] uppercase text-gray-500 font-bold flex items-center gap-1">
                        <Landmark className="w-3 h-3" /> Salary
                      </p>
                      <p className="text-sm text-gray-300">${emp.salary.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {isSuperAdmin && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                        onClick={() => handleDelete(emp.id, emp.full_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ModuleLayout>
    </div>
  );
};

export default EmployeeManagement;

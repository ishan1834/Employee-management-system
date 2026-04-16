import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreVertical, Search, RefreshCw, Users, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Database } from '@/types/database';
import { castToAdminProfiles } from '@/utils/adminTypeCasting';

type AdminProfile = Database['public']['Tables']['admins']['Row'];

interface AdminListProps {
  admins: any[];
  onAdminsChange: (admins: AdminProfile[]) => void;
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  tech_admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  esports_admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  social_admin: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  hr_admin: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const AdminList: React.FC<AdminListProps> = ({ admins, onAdminsChange }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Cast admins with memoization
  const typedAdmins = useMemo(() => castToAdminProfiles(admins), [admins]);

  useEffect(() => {
    onAdminsChange(typedAdmins);
  }, [typedAdmins, onAdminsChange]);

  // Comprehensive filter logic
  const filteredAdmins = useMemo(() => {
    return typedAdmins.filter((admin) => {
      const matchesSearch = 
        admin.name.toLowerCase().includes(search.toLowerCase()) || 
        admin.email.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
      
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? admin.is_active
          : !admin.is_active;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [typedAdmins, search, roleFilter, statusFilter]);

  const roles = useMemo(() => Array.from(new Set(typedAdmins.map((a) => a.role))), [typedAdmins]);

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Management</h2>
          <p className="text-sm text-muted-foreground">Monitor system access and update admin permissions.</p>
        </div>

        <Button variant="outline" size="sm" onClick={resetFilters} className="w-fit">
          <RefreshCw className="h-4 w-4 mr-2" /> Reset Filters
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="Total Admins" 
          value={typedAdmins.length} 
          icon={<Users className="h-4 w-4 text-blue-400" />} 
        />
        <StatCard 
          title="Active Sessions" 
          value={typedAdmins.filter((a) => a.is_active).length} 
          icon={<ShieldCheck className="h-4 w-4 text-green-400" />} 
          trend="text-green-400"
        />
        <StatCard 
          title="Inactive" 
          value={typedAdmins.filter((a) => !a.is_active).length} 
          icon={<ShieldAlert className="h-4 w-4 text-muted-foreground" />} 
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px] bg-muted/50">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role} value={role} className="capitalize">
                  {role.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[160px] bg-muted/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Admin Cards */}
      <div className="grid gap-3">
        {filteredAdmins.map((admin) => (
          <Card key={admin.id} className="group border-white/5 bg-card/50 hover:bg-muted/30 transition-all duration-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-background shadow-xl">
                  <AvatarImage src={admin.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-bold">
                    {admin.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-base leading-none">{admin.name}</p>
                    <Badge variant="outline" className={`${roleColors[admin.role]} text-[10px] uppercase tracking-wider font-bold h-5`}>
                      {admin.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{admin.email}</p>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${admin.is_active ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                    <span className="text-[10px] uppercase font-medium text-muted-foreground">
                      {admin.is_active ? 'Active Now' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => console.log('View', admin.id)}>View Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('Edit', admin.id)}>Edit Permissions</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('Toggle', admin.id)}>
                    {admin.is_active ? 'Deactivate Account' : 'Reactivate Account'}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => console.log('Delete', admin.id)}>
                    Delete Admin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}

        {filteredAdmins.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-xl">
            <div className="bg-muted p-4 rounded-full mb-4">
               <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for cleaner stats
const StatCard = ({ title, value, icon, trend }: { title: string; value: number; icon: React.ReactNode; trend?: string }) => (
  <Card className="bg-muted/20 border-white/5">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">{title}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${trend}`}>{value}</p>
    </CardContent>
  </Card>
);

export default AdminList;

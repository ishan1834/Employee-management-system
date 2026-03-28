
    totalEmployees: 0,
    activeEmployees: 0,
    totalInterns: 0,
    activeInterns: 0,
    totalCertificates: 0,
    pendingApplications: 0,
    totalHolidays: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    totalPayroll: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [employeeSummary, setEmployeeSummary] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [
        { data: employees },
        { data: internships },
        { data: certificates },
        { data: applications },
        { data: holidays },
        { data: leaveRequests },
      ] = await Promise.all([
        supabase.from('employees').select('id, status, salary, full_name, department, designation'),
        supabase.from('internships').select('id, status'),
        supabase.from('certificates').select('id'),
        supabase.from('career_applications').select('id, status, full_name, role_applied_for, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('holidays').select('id'),
        supabase.from('leave_requests').select('*, admin:admins!admin_id(name, role)').order('created_at', { ascending: false }).limit(10),
      ]);

      const totalPayroll = employees?.reduce((sum, e) => sum + (e.salary || 0), 0) || 0;
      const pendingLeaves = (leaveRequests || []).filter((l: any) => l.status === 'pending').length;
      const approvedLeaves = (leaveRequests || []).filter((l: any) => l.status === 'approved').length;

      setStats({
        totalEmployees: employees?.length || 0,
        activeEmployees: employees?.filter(e => e.status === 'active').length || 0,
        totalInterns: internships?.length || 0,
        activeInterns: internships?.filter(i => i.status === 'active').length || 0,
        totalCertificates: certificates?.length || 0,
        pendingApplications: applications?.filter(a => a.status === 'pending').length || 0,
        totalHolidays: holidays?.length || 0,
        pendingLeaves,
        approvedLeaves,
        totalPayroll,
      });

      setRecentLeaves(leaveRequests || []);
      setRecentApplications(applications || []);
      setEmployeeSummary((employees || []).slice(0, 5));
    } catch (error) {
      console.error('Error fetching HR stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const modules = [
    {
      title: 'Employee Management',
      description: 'Manage employee records, documents, and details',
      icon: <Users className="w-6 h-6 text-blue-500" />,
      route: '/dashboard/employees',
      stats: { label: 'Employees', value: `${stats.activeEmployees}/${stats.totalEmployees}` },
      color: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      title: 'Leave Management',
      description: 'Approve/reject leave requests and manage balances',
      icon: <Calendar className="w-6 h-6 text-amber-500" />,
      route: '/dashboard/leave',
      stats: { label: 'Pending', value: stats.pendingLeaves },
      badge: stats.pendingLeaves > 0 ? `${stats.pendingLeaves} Pending` : undefined,
      color: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Internship Tracker',
      description: 'Track interns, assign mentors, and monitor progress',
      icon: <Briefcase className="w-6 h-6 text-teal-500" />,
      route: '/dashboard/internships',
      stats: { label: 'Active Interns', value: stats.activeInterns },
      color: 'bg-teal-500/10 border-teal-500/20'
    },
    {
      title: 'Certificate Manager',
      description: 'Issue and manage certificates for employees and interns',
      icon: <Award className="w-6 h-6 text-purple-500" />,
      route: '/dashboard/certificates',
      stats: { label: 'Issued', value: stats.totalCertificates },
      color: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Career Applications',
      description: 'Review job applications and manage hiring',
      icon: <FileText className="w-6 h-6 text-rose-500" />,
      route: '/dashboard/careers',
      stats: { label: 'Pending', value: stats.pendingApplications },
      badge: stats.pendingApplications > 0 ? 'New' : undefined,
      color: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      title: 'Holiday Calendar',
      description: 'Manage company holidays for attendance calculations',
      icon: <Calendar className="w-6 h-6 text-orange-500" />,
      route: '/dashboard/holidays',
      stats: { label: 'Holidays', value: stats.totalHolidays },
      color: 'bg-orange-500/10 border-orange-500/20'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-gray-500 text-white">Pending</Badge>;
      case 'approved': return <Badge className="bg-blue-500 text-white">Approved</Badge>;
      case 'rejected': return <Badge className="bg-gray-700 text-white">Rejected</Badge>;
      default: return <Badge className="bg-gray-600 text-white">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">HR Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Manage employees, leaves, internships, certificates, and applications
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalEmployees}</p>
                  <p className="text-xs text-gray-400">Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.pendingLeaves}</p>
                  <p className="text-xs text-gray-400">Pending Leaves</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-teal-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.activeInterns}</p>
                  <p className="text-xs text-gray-400">Active Interns</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.pendingApplications}</p>
                  <p className="text-xs text-gray-400">Pending Apps</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">₹{(stats.totalPayroll / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-400">Monthly Payroll</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {modules.map((module, index) => (
            <Card 
              key={index}
              className={`${module.color} border cursor-pointer hover:scale-[1.02] transition-transform`}
              onClick={() => navigate(module.route)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    {module.icon}
                  </div>
                  {module.badge && (
                    <Badge className="bg-rose-500">{module.badge}</Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{module.title}</h3>
                <p className="text-sm text-gray-400 mb-4">{module.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{module.stats.label}</p>
                    <p className="text-xl font-bold text-white">{module.stats.value}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Leave Requests */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Recent Leave Requests</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/leave')} className="text-blue-400 hover:text-blue-300">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                {recentLeaves.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No leave requests</p>
                ) : (
                  <div className="space-y-3">
                    {recentLeaves.map((leave: any) => (
                      <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{leave.admin?.name || 'Unknown'}</p>
                          <p className="text-gray-400 text-xs">{leave.subject} • {format(new Date(leave.leave_date), 'MMM d, yyyy')}</p>
                        </div>
                        {getStatusBadge(leave.status)}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Career Applications */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Recent Applications</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/careers')} className="text-blue-400 hover:text-blue-300">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                {recentApplications.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No applications</p>
                ) : (
                  <div className="space-y-3">
                    {recentApplications.map((app: any) => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{app.full_name}</p>
                          <p className="text-gray-400 text-xs">{app.role_applied_for} • {format(new Date(app.created_at), 'MMM d')}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Employee Summary Table */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Employee Overview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/employees')} className="text-blue-400 hover:text-blue-300">
                Manage All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Department</TableHead>
                  <TableHead className="text-gray-400">Designation</TableHead>
                  <TableHead className="text-gray-400">Salary</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeSummary.map((emp: any) => (
                  <TableRow key={emp.id} className="border-gray-800">
                    <TableCell className="text-white font-medium">{emp.full_name}</TableCell>
                    <TableCell className="text-gray-400">{emp.department}</TableCell>
                    <TableCell className="text-gray-400">{emp.designation}</TableCell>
                    <TableCell className="text-white">₹{(emp.salary || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={emp.status === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HRDashboard;

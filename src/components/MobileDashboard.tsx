

const MobileDashboard: React.FC<MobileDashboardProps> = ({ adminProfile, dashboardStats }) => {
  const navigate = useNavigate();
  const { playClickSound } = useButtonClickSound();
  const { settings, triggerHaptic } = useSoundSettings();

  const handleNavigate = (path: string) => {
    if (settings.soundEnabled) playClickSound();
    triggerHaptic();
    navigate(path);
  };

  const isSuperAdmin = adminProfile?.role === 'super_admin';
  const isHRAdmin = adminProfile?.role === 'hr_admin';

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Profile Card */}
      <div className="px-4 pt-4 pb-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center text-xl font-bold text-blue-400 border-2 border-blue-500/30">
              {adminProfile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{adminProfile?.name?.toUpperCase()}</h2>
              <p className="text-gray-400 text-sm">{adminProfile?.role?.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <QuickAction
            icon={<Calendar className="w-6 h-6 text-purple-500" />}
            label="Leave"
            onClick={() => handleNavigate('/dashboard/leave')}
            color="bg-purple-500/20"
          />
          <QuickAction
            icon={<CheckSquare className="w-6 h-6 text-emerald-500" />}
            label="Attendance"
            onClick={() => handleNavigate('/dashboard/attendance')}
            color="bg-emerald-500/20"
          />
          <QuickAction
            icon={<Clock className="w-6 h-6 text-cyan-500" />}
            label="Work Logs"
            onClick={() => handleNavigate(adminProfile?.role === 'tech_admin' ? '/dashboard/tech-work' : '/dashboard/content-work')}
            color="bg-cyan-500/20"
          />
        </div>
      </div>

      {/* Daily Routine Section */}
      <div className="px-4 mb-6">
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Daily Routine</h3>
          </div>
          <MenuItem
            icon={<CheckSquare className="w-5 h-5" />}
            label="Attendance"
            onClick={() => handleNavigate('/dashboard/attendance')}
            iconColor="text-blue-500"
          />
          <MenuItem
            icon={<Clock className="w-5 h-5" />}
            label="My Work Logs"
            onClick={() => handleNavigate(adminProfile?.role === 'tech_admin' ? '/dashboard/tech-work' : '/dashboard/content-work')}
            iconColor="text-cyan-500"
          />
        </div>
      </div>

      {/* Work & Reports Section */}
      <div className="px-4 mb-6">
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Work & Reports</h3>
          </div>
          {(adminProfile?.role === 'esports_admin' || isSuperAdmin) && (
            <MenuItem icon={<Users className="w-5 h-5" />} label="Esports Players" onClick={() => handleNavigate('/dashboard/esports-players')} iconColor="text-orange-500" />
          )}
          {(adminProfile?.role === 'social_admin' || adminProfile?.role === 'content_admin' || isSuperAdmin) && (
            <MenuItem icon={<BarChart3 className="w-5 h-5" />} label="Social Analytics" onClick={() => handleNavigate('/dashboard/social-analytics')} iconColor="text-pink-500" />
          )}
          <MenuItem icon={<MessageSquare className="w-5 h-5" />} label="Team Chat" onClick={() => handleNavigate('/dashboard/chat')} iconColor="text-green-500" />
          <MenuItem icon={<CreditCard className="w-5 h-5" />} label="Payments" onClick={() => handleNavigate('/dashboard/payments')} iconColor="text-yellow-500" />
        </div>
      </div>

      {/* Notifications & Files Section */}
      <div className="px-4 mb-6">
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notifications & Files</h3>
          </div>
          <MenuItem icon={<Bell className="w-5 h-5" />} label="Notifications" onClick={() => handleNavigate('/dashboard/notifications')} iconColor="text-blue-400" />
          <MenuItem icon={<FolderOpen className="w-5 h-5" />} label="Files" onClick={() => handleNavigate('/dashboard/files')} iconColor="text-amber-500" />
          <MenuItem icon={<Upload className="w-5 h-5" />} label="Bulk Upload" onClick={() => handleNavigate('/dashboard/bulk-upload')} iconColor="text-indigo-500" />
        </div>
      </div>

      {/* Productivity Section */}
      <div className="px-4 mb-6">
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Productivity</h3>
          </div>
          <MenuItem icon={<KanbanSquare className="w-5 h-5" />} label="Task Board" onClick={() => handleNavigate('/dashboard/tasks')} iconColor="text-blue-500" />
          <MenuItem icon={<Coffee className="w-5 h-5" />} label="Daily Standups" onClick={() => handleNavigate('/dashboard/standups')} iconColor="text-cyan-500" />
          <MenuItem icon={<Trophy className="w-5 h-5" />} label="Performance" onClick={() => handleNavigate('/dashboard/performance')} iconColor="text-yellow-500" />
        </div>
      </div>

      {/* Communication Section */}
      <div className="px-4 mb-6">
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Communication</h3>
          </div>
          <MenuItem icon={<Megaphone className="w-5 h-5" />} label="Announcements" onClick={() => handleNavigate('/dashboard/announcements')} iconColor="text-orange-500" />
          <MenuItem icon={<Vote className="w-5 h-5" />} label="Polls & Surveys" onClick={() => handleNavigate('/dashboard/polls')} iconColor="text-purple-500" />
          <MenuItem icon={<MessageCircle className="w-5 h-5" />} label="Feedback" onClick={() => handleNavigate('/dashboard/feedback')} iconColor="text-pink-500" />
          <MenuItem icon={<CalendarDays className="w-5 h-5" />} label="Team Events" onClick={() => handleNavigate('/dashboard/events')} iconColor="text-teal-500" />
          <MenuItem icon={<Cake className="w-5 h-5" />} label="Birthdays" onClick={() => handleNavigate('/dashboard/birthdays')} iconColor="text-rose-500" />
        </div>
      </div>

      {/* Admin Section - Only for Super Admin & HR */}
      {(isSuperAdmin || isHRAdmin) && (
        <div className="px-4 mb-6">
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {isHRAdmin ? 'HR Management' : 'Admin Controls'}
              </h3>
            </div>
            <MenuItem icon={<Users className="w-5 h-5" />} label="Employees" onClick={() => handleNavigate('/dashboard/employees')} iconColor="text-blue-500" />
            <MenuItem icon={<Briefcase className="w-5 h-5" />} label="Internships" onClick={() => handleNavigate('/dashboard/internships')} iconColor="text-teal-500" />
            <MenuItem icon={<Award className="w-5 h-5" />} label="Certificates" onClick={() => handleNavigate('/dashboard/certificates')} iconColor="text-purple-500" />
            <MenuItem icon={<FileText className="w-5 h-5" />} label="Career Applications" onClick={() => handleNavigate('/dashboard/careers')} iconColor="text-rose-500" />
            <MenuItem icon={<Calendar className="w-5 h-5" />} label="Leave Management" onClick={() => handleNavigate('/dashboard/leave')} iconColor="text-amber-500" />
            {isSuperAdmin && (
              <>
                <MenuItem icon={<Shield className="w-5 h-5" />} label="Admin Management" onClick={() => handleNavigate('/dashboard/admin-management')} iconColor="text-red-500" />
                <MenuItem icon={<Calendar className="w-5 h-5" />} label="Holiday Calendar" onClick={() => handleNavigate('/dashboard/holidays')} iconColor="text-orange-500" />
                <MenuItem icon={<FileBarChart className="w-5 h-5" />} label="Admin Reports" onClick={() => handleNavigate('/dashboard/reports')} iconColor="text-indigo-500" />
                <MenuItem icon={<Settings className="w-5 h-5" />} label="Settings" onClick={() => handleNavigate('/dashboard/settings')} iconColor="text-gray-500" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Attendance</p>
            <p className="text-2xl font-bold text-white">
              {isSuperAdmin 
                ? `${dashboardStats.presentToday}/${dashboardStats.totalAdmins}`
                : `${dashboardStats.presentDaysThisMonth}/${dashboardStats.workingDaysInMonth}`
              }
            </p>
            <p className="text-xs text-blue-400">{isSuperAdmin ? 'Today' : 'This Month'}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">{isSuperAdmin ? 'Total Admins' : 'Attendance %'}</p>
            <p className="text-2xl font-bold text-white">
              {isSuperAdmin ? dashboardStats.totalAdmins : `${dashboardStats.attendancePercentage}%`}
            </p>
            <p className="text-xs text-green-400">Active</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default MobileDashboard;

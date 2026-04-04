import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { useAuth } from '@/contexts/AuthContext';

const PerformanceScores: React.FC = () => {
  const { adminProfile } = useAuth();

  const [scores, setScores] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout title="Performance Scores" description="Performance Dashboard">
        <p className="text-gray-400">Loading...</p>
      </ModuleLayout>
    </div>
  );
};
const calculateScores = (adminsData, attendanceData, techLogs, contentLogs) => {
  const activeAdmins = adminsData?.filter(a => a.is_active) || [];
  const workingDaysInMonth = getWorkingDays();

  return activeAdmins.map(admin => {
    const adminAttendance = attendanceData?.filter(a => a.admin_id === admin.id) || [];
    const presentDays = adminAttendance.filter(a => a.status === 'present').length;
    const lateDays = adminAttendance.filter(a => a.status === 'late').length;
    const absentDays = adminAttendance.filter(a => a.status === 'absent').length;

    const adminTechLogs = techLogs?.filter(l => l.admin_id === admin.id) || [];
    const adminContentLogs = contentLogs?.filter(l => l.admin_id === admin.id) || [];
    const totalLogs = adminTechLogs.length + adminContentLogs.length;

    const attendanceScore = workingDaysInMonth > 0
      ? Math.min(100, Math.round(((presentDays + lateDays * 0.5) / workingDaysInMonth) * 100))
      : 0;

    const punctualityScore = (presentDays + lateDays) > 0
      ? Math.round((presentDays / (presentDays + lateDays)) * 100)
      : 0;

    const workLogScore = Math.min(100, totalLogs * 5);

    const overall = Math.round(
      attendanceScore * 0.4 +
      punctualityScore * 0.3 +
      workLogScore * 0.3
    );

    return {
      admin_id: admin.id,
      name: admin.name,
      role: admin.role,
      attendance_score: attendanceScore,
      punctuality_score: punctualityScore,
      work_log_score: workLogScore,
      overall_score: overall,
      present_days: presentDays,
      late_days: lateDays,
      absent_days: absentDays,
      total_logs: totalLogs
    };
  });
};
import { supabase } from '@/integrations/supabase/client';

const fetchData = async () => {
  const [{ data: adminsData }, { data: attendanceData }, { data: techLogs }, { data: contentLogs }] = await Promise.all([
    supabase.from('admins').select('id, name, role, is_active'),
    supabase.from('attendance').select('*').gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`),
    supabase.from('tech_work_logs').select('*').gte('created_at', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`),
    supabase.from('content_work_logs').select('*').gte('created_at', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
  ]);

  setAdmins(adminsData || []);
  setLoading(false);
};

useEffect(() => {
  fetchData();
}, []);
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const filtered = scores.filter(s =>
  s.name?.toLowerCase().includes(search.toLowerCase()) ||
  s.role?.toLowerCase().includes(search.toLowerCase())
);

<div className="mb-4 relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  <Input
    placeholder="Search by name or role..."
    value={search}
    onChange={e => setSearch(e.target.value)}
    className="pl-10 bg-white/5 border-white/10"
  />
</div>
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const getRank = (index: number) => {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `#${index + 1}`;
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
};

{filtered.map((score, i) => (
  <Card key={score.admin_id}>
    <CardContent>
      <div className="flex justify-between">
        <span>{getRank(i)}</span>
        <span className={getScoreColor(score.overall_score)}>
          {score.overall_score}%
        </span>
      </div>

      <Progress value={score.attendance_score} />
      <Progress value={score.punctuality_score} />
      <Progress value={score.work_log_score} />
    </CardContent>
  </Card>
))}

export default PerformanceScores;

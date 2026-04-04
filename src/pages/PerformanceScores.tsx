import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, RefreshCw, Trophy, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PerformanceScores: React.FC = () => {
  const { adminProfile } = useAuth();
  const [scores, setScores] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [calculating, setCalculating] = useState(false);
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const fetchData = async () => {
    const [{ data: adminsData }, { data: attendanceData }, { data: techLogs }, { data: contentLogs }] = await Promise.all([
      supabase.from('admins').select('id, name, role, is_active'),
      supabase.from('attendance').select('*').gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`),
      supabase.from('tech_work_logs').select('*').gte('created_at', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`),
      supabase.from('content_work_logs').select('*').gte('created_at', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
    ]);
    setAdmins(adminsData || []);
    
    // Calculate scores on the fly
    const activeAdmins = adminsData?.filter(a => a.is_active) || [];
    const workingDaysInMonth = getWorkingDays();
    
    const calculatedScores = activeAdmins.map(admin => {
      const adminAttendance = attendanceData?.filter(a => a.admin_id === admin.id) || [];
      const presentDays = adminAttendance.filter(a => a.status === 'present').length;
      const lateDays = adminAttendance.filter(a => a.status === 'late').length;
      const absentDays = adminAttendance.filter(a => a.status === 'absent').length;
      
      const adminTechLogs = techLogs?.filter(l => l.admin_id === admin.id) || [];
      const adminContentLogs = contentLogs?.filter(l => l.admin_id === admin.id) || [];
      const totalLogs = adminTechLogs.length + adminContentLogs.length;
      
      const attendanceScore = workingDaysInMonth > 0 ? Math.min(100, Math.round(((presentDays + lateDays * 0.5) / workingDaysInMonth) * 100)) : 0;
      const punctualityScore = (presentDays + lateDays) > 0 ? Math.round((presentDays / (presentDays + lateDays)) * 100) : 0;
      const workLogScore = Math.min(100, totalLogs * 5); // 5 points per log, max 100
      const overall = Math.round((attendanceScore * 0.4 + punctualityScore * 0.3 + workLogScore * 0.3));
      
      return {
        admin_id: admin.id, name: admin.name, role: admin.role,
        attendance_score: attendanceScore, punctuality_score: punctualityScore,
        work_log_score: workLogScore, overall_score: overall,
        present_days: presentDays, late_days: lateDays, absent_days: absentDays, total_logs: totalLogs
      };
    });
    
    setScores(calculatedScores.sort((a, b) => b.overall_score - a.overall_score));
    setLoading(false);
  };

  const getWorkingDays = () => {
    let days = 0;
    const today = now.getDate();
    for (let d = 1; d <= today; d++) {
      const date = new Date(currentYear, currentMonth - 1, d);
      if (date.getDay() !== 0 && date.getDay() !== 6) days++;
    }
    return days;
  };

  useEffect(() => { fetchData(); }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRank = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const filtered = scores.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout title="Performance Scores" description={`${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear} Performance Dashboard`}
        actions={<Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>}>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="border-white/10 bg-white/5"><CardContent className="p-3 text-center">
            <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{scores[0]?.name?.split(' ')[0] || '-'}</p>
            <p className="text-xs text-gray-400">Top Performer</p>
          </CardContent></Card>
          <Card className="border-white/10 bg-white/5"><CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{scores.length > 0 ? Math.round(scores.reduce((s, c) => s + c.overall_score, 0) / scores.length) : 0}%</p>
            <p className="text-xs text-gray-400">Avg Score</p>
          </CardContent></Card>
          <Card className="border-white/10 bg-white/5"><CardContent className="p-3 text-center">
            <CheckCircle className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{scores.filter(s => s.overall_score >= 80).length}</p>
            <p className="text-xs text-gray-400">High Performers</p>
          </CardContent></Card>
          <Card className="border-white/10 bg-white/5"><CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{getWorkingDays()}</p>
            <p className="text-xs text-gray-400">Working Days</p>
          </CardContent></Card>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name or role..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>

        {loading ? <p className="text-gray-400">Calculating scores...</p> : (
          <div className="space-y-3">
            {filtered.map((score, i) => (
              <Card key={score.admin_id} className="border-white/10 bg-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-bold w-8">{getRank(i)}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{score.name}</h3>
                      <p className="text-xs text-gray-500">{score.role?.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getScoreColor(score.overall_score)}`}>{score.overall_score}%</p>
                      <p className="text-xs text-gray-500">Overall</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Attendance</span><span className="text-white">{score.attendance_score}%</span></div>
                      <Progress value={score.attendance_score} className="h-1.5" />
                      <p className="text-[10px] text-gray-500 mt-1">P:{score.present_days} L:{score.late_days} A:{score.absent_days}</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Punctuality</span><span className="text-white">{score.punctuality_score}%</span></div>
                      <Progress value={score.punctuality_score} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Work Logs</span><span className="text-white">{score.work_log_score}%</span></div>
                      <Progress value={score.work_log_score} className="h-1.5" />
                      <p className="text-[10px] text-gray-500 mt-1">{score.total_logs} logs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

export default PerformanceScores;

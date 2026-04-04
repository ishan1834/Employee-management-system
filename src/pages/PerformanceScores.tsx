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

export default PerformanceScores;

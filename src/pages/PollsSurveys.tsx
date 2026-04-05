import React, { useState } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PollsSurveys: React.FC = () => {
  const { adminProfile } = useAuth();
  const fetchData = async () => {
  const [{ data: pollsData }, { data: votesData }] = await Promise.all([
    supabase
      .from('polls' as any)
      .select('*, admins!polls_created_by_fkey(name)')
      .order('created_at', { ascending: false }),
    supabase.from('poll_votes' as any).select('*')
  ]);

  setPolls((pollsData as any[]) || []);
  setVotes((votesData as any[]) || []);
  setLoading(false);
};

useEffect(() => {
  fetchData();
  const i = setInterval(fetchData, 5000);
  return () => clearInterval(i);
}, []);

  const [polls, setPolls] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout
        title="Polls & Surveys"
        description="Create polls and gather team opinions"
      >
        <p className="text-gray-400">Polls module initialized</p>
      </ModuleLayout>
    </div>
  );
};

export default PollsSurveys;

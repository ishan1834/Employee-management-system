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

export default PerformanceScores;

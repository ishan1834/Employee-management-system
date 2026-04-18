import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Coffee, Smile, Meh, Frown, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const moodIcons: Record<string, React.ReactNode> = {
  great: <Smile className="w-4 h-4 text-green-400" />,
  good: <Coffee className="w-4 h-4 text-blue-400" />,
  neutral: <Meh className="w-4 h-4 text-yellow-400" />,
  struggling: <Frown className="w-4 h-4 text-orange-400" />,
  blocked: <AlertTriangle className="w-4 h-4 text-red-400" />
};

const StandupLogs: React.FC = () => {
  const { adminProfile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [mood, setMood] = useState('neutral');
  const isSuperAdmin = adminProfile?.role === 'super_admin';
  

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('standup_logs' as any)
      .select('*, admins!standup_logs_admin_id_fkey(name, role)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);
    setLogs((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); const i = setInterval(fetchLogs, 5000); return () => clearInterval(i); }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const hasSubmittedToday = logs.some(l => l.admin_id === adminProfile?.id && l.date === todayStr);

  const handleSubmit = async () => {
    if (!today.trim()) { toast({ title: 'Please fill what you plan to do today', variant: 'destructive' }); return; }
    const { error } = await supabase.from('standup_logs' as any).insert({
      admin_id: adminProfile?.id, yesterday, today, blockers, mood, date: todayStr
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Standup submitted!' });
    setYesterday(''); setToday(''); setBlockers(''); setMood('neutral'); setShowForm(false); fetchLogs();
  };

  const filtered = logs.filter(l =>
    l.admins?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.today?.toLowerCase().includes(search.toLowerCase()) ||
    l.admins?.role?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByDate = filtered.reduce((acc: Record<string, any[]>, log: any) => {
    const date = log.date;
    if (!acc[date]) acc[date] = [] as any[];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, any[]>);

  

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout title="Daily Standups" description="Quick daily updates from the team"
        actions={!hasSubmittedToday ? <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 mr-1" /> Today's Standup</Button> : <Badge className="bg-green-500/20 text-green-400">✓ Submitted</Badge>}>
        
        {showForm && !hasSubmittedToday && (
  <Card className="mb-6 border-white/10 bg-white/5">
    <CardContent className="space-y-3 p-4">
      
      <div>
        <label className="mb-1 block text-xs text-gray-400">
          Yesterday I worked on:
        </label>
        <Textarea
          placeholder="What did you accomplish yesterday?"
          value={yesterday}
          onChange={(e) => setYesterday(e.target.value)}
          className="border-white/10 bg-white/5"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-400">
          Today I plan to:
        </label>
        <Textarea
          placeholder="What will you work on today?"
          value={today}
          onChange={(e) => setToday(e.target.value)}
          className="border-white/10 bg-white/5"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-400">
          Blockers:
        </label>
        <Input
          placeholder="Any blockers? (optional)"
          value={blockers}
          onChange={(e) => setBlockers(e.target.value)}
          className="border-white/10 bg-white/5"
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">Mood:</span>

        {Object.entries(moodIcons).map(([key, icon]) => (
          <button
            key={key}
            onClick={() => setMood(key)}
            className={`rounded-lg p-2 ${
              mood === key
                ? 'bg-white/10 ring-1 ring-blue-500'
                : 'hover:bg-white/5'
            }`}
          >
            {icon}
          </button>
        ))}

        <Button
          onClick={handleSubmit}
          size="sm"
          className="ml-auto"
        >
          Submit
        </Button>
      </div>

    </CardContent>
  </Card>
)}
        

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name, task, or role..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>

        {loading ? <p className="text-gray-400">Loading...</p> : Object.keys(groupedByDate).length === 0 ? <p className="text-gray-400">No standups yet.</p> : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                <div className="space-y-2">
                  {(groupedByDate[date] as any[]).map((log: any) => (
                    <Card key={log.id} className="border-white/10 bg-white/5">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          {moodIcons[log.mood] || moodIcons.neutral}
                          <span className="font-medium text-white text-sm">{log.admins?.name}</span>
                          <Badge variant="secondary" className="text-[10px]">{log.admins?.role?.replace('_', ' ')}</Badge>
                        </div>
                        {log.yesterday && <p className="text-xs text-gray-400 mb-1"><strong className="text-gray-300">Yesterday:</strong> {log.yesterday}</p>}
                        <p className="text-xs text-gray-400 mb-1"><strong className="text-gray-300">Today:</strong> {log.today}</p>
                        {log.blockers && <p className="text-xs text-red-400">🚧 {log.blockers}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

export default StandupLogs;

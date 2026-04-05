import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Vote, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PollsSurveys: React.FC = () => {
  const { adminProfile } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const fetchData = async () => {
    const [{ data: pollsData }, { data: votesData }] = await Promise.all([
      supabase.from('polls' as any).select('*, admins!polls_created_by_fkey(name)').order('created_at', { ascending: false }),
      supabase.from('poll_votes' as any).select('*')
    ]);
    setPolls((pollsData as any[]) || []);
    setVotes((votesData as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 5000); return () => clearInterval(i); }, []);

  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) { toast({ title: 'Need question and at least 2 options', variant: 'destructive' }); return; }
    const { error } = await supabase.from('polls' as any).insert({
      question, options: validOptions.map(o => ({ text: o })), created_by: adminProfile?.id
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Poll created!' });
    setQuestion(''); setOptions(['', '']); setShowForm(false); fetchData();
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    const existing = votes.find(v => v.poll_id === pollId && v.admin_id === adminProfile?.id);
    if (existing) { toast({ title: 'Already voted!' }); return; }
    const { error } = await supabase.from('poll_votes' as any).insert({
      poll_id: pollId, admin_id: adminProfile?.id, option_index: optionIndex
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Vote recorded!' }); fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this poll?')) return;
    await supabase.from('polls' as any).delete().eq('id', id);
    fetchData();
  };

  const filtered = polls.filter(p => p.question?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout title="Polls & Surveys" description="Create polls and gather team opinions"
        actions={isSuperAdmin ? <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Poll</Button> : undefined}>
        
        {showForm && isSuperAdmin && (
          <Card className="mb-6 border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-3">
              <Input placeholder="Question" value={question} onChange={e => setQuestion(e.target.value)} className="bg-white/5 border-white/10" />
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder={`Option ${i + 1}`} value={opt} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} className="bg-white/5 border-white/10" />
                  {i >= 2 && <Button variant="ghost" size="sm" onClick={() => setOptions(options.filter((_, j) => j !== i))}>×</Button>}
                </div>
              ))}
              <div className="flex gap-2">
                {options.length < 6 && <Button variant="outline" size="sm" onClick={() => setOptions([...options, ''])}>Add Option</Button>}
                <Button onClick={handleCreate} size="sm">Create Poll</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search polls..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>

        {loading ? <p className="text-gray-400">Loading...</p> : filtered.length === 0 ? <p className="text-gray-400">No polls yet.</p> : (
          <div className="space-y-4">
            {filtered.map(poll => {
              const pollVotes = votes.filter(v => v.poll_id === poll.id);
              const totalVotes = pollVotes.length;
              const hasVoted = pollVotes.some(v => v.admin_id === adminProfile?.id);
              const pollOptions = Array.isArray(poll.options) ? poll.options : [];

              return (
                <Card key={poll.id} className="border-white/10 bg-white/5">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{poll.question}</h3>
                        <p className="text-xs text-gray-500">By {poll.admins?.name} • {totalVotes} votes</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!poll.is_active && <Badge variant="secondary">Closed</Badge>}
                        {isSuperAdmin && <Button variant="ghost" size="sm" onClick={() => handleDelete(poll.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {pollOptions.map((opt: any, i: number) => {
                        const optVotes = pollVotes.filter(v => v.option_index === i).length;
                        const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <button
                                onClick={() => !hasVoted && poll.is_active && handleVote(poll.id, i)}
                                disabled={hasVoted || !poll.is_active}
                                className={`text-sm ${hasVoted ? 'text-gray-400' : 'text-blue-400 hover:text-blue-300 cursor-pointer'}`}
                              >
                                {opt.text || opt}
                              </button>
                              <span className="text-xs text-gray-500">{pct}% ({optVotes})</span>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                    {hasVoted && <p className="text-xs text-green-400 mt-2">✓ You voted</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

export default PollsSurveys;

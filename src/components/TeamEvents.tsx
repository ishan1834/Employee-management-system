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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CalendarDays, Clock, MapPin, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const TeamEvents: React.FC = () => {
  const { adminProfile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventType, setEventType] = useState('meeting');
  const [location, setLocation] = useState('');
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('team_events' as any)
      .select('*, admins!team_events_created_by_fkey(name)')
      .order('event_date', { ascending: true });
    setEvents((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); const i = setInterval(fetchEvents, 5000); return () => clearInterval(i); }, []);

  const handleCreate = async () => {
    if (!title.trim() || !eventDate) return;
    const { error } = await supabase.from('team_events' as any).insert({
      title, description, event_date: eventDate, event_time: eventTime || null,
      event_type: eventType, location, created_by: adminProfile?.id
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Event created!' });
    setTitle(''); setDescription(''); setEventDate(''); setEventTime(''); setLocation(''); setShowForm(false);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete event?')) return;
    await supabase.from('team_events' as any).delete().eq('id', id);
    fetchEvents();
  };

  const typeColors: Record<string, string> = {
    meeting: 'bg-blue-500/20 text-blue-400', training: 'bg-purple-500/20 text-purple-400',
    celebration: 'bg-yellow-500/20 text-yellow-400', deadline: 'bg-red-500/20 text-red-400',
    other: 'bg-gray-500/20 text-gray-400'
  };

  const filtered = events.filter(e =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.event_type?.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase())
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = filtered.filter(e => e.event_date >= todayStr);
  const past = filtered.filter(e => e.event_date < todayStr);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout title="Team Events" description="Calendar of team events and meetings"
        actions={isSuperAdmin ? <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Event</Button> : undefined}>
        
        {showForm && isSuperAdmin && (
          <Card className="mb-6 border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-3">
              <Input placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} className="bg-white/5 border-white/10" />
              <Textarea placeholder="Description..." value={description} onChange={e => setDescription(e.target.value)} className="bg-white/5 border-white/10" />
              <div className="flex gap-3 flex-wrap">
                <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-40 bg-white/5 border-white/10" />
                <Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="w-32 bg-white/5 border-white/10" />
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="meeting">Meeting</SelectItem><SelectItem value="training">Training</SelectItem><SelectItem value="celebration">Celebration</SelectItem><SelectItem value="deadline">Deadline</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
                <Input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} className="w-40 bg-white/5 border-white/10" />
                <Button onClick={handleCreate} size="sm">Create</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>

        {loading ? <p className="text-gray-400">Loading...</p> : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-blue-400 mb-3">Upcoming Events</h3>
                <div className="space-y-2">
                  {upcoming.map(event => (
                    <Card key={event.id} className="border-white/10 bg-white/5">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{event.title}</h3>
                              <Badge className={typeColors[event.event_type] || typeColors.other}>{event.event_type}</Badge>
                            </div>
                            {event.description && <p className="text-sm text-gray-300 mb-2">{event.description}</p>}
                            <div className="flex gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                              {event.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.event_time}</span>}
                              {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                            </div>
                          </div>
                          {isSuperAdmin && <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Past Events</h3>
                <div className="space-y-2 opacity-60">
                  {past.slice(0, 10).map(event => (
                    <Card key={event.id} className="border-white/10 bg-white/5">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm text-white">{event.title}</h4>
                          <Badge className={typeColors[event.event_type] || typeColors.other} >{event.event_type}</Badge>
                          <span className="text-xs text-gray-500 ml-auto">{new Date(event.event_date + 'T00:00:00').toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {upcoming.length === 0 && past.length === 0 && <p className="text-gray-400">No events yet.</p>}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

export default TeamEvents;

import React, { useState, useEffect, useMemo } from 'react';
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
import { Plus, CalendarDays, Clock, MapPin, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// --- Types ---
interface TeamEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: 'meeting' | 'training' | 'celebration' | 'deadline' | 'other';
  location: string | null;
  created_by: string;
  admins?: { name: string };
}

const TYPE_COLORS: Record<string, string> = {
  meeting: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  training: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  celebration: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  deadline: 'bg-red-500/20 text-red-400 border-red-500/50',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
};

const TeamEvents: React.FC = () => {
  const { adminProfile } = useAuth();
  const isSuperAdmin = adminProfile?.role === 'super_admin';

  // --- State ---
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  // Grouped Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    eventType: 'meeting',
    location: ''
  });

  // --- Logic ---
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('team_events')
        .select('*, admins:created_by (name)')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents((data as unknown as TeamEvent[]) || []);
    } catch (error: any) {
      console.error('Error fetching events:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000); // Polling every 10s is usually enough
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.eventDate) {
      toast({ title: 'Validation Error', description: 'Title and Date are required.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('team_events').insert({
      title: formData.title,
      description: formData.description,
      event_date: formData.eventDate,
      event_time: formData.eventTime || null,
      event_type: formData.eventType,
      location: formData.location,
      created_by: adminProfile?.id
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Event created successfully!' });
    setFormData({ title: '', description: '', eventDate: '', eventTime: '', eventType: 'meeting', location: '' });
    setShowForm(false);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const { error } = await supabase.from('team_events').delete().eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' });
    } else {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  // --- Memoized Filtering ---
  const { upcoming, past } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const filtered = events.filter(e =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.event_type.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase())
    );

    return {
      upcoming: filtered.filter(e => e.event_date >= today),
      past: filtered.filter(e => e.event_date < today)
    };
  }, [events, search]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <ModuleLayout 
        title="Team Events" 
        description="Calendar of team events and meetings"
        actions={isSuperAdmin && (
          <Button onClick={() => setShowForm(!showForm)} size="sm" variant={showForm ? "outline" : "default"}>
            <Plus className={`w-4 h-4 mr-1 transition-transform ${showForm ? 'rotate-45' : ''}`} /> 
            {showForm ? 'Cancel' : 'New Event'}
          </Button>
        )}
      >
        
        {showForm && isSuperAdmin && (
          <Card className="mb-6 border-white/10 bg-white/5 animate-in fade-in slide-in-from-top-2">
            <CardContent className="p-4 space-y-4">
              <Input 
                placeholder="Event title" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                className="bg-white/5 border-white/10 focus:border-blue-500/50" 
              />
              <Textarea 
                placeholder="Description..." 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="bg-white/5 border-white/10 focus:border-blue-500/50" 
              />
              <div className="flex gap-3 flex-wrap items-end">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-gray-500 font-bold ml-1">Date</span>
                  <Input type="date" value={formData.eventDate} onChange={e => setFormData({...formData, eventDate: e.target.value})} className="w-40 bg-white/5 border-white/10" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-gray-500 font-bold ml-1">Time</span>
                  <Input type="time" value={formData.eventTime} onChange={e => setFormData({...formData, eventTime: e.target.value})} className="w-32 bg-white/5 border-white/10" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-gray-500 font-bold ml-1">Type</span>
                  <Select value={formData.eventType} onValueChange={v => setFormData({...formData, eventType: v})}>
                    <SelectTrigger className="w-32 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(TYPE_COLORS).map(type => (
                        <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input 
                  placeholder="Location" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})} 
                  className="flex-1 min-w-[160px] bg-white/5 border-white/10" 
                />
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">Create Event</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search by title, type, or location..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-10 bg-white/5 border-white/10 focus:ring-1 ring-blue-500/50" 
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Syncing calendar...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Section */}
            <section>
              <h3 className="text-sm font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Upcoming Events
              </h3>
              <div className="grid gap-3">
                {upcoming.map(event => (
                  <EventCard key={event.id} event={event} isSuperAdmin={isSuperAdmin} onDelete={handleDelete} />
                ))}
                {upcoming.length === 0 && <p className="text-sm text-gray-600 italic py-4">No upcoming events scheduled.</p>}
              </div>
            </section>

            {/* Past Section */}
            {past.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 mb-4">Recent History</h3>
                <div className="grid gap-2 opacity-60 hover:opacity-100 transition-opacity">
                  {past.slice(0, 5).map(event => (
                    <Card key={event.id} className="border-white/5 bg-white/[0.02]">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={`${TYPE_COLORS[event.event_type]} text-[10px] px-2 py-0`}>
                            {event.event_type}
                          </Badge>
                          <h4 className="text-sm font-medium text-gray-300">{event.title}</h4>
                        </div>
                        <span className="text-xs text-gray-600">
                          {new Date(event.event_date + 'T00:00:00').toLocaleDateString()}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

// Sub-component for cleaner main render
const EventCard = ({ event, isSuperAdmin, onDelete }: { event: TeamEvent, isSuperAdmin: boolean, onDelete: (id: string) => void }) => (
  <Card className="border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors group">
    <CardContent className="p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-3 flex-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={`${TYPE_COLORS[event.event_type]} border capitalize`}>
                {event.event_type}
              </Badge>
              <h3 className="font-bold text-lg text-white leading-tight">{event.title}</h3>
            </div>
            {event.description && <p className="text-sm text-gray-400 line-clamp-2">{event.description}</p>}
          </div>
          
          <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1.5 text-blue-300/80">
              <CalendarDays className="w-3.5 h-3.5" />
              {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { 
                weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' 
              })}
            </span>
            {event.event_time && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {event.event_time}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
            )}
          </div>
        </div>
        
        {isSuperAdmin && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(event.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 hover:bg-red-400/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

export default TeamEvents;

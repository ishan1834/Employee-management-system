



import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Clock, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfWeek, addDays } from "date-fns";

interface Session { id: string; subject: string | null; chapter: string | null; duration_minutes: number; session_date: string; notes: string | null; }

export default function Planner() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [mins, setMins] = useState(60);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const load = () => user && supabase.from("study_sessions").select("*").eq("user_id", user.id)
    .gte("session_date", format(subDays(new Date(), 30), "yyyy-MM-dd"))
    .order("session_date", { ascending: false }).then(({ data }) => setSessions((data as Session[]) || []));

  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!user || !mins) return;
    const { error } = await supabase.from("study_sessions").insert({
      user_id: user.id, subject: subject || null, chapter: chapter || null,
      duration_minutes: mins, session_date: date, notes: notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Session logged");
    setOpen(false); setSubject(""); setChapter(""); setMins(60); setNotes("");
    load();
  };

  const del = async (id: string) => {
    await supabase.from("study_sessions").delete().eq("id", id);
    load();
  };

  // Weekly view
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const key = format(d, "yyyy-MM-dd");
    const total = sessions.filter((s) => s.session_date === key).reduce((sum, s) => sum + s.duration_minutes, 0);
    return { date: d, key, total, label: format(d, "EEE"), day: format(d, "d") };
  });

  const goalMins = (profile?.daily_goal_hours ?? 2) * 60;

  return (
    <StudentLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-semibold">Study Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan, track, conquer — daily goal {profile?.daily_goal_hours ?? 2}h</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sidebar text-sidebar-foreground hover:bg-sidebar/90"><Plus className="h-4 w-4 mr-1.5" /> Log session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log study session</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Physics" /></div>
                <div><Label>Chapter</Label><Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Mechanics" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Minutes</Label><Input type="number" value={mins} onChange={(e) => setMins(parseInt(e.target.value) || 0)} /></div>
                <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              </div>
              <div><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} className="bg-sidebar text-sidebar-foreground">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Weekly view */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-card">
        <h3 className="font-display font-semibold text-base mb-4 flex items-center gap-2"><CalIcon className="h-4 w-4 text-primary" /> This week</h3>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d) => {
            const pct = Math.min(100, (d.total / goalMins) * 100);
            return (
              <div key={d.key} className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.label}</div>
                <div className="text-xs font-semibold mb-2">{d.day}</div>
                <div className="h-24 bg-muted rounded-lg overflow-hidden flex items-end">
                  <div className="w-full bg-primary transition-all" style={{ height: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{Math.round(d.total / 60 * 10) / 10}h</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent sessions */}
      <h3 className="font-display font-semibold text-lg mb-3">Recent sessions</h3>
      {sessions.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center text-sm text-muted-foreground">No sessions logged yet. Click "Log session" to start.</div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Clock className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{s.subject || "Study"} {s.chapter ? `· ${s.chapter}` : ""}</div>
                <div className="text-[11px] text-muted-foreground">{format(new Date(s.session_date), "MMM d")} · {s.duration_minutes} min{s.notes ? ` · ${s.notes}` : ""}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}

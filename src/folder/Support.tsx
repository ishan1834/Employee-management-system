



import { useEffect, useRef, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, MessageCircle, Send, ChevronLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Ticket { id: string; subject: string; status: string; priority: string; category: string; last_message_at: string; created_at: string; }
interface Msg { id: string; sender_id: string; sender_role: string; body: string; created_at: string; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export default function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState(""); const [body, setBody] = useState(""); const [category, setCategory] = useState("general");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadTickets = async () => {
    if (!user) return;
    const { data } = await sb.from("support_tickets").select("*").eq("user_id", user.id).order("last_message_at", { ascending: false });
    setTickets((data as Ticket[]) || []);
  };

  const loadMsgs = async (id: string) => {
    const { data } = await sb.from("support_ticket_messages").select("*").eq("ticket_id", id).order("created_at");
    setMsgs((data as Msg[]) || []);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 60);
  };

  useEffect(() => { loadTickets(); }, [user]); // eslint-disable-line
  useEffect(() => { if (active) loadMsgs(active.id); }, [active]);

  // realtime new messages
  useEffect(() => {
    if (!active) return;
    const ch = sb.channel(`ticket-${active.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_ticket_messages", filter: `ticket_id=eq.${active.id}` }, () => loadMsgs(active.id))
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [active]);

  const createTicket = async () => {
    if (!user || !subject.trim() || !body.trim()) { toast.error("Subject and message required"); return; }
    const { data: t, error } = await sb.from("support_tickets").insert({ user_id: user.id, subject: subject.trim(), category, priority: "normal", status: "open" }).select("*").maybeSingle();
    if (error || !t) { toast.error(error?.message || "Failed"); return; }
    await sb.from("support_ticket_messages").insert({ ticket_id: t.id, sender_id: user.id, sender_role: "student", body: body.trim() });
    setCreateOpen(false); setSubject(""); setBody(""); setCategory("general");
    toast.success("Ticket created");
    await loadTickets();
    setActive(t as Ticket);
  };

  const send = async () => {
    if (!user || !active || !draft.trim()) return;
    const text = draft.trim(); setDraft("");
    const { error } = await sb.from("support_ticket_messages").insert({ ticket_id: active.id, sender_id: user.id, sender_role: "student", body: text });
    if (error) { toast.error(error.message); setDraft(text); return; }
    loadMsgs(active.id);
  };

  return (
    <StudentLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary" /> Support</h1>
          <p className="text-sm text-muted-foreground">Raise tickets and chat with our coordinators.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-sidebar text-sidebar-foreground hover:bg-sidebar/90"><Plus className="h-4 w-4 mr-1.5" /> New ticket</Button>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="space-y-2">
          {tickets.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center bg-card rounded-xl border border-border">No tickets yet.</p>}
          {tickets.map((t) => {
            const a = active?.id === t.id;
            return (
              <button key={t.id} onClick={() => setActive(t)} className={`w-full text-left p-3.5 rounded-xl border transition ${a ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-semibold text-sm truncate flex-1">{t.subject}</div>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${t.status === "open" ? "bg-success/15 text-success" : t.status === "pending" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{t.status}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">{t.category} · {formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}</div>
              </button>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-2xl flex flex-col min-h-[500px]">
          {active ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <button onClick={() => setActive(null)} className="lg:hidden"><ChevronLeft className="h-5 w-5" /></button>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold truncate">{active.subject}</div>
                  <div className="text-[10px] text-muted-foreground">Status: {active.status} · Priority: {active.priority}</div>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[55vh]">
                {msgs.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                        <div className="text-[10px] opacity-70 mb-0.5 font-semibold uppercase tracking-wider">{mine ? "You" : m.sender_role.replace("_", " ")}</div>
                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                        <div className="text-[9px] opacity-60 mt-1">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</div>
                      </div>
                    </div>
                  );
                })}
                {msgs.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">No messages yet.</div>}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" rows={2} className="resize-none" onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(); }} />
                <Button onClick={send} disabled={!draft.trim()} className="bg-sidebar text-sidebar-foreground self-stretch"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-10 text-center">Select a ticket or create a new one to start a conversation.</div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New support ticket</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe the issue" className="mt-1.5" /></div>
            <div>
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1.5 h-10 rounded-md border border-border bg-background px-3 text-sm">
                <option value="general">General</option>
                <option value="billing">Billing</option>
                <option value="bug">Bug / Technical</option>
                <option value="content">Question / Test content</option>
                <option value="account">Account</option>
              </select>
            </div>
            <div><Label>Message</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Describe what happened…" className="mt-1.5" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createTicket} className="bg-sidebar text-sidebar-foreground">Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}

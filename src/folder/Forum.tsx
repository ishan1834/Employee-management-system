



import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Plus, ThumbsUp, ThumbsDown, Pin, Flag, Sparkles, Reply, Trophy, Check } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Post { id: string; title: string | null; body: string; user_id: string; topic: string | null; track_code: string | null; upvotes: number | null; downvotes: number | null; pinned: boolean | null; created_at: string; parent_id: string | null; accepted?: boolean | null; profiles?: { display_name: string | null; full_name: string | null; reputation: number | null } | null; }

export default function Forum() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Record<string, Post[]>>({});
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [doubt, setDoubt] = useState<Post | null>(null);
  const [voted, setVoted] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ktl_voted") || "[]")); } catch { return new Set(); }
  });

  const load = async () => {
    const { data } = await supabase.from("forum_posts").select("*").is("parent_id", null).order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(100);
    const rows = (data as Post[]) || [];
    if (rows.length > 0) {
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, full_name, reputation").in("user_id", userIds);
      const map = new Map((profs || []).map((p) => [p.user_id, p]));
      rows.forEach((r) => { r.profiles = map.get(r.user_id) as never; });
    }
    setPosts(rows);
    // pick "Doubt of the Day" — most upvoted post in last 7 days
    const week = Date.now() - 7 * 86400000;
    const candidates = rows.filter((r) => +new Date(r.created_at) > week).sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    setDoubt(candidates[0] || rows[0] || null);
  };

  const loadReplies = async (postId: string) => {
    const { data } = await supabase.from("forum_posts").select("*").eq("parent_id", postId).order("created_at", { ascending: true }) as { data: Post[] | null };
    const rows = (data as Post[]) || [];
    if (rows.length > 0) {
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, full_name, reputation").in("user_id", ids);
      const map = new Map((profs || []).map((p) => [p.user_id, p]));
      rows.forEach((r) => { r.profiles = map.get(r.user_id) as never; });
    }
    setReplies((s) => ({ ...s, [postId]: rows }));
  };

  useEffect(() => { load(); }, []);

  const processMentions = async (postId: string, text: string) => {
    const handles = Array.from(text.matchAll(/@(\w+)/g)).map((m) => m[1]);
    if (handles.length === 0 || !user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data: matched } = await supabase.from("profiles").select("user_id, display_name").in("display_name", handles);
    for (const p of (matched || [])) {
      if (p.user_id === user.id) continue;
      await sb.from("forum_mentions").insert({ post_id: postId, mentioned_user_id: p.user_id, mentioned_by: user.id });
      await supabase.from("notifications").insert({
        user_id: p.user_id,
        title: `${profile?.display_name || "Someone"} mentioned you`,
        body: text.slice(0, 140),
        link: "/forum",
        category: "forum",
      });
    }
  };

  const create = async () => {
    if (!user || !body.trim()) { toast.error("Body required"); return; }
    const { data, error } = await supabase.from("forum_posts").insert({
      user_id: user.id, title: title || null, body, topic: topic || null,
      track_code: profile?.primary_track || null,
    }).select("id").maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data?.id) await processMentions(data.id, body);
    toast.success("Posted");
    setOpen(false); setTitle(""); setBody(""); setTopic("");
    load();
  };

  const sendReply = async (parentId: string) => {
    if (!user || !replyText.trim()) return;
    const { data, error } = await supabase.from("forum_posts").insert({ user_id: user.id, body: replyText, parent_id: parentId }).select("id").maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data?.id) await processMentions(data.id, replyText);
    setReplyText(""); setReplyTo(null);
    loadReplies(parentId);
  };

  const vote = async (p: Post, type: "up" | "down") => {
    if (voted.has(p.id)) { toast.error("Already voted"); return; }
    const update = type === "up" ? { upvotes: (p.upvotes || 0) + 1 } : { downvotes: (p.downvotes || 0) + 1 };
    await supabase.from("forum_posts").update(update).eq("id", p.id);
    // reward author with +1 reputation on upvote
    if (type === "up" && p.user_id !== user?.id) {
      const newRep = (p.profiles?.reputation || 0) + 1;
      await supabase.from("profiles").update({ reputation: newRep }).eq("user_id", p.user_id);
    }
    const next = new Set(voted); next.add(p.id);
    setVoted(next);
    localStorage.setItem("ktl_voted", JSON.stringify(Array.from(next)));
    if (p.parent_id) loadReplies(p.parent_id); else load();
  };

  const flag = async (p: Post) => {
    await supabase.from("forum_posts").update({ flagged: true }).eq("id", p.id);
    toast.success("Reported to moderators");
  };

  // Accept answer: only by thread author. Awards +5 reputation to reply author.
  const acceptAnswer = async (reply: Post, parent: Post) => {
    if (!user || parent.user_id !== user.id) { toast.error("Only the thread author can accept an answer"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    // unset any existing accepted on this thread
    await sb.from("forum_posts").update({ accepted: false }).eq("parent_id", parent.id);
    await sb.from("forum_posts").update({ accepted: true }).eq("id", reply.id);
    if (reply.user_id !== user.id) {
      const newRep = (reply.profiles?.reputation || 0) + 5;
      await supabase.from("profiles").update({ reputation: newRep }).eq("user_id", reply.user_id);
      await supabase.from("notifications").insert({
        user_id: reply.user_id,
        title: "Your answer was accepted ✓",
        body: "+5 reputation awarded.",
        category: "forum",
      });
    }
    toast.success("Answer accepted (+5 reputation)");
    loadReplies(parent.id);
  };

  return (
    <StudentLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-semibold">Community Forum</h1>
          <p className="text-sm text-muted-foreground mt-1">Doubts, discussions, and study groups</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sidebar text-sidebar-foreground hover:bg-sidebar/90"><Plus className="h-4 w-4 mr-1.5" /> New post</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create post</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" />
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (e.g. Doubts, Strategy)" />
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Share your doubt or thought…" />
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} className="bg-sidebar text-sidebar-foreground">Post</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Doubt of the Day */}
      {doubt && (
        <div className="mb-6 rounded-2xl p-5 bg-amber-gradient text-primary-foreground shadow-amber">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.18em] font-bold">Doubt of the Day</span>
          </div>
          {doubt.title && <div className="font-display text-lg font-semibold mb-1">{doubt.title}</div>}
          <p className="text-sm line-clamp-3 opacity-90">{doubt.body}</p>
          <div className="text-xs mt-2 opacity-80">by {doubt.profiles?.display_name || doubt.profiles?.full_name || "Anonymous"} · {doubt.upvotes ?? 0} upvotes</div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-display text-lg mb-1">No posts yet</p>
          <p className="text-sm text-muted-foreground">Be the first to start a discussion.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const repList = replies[p.id];
            return (
              <div key={p.id} className="bg-card rounded-2xl border border-border p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-sidebar text-sidebar-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    {(p.profiles?.display_name || p.profiles?.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{p.profiles?.display_name || p.profiles?.full_name || "Anonymous"}</span>
                      {(p.profiles?.reputation || 0) > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-primary"><Trophy className="h-3 w-3" /> {p.profiles?.reputation}</span>}
                      {p.pinned && <Pin className="h-3 w-3 text-primary" />}
                      {p.topic && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{p.topic}</span>}
                      {p.track_code && <span className="text-[10px] text-muted-foreground">{p.track_code}</span>}
                      <span className="text-[10px] text-muted-foreground">· {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                    </div>
                    {p.title && <h3 className="font-display font-semibold text-base mt-1">{p.title}</h3>}
                    <p className="text-sm mt-1.5 whitespace-pre-wrap">{p.body}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => vote(p, "up")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-success transition disabled:opacity-50" disabled={voted.has(p.id)}><ThumbsUp className="h-3.5 w-3.5" /> {p.upvotes ?? 0}</button>
                      <button onClick={() => vote(p, "down")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition disabled:opacity-50" disabled={voted.has(p.id)}><ThumbsDown className="h-3.5 w-3.5" /> {p.downvotes ?? 0}</button>
                      <button onClick={() => { setReplyTo(replyTo === p.id ? null : p.id); if (!repList) loadReplies(p.id); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"><Reply className="h-3.5 w-3.5" /> Reply</button>
                      <button onClick={() => flag(p)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition ml-auto"><Flag className="h-3 w-3" /></button>
                    </div>

                    {replyTo === p.id && (
                      <div className="mt-3 flex gap-2">
                        <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply…" autoFocus />
                        <Button size="sm" onClick={() => sendReply(p.id)} className="bg-sidebar text-sidebar-foreground">Send</Button>
                      </div>
                    )}

                    {repList && repList.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-border space-y-3">
                        {repList.map((r) => {
                          const isAccepted = !!r.accepted;
                          const canAccept = user?.id === p.user_id && !isAccepted;
                          return (
                            <div key={r.id} className={`flex items-start gap-2 p-2 -ml-2 rounded-lg ${isAccepted ? "bg-success/10 border border-success/30" : ""}`}>
                              <div className="h-7 w-7 rounded-full bg-muted text-foreground flex items-center justify-center text-[10px] font-semibold shrink-0">
                                {(r.profiles?.display_name || r.profiles?.full_name || "U").charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold">{r.profiles?.display_name || r.profiles?.full_name || "Anon"}</span>
                                  {isAccepted && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success"><Check className="h-3 w-3" /> ACCEPTED · +5</span>}
                                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <button onClick={() => vote(r, "up")} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-success disabled:opacity-50" disabled={voted.has(r.id)}>
                                    <ThumbsUp className="h-3 w-3" /> {r.upvotes ?? 0}
                                  </button>
                                  {canAccept && (
                                    <button onClick={() => acceptAnswer(r, p)} className="flex items-center gap-1 text-[11px] text-success font-semibold hover:underline">
                                      <Check className="h-3 w-3" /> Accept answer
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}

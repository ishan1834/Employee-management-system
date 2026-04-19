



import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StudentLayout } from "@/components/student/StudentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Play, Clock, Tag } from "lucide-react";
import { format } from "date-fns";

interface TestRow { id: string; name: string; description: string | null; track_code: string | null; subject: string | null; duration_minutes: number; starts_at: string | null; ends_at: string | null; cover_image: string | null; }

export default function Tests() {
  const [tests, setTests] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("tests").select("*").eq("status", "published").order("starts_at", { ascending: true }).then(({ data }) => {
      setTests((data as TestRow[]) || []);
      setLoading(false);
    });
  }, []);

  const filtered = tests.filter((t) =>
    [t.name, t.description, t.track_code, t.subject].some((f) => (f || "").toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <StudentLayout>
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold">Take a Test</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse all published tests across your tracks.</p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tests…" className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="font-display text-lg mb-1">No tests yet</p>
          <p className="text-sm text-muted-foreground">An admin can publish tests from the coordinator portal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const now = Date.now();
            const startsAt = t.starts_at ? new Date(t.starts_at).getTime() : null;
            const endsAt = t.ends_at ? new Date(t.ends_at).getTime() : null;
            const isLive = !startsAt || !endsAt || (now >= (startsAt || 0) && now <= (endsAt || Infinity));
            return (
              <div key={t.id} className="bg-card rounded-2xl p-5 border border-border shadow-card flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    {t.track_code || "General"}
                  </span>
                  {isLive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold">Available</span>}
                </div>
                <h3 className="font-display font-semibold text-lg leading-snug mb-1">{t.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">{t.description || "—"}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t.duration_minutes}m</span>
                  {t.subject && <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {t.subject}</span>}
                </div>
                {t.starts_at && t.ends_at && (
                  <div className="text-[11px] text-muted-foreground mb-3">
                    Window: {format(new Date(t.starts_at), "MMM d, h:mma")} – {format(new Date(t.ends_at), "MMM d, h:mma")}
                  </div>
                )}
                <Link to={`/test/${t.id}/intro`}>
                  <Button className="w-full bg-sidebar text-sidebar-foreground hover:bg-sidebar/90">
                    <Play className="h-3.5 w-3.5 mr-1.5" /> Start Test
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}





import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

interface Row { display_name: string | null; full_name: string | null; primary_track: string | null; reputation: number | null; current_streak: number | null; }

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    supabase
      .from("profiles")
      .select("display_name, full_name, primary_track, reputation, current_streak")
      .or("primary_track.is.null,primary_track.neq.COORDINATOR")
      .neq("display_name", "Coordinator")
      .order("reputation", { ascending: false })
      .limit(100)
      .then(({ data }) => setRows((data as Row[]) || []));
  }, []);
  return (
    <StudentLayout>
      <h1 className="font-display text-3xl font-semibold mb-1 flex items-center gap-3"><Trophy className="h-7 w-7 text-primary" /> Leaderboard</h1>
      <p className="text-sm text-muted-foreground mb-6">Global ranking by reputation</p>
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-4 p-3 border-b border-border last:border-0">
            <div className={`w-8 text-center font-display font-bold ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>#{i + 1}</div>
            <div className="h-9 w-9 rounded-full bg-sidebar text-sidebar-foreground flex items-center justify-center text-sm font-semibold">{(r.display_name || r.full_name || "U").charAt(0).toUpperCase()}</div>
            <div className="flex-1"><div className="text-sm font-medium">{r.display_name || r.full_name}</div><div className="text-[11px] text-muted-foreground">{r.primary_track || "—"} · {r.current_streak ?? 0}d streak</div></div>
            <div className="font-display text-lg font-semibold text-primary">{r.reputation ?? 0}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No rankings yet.</div>}
      </div>
    </StudentLayout>
  );
}

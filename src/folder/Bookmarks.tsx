



import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bookmark as BIcon, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderMath } from "@/lib/math";
import { toast } from "sonner";

interface Row {
  id: string; folder: string | null; notes: string | null;
  question_id: string;
  questions?: { question_text: string; subject: string | null; difficulty: string | null } | null;
}

export default function Bookmarks() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [folder, setFolder] = useState<string | null>(null);

  const load = () => user && supabase.from("bookmarks")
    .select("id, folder, notes, question_id, questions(question_text, subject, difficulty)")
    .eq("user_id", user.id).order("created_at", { ascending: false })
    .then(({ data }) => setRows((data as Row[]) || []));

  useEffect(() => { load(); }, [user]);

  const folders = Array.from(new Set(rows.map((r) => r.folder || "General")));
  const filtered = folder ? rows.filter((r) => (r.folder || "General") === folder) : rows;

  const del = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    toast.success("Removed");
    load();
  };

  return (
    <StudentLayout>
      <h1 className="font-display text-4xl font-semibold mb-1">Bookmarks</h1>
      <p className="text-sm text-muted-foreground mb-6">Your saved questions, organized by folder</p>

      {folders.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => setFolder(null)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${!folder ? "bg-sidebar text-sidebar-foreground" : "bg-muted text-muted-foreground"}`}>All ({rows.length})</button>
          {folders.map((f) => (
            <button key={f} onClick={() => setFolder(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1 ${folder === f ? "bg-sidebar text-sidebar-foreground" : "bg-muted text-muted-foreground"}`}>
              <FolderOpen className="h-3 w-3" /> {f}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <BIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-display text-lg mb-1">No bookmarks yet</p>
          <p className="text-sm text-muted-foreground">Bookmark questions during a test to revisit them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card rounded-2xl border border-border p-5 shadow-card flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{r.questions?.subject || "—"} · {r.questions?.difficulty || "—"}</div>
                <Button size="sm" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
              <div className="text-sm flex-1" dangerouslySetInnerHTML={{ __html: renderMath(r.questions?.question_text || "") }} />
              {r.notes && <div className="text-xs text-muted-foreground mt-2 italic">"{r.notes}"</div>}
              <div className="text-[10px] text-primary font-semibold mt-3">📁 {r.folder || "General"}</div>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}

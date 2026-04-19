



import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StudentLayout } from "@/components/student/StudentLayout";
import { Button } from "@/components/ui/button";
import { Bookmark, ArrowLeft, Trophy, Target, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { renderMath } from "@/lib/math";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface Attempt { id: string; score: number | null; max_score: number | null; accuracy: number | null; time_taken_seconds: number | null; violation_count: number | null; submitted_at: string | null; status: string; tests: { name: string; duration_minutes: number } | null; }
interface Ans { question_id: string; user_response: unknown; is_correct: boolean | null; marks_awarded: number; time_spent_seconds: number; questions: { id: string; question_text: string; q_type: string; options: { text: string }[] | null; correct_answer: unknown; solution: string | null; subject: string | null; } | null; }

export default function Result() {
  const { attemptId } = useParams();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Ans[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) return;
    Promise.all([
      supabase.from("attempts").select("*, tests(name, duration_minutes)").eq("id", attemptId).maybeSingle(),
      supabase.from("answers").select("*, questions(id, question_text, q_type, options, correct_answer, solution, subject)").eq("attempt_id", attemptId),
    ]).then(([a, ans]) => {
      setAttempt(a.data as unknown as Attempt);
      setAnswers((ans.data as unknown as Ans[]) || []);
      setLoading(false);
    });
  }, [attemptId]);

  const bookmark = async (qid: string) => {
    if (!user) return;
    const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, question_id: qid });
    if (error) toast.error(error.message); else toast.success("Bookmarked");
  };

  if (loading) return <StudentLayout><div className="text-sm text-muted-foreground">Loading…</div></StudentLayout>;
  if (!attempt) return <StudentLayout><div>Not found.</div></StudentLayout>;

  const pct = attempt.max_score ? Math.round(((attempt.score || 0) / attempt.max_score) * 1000) / 10 : 0;
  const correct = answers.filter((a) => a.is_correct === true).length;
  const wrong = answers.filter((a) => a.is_correct === false).length;
  const skipped = answers.length - correct - wrong;

  // Subject performance
  const subjMap: Record<string, { correct: number; total: number }> = {};
  answers.forEach((a) => {
    const s = a.questions?.subject || "General";
    if (!subjMap[s]) subjMap[s] = { correct: 0, total: 0 };
    subjMap[s].total++;
    if (a.is_correct) subjMap[s].correct++;
  });
  const radarData = Object.entries(subjMap).map(([s, v]) => ({ subject: s, accuracy: Math.round((v.correct / v.total) * 100) }));

  return (
    <StudentLayout>
      <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Link>

      <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 shadow-card mb-5">
        <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Result</div>
            <h1 className="font-display text-3xl font-semibold">{attempt.tests?.name}</h1>
            {attempt.status === "auto_submitted" && <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/15 text-warning text-xs font-semibold"><AlertTriangle className="h-3 w-3" /> Auto-submitted</div>}
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Score</div>
            <div className="font-display text-4xl font-bold text-primary">{attempt.score ?? 0}<span className="text-xl text-muted-foreground">/{attempt.max_score ?? 0}</span></div>
            <div className="text-sm font-semibold mt-1">{pct}%</div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat icon={Trophy} label="Correct" value={correct} accent="text-success" />
          <Stat icon={XCircle} label="Wrong" value={wrong} accent="text-destructive" />
          <Stat icon={Target} label="Accuracy" value={`${attempt.accuracy ?? 0}%`} />
          <Stat icon={Clock} label="Time" value={`${Math.floor((attempt.time_taken_seconds || 0) / 60)}m`} />
        </div>
      </div>

      {radarData.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card mb-5">
          <h3 className="font-display font-semibold mb-3">Subject performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Radar dataKey="accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <h2 className="font-display text-xl font-semibold mb-3 mt-6">Solution review</h2>
      <div className="space-y-3">
        {answers.map((a, i) => (
          <div key={a.question_id} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs text-muted-foreground">Q{i + 1} · {a.questions?.subject || "General"}</div>
              <div className="flex items-center gap-2">
                {a.is_correct === true && <span className="flex items-center gap-1 text-xs text-success font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Correct</span>}
                {a.is_correct === false && <span className="flex items-center gap-1 text-xs text-destructive font-semibold"><XCircle className="h-3.5 w-3.5" /> Wrong</span>}
                {a.is_correct === null && <span className="text-xs text-muted-foreground">Skipped</span>}
                <Button size="sm" variant="ghost" onClick={() => bookmark(a.question_id)}><Bookmark className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="prose prose-sm max-w-none mb-3" dangerouslySetInnerHTML={{ __html: renderMath(a.questions?.question_text || "") }} />
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Your answer: <span className="font-mono text-foreground">{JSON.stringify(a.user_response)}</span></div>
              <div>Correct answer: <span className="font-mono text-success">{JSON.stringify(a.questions?.correct_answer)}</span></div>
              <div>Time: {a.time_spent_seconds}s · Marks: {a.marks_awarded}</div>
            </div>
            {a.questions?.solution && (
              <div className="mt-3 p-3 bg-muted/40 rounded-lg text-sm" dangerouslySetInnerHTML={{ __html: renderMath(a.questions.solution) }} />
            )}
          </div>
        ))}
      </div>
    </StudentLayout>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
        <Icon className={`h-4 w-4 ${accent || "text-muted-foreground"}`} />
      </div>
      <div className={`font-display text-xl font-semibold ${accent || ""}`}>{value}</div>
    </div>
  );
}

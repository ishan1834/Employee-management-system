



import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Flag, Eraser, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { renderMath } from "@/lib/math";
import { captureViolation, ViolationType } from "@/lib/proctoring";
import { ensureFaceModels, detectFaceState } from "@/lib/faceDetect";

interface QRow {
  id: string;
  position: number;
  section: string | null;
  questions: {
    id: string;
    question_text: string;
    q_type: "single" | "multi" | "integer" | "assertion_reason";
    options: { text: string }[] | null;
    correct_answer: unknown;
    positive_marks: number;
    negative_marks: number;
  };
}

interface TestRow { id: string; name: string; duration_minutes: number; positive_marks: number; negative_marks: number; }

type AnswerMap = Record<string, { response: unknown; markedForReview: boolean; visited: boolean; timeSpent: number }>;

export default function TestRun() {
  const { id, attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState<TestRow | null>(null);
  const [questions, setQuestions] = useState<QRow[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [remaining, setRemaining] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [showFsWarning, setShowFsWarning] = useState(false);
  const [fsCountdown, setFsCountdown] = useState(10);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastQTime = useRef<number>(Date.now());
  const submittedRef = useRef(false);

  // ---------- LOAD ----------
  useEffect(() => {
    if (!id || !attemptId) return;
    Promise.all([
      supabase.from("tests").select("*").eq("id", id).maybeSingle(),
      supabase.from("test_questions").select("id, position, section, questions(id, question_text, q_type, options, correct_answer, positive_marks, negative_marks)").eq("test_id", id).order("position"),
    ]).then(([tRes, qRes]) => {
      const t = tRes.data as TestRow | null;
      setTest(t);
      const qs = (qRes.data as unknown as QRow[]) || [];
      setQuestions(qs);
      const init: AnswerMap = {};
      qs.forEach((q) => { init[q.questions.id] = { response: null, markedForReview: false, visited: false, timeSpent: 0 }; });
      if (qs[0]) init[qs[0].questions.id].visited = true;
      setAnswers(init);
      if (t) setRemaining(t.duration_minutes * 60);
      setLoading(false);
    });
    if (user) {
      supabase.from("bookmarks").select("question_id").eq("user_id", user.id).then(({ data }) => {
        setBookmarked(new Set((data || []).map((b) => b.question_id)));
      });
    }
  }, [id, attemptId, user]);

  // ---------- TIMER ----------
  useEffect(() => {
    if (loading || submittedRef.current) return;
    const i = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { handleSubmit(true); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ---------- CAMERA + FULLSCREEN + FACE DETECTION ----------
  useEffect(() => {
    if (loading) return;
    let faceTimer: ReturnType<typeof setInterval> | null = null;
    let lastFaceState: string = "ok";
    let consecutiveBad = 0;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      } catch {
        toast.error("Camera not available");
        if (user && id && attemptId) captureViolation({ userId: user.id, testId: id, attemptId, type: "camera_off" }).then(bumpV);
      }
      try { await document.documentElement.requestFullscreen(); } catch { /* ignore */ }

      // Load face models in background, then start polling every 4s
      ensureFaceModels().then((ok) => {
        if (!ok || !videoRef.current) return;
        faceTimer = setInterval(async () => {
          if (submittedRef.current) return;
          const state = await detectFaceState(videoRef.current!);
          if (!state || state === "ok") { consecutiveBad = 0; lastFaceState = "ok"; return; }
          consecutiveBad++;
          // require 2 consecutive bad readings to avoid false positives
          if (consecutiveBad >= 2 && state !== lastFaceState && user && id && attemptId) {
            lastFaceState = state;
            captureViolation({
              userId: user.id, testId: id, attemptId,
              type: state as ViolationType, questionNumber: current + 1,
              videoEl: videoRef.current,
              metadata: { auto: true },
            }).then(bumpV);
          }
        }, 4000);
      });
    })();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (faceTimer) clearInterval(faceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const bumpV = useCallback(() => setViolationCount((c) => {
    const nc = c + 1;
    if (nc === 3) toast.error("Warning: 3 violations recorded. 2 more will auto-submit.");
    if (nc >= 5 && !submittedRef.current) { handleSubmit(true); }
    return nc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const logV = useCallback(async (type: ViolationType) => {
    if (!user || !id || !attemptId) return;
    await captureViolation({ userId: user.id, testId: id, attemptId, type, questionNumber: current + 1, videoEl: videoRef.current });
    bumpV();
  }, [user, id, attemptId, current, bumpV]);

  // ---------- EVENT BLOCKERS ----------
  useEffect(() => {
    if (loading) return;
    const onVis = () => { if (document.hidden) logV("tab_switch"); };
    const onBlur = () => logV("tab_switch");
    const onFs = () => {
      if (!document.fullscreenElement) {
        logV("fullscreen_exit");
        setShowFsWarning(true);
        setFsCountdown(10);
      } else {
        setShowFsWarning(false);
      }
    };
    const onCtx = (e: MouseEvent) => { e.preventDefault(); logV("right_click"); };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const blocked = ["c","v","a","x","z","p","s","f","u"].includes(k) && (e.ctrlKey || e.metaKey);
      const devTools = (e.ctrlKey && e.shiftKey && ["i","j","c"].includes(k)) || k === "f12";
      const refresh = k === "f5" || k === "f11";
      if (blocked || devTools || refresh) {
        e.preventDefault();
        if (devTools) logV("dev_tools");
        else if (k === "c" || k === "v" || k === "x") logV("copy_paste");
      }
    };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); logV("copy_paste"); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("keydown", onKey);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onCopy);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onCopy);
    };
  }, [loading, logV]);

  // FS warning countdown
  useEffect(() => {
    if (!showFsWarning) return;
    const i = setInterval(() => setFsCountdown((c) => c - 1), 1000);
    return () => clearInterval(i);
  }, [showFsWarning]);
  useEffect(() => {
    if (showFsWarning && fsCountdown <= 0) {
      document.documentElement.requestFullscreen().catch(() => { /* ignore */ });
      setShowFsWarning(false);
    }
  }, [fsCountdown, showFsWarning]);

  // ---------- ANSWER HANDLERS ----------
  const q = questions[current];
  const setResponse = (val: unknown) => {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.questions.id]: { ...a[q.questions.id], response: val } }));
  };
  const navigateTo = (idx: number) => {
    if (!questions[idx]) return;
    const now = Date.now();
    if (q) {
      const delta = Math.round((now - lastQTime.current) / 1000);
      setAnswers((a) => ({ ...a, [q.questions.id]: { ...a[q.questions.id], timeSpent: a[q.questions.id].timeSpent + delta } }));
    }
    lastQTime.current = now;
    setCurrent(idx);
    const nq = questions[idx];
    setAnswers((a) => ({ ...a, [nq.questions.id]: { ...a[nq.questions.id], visited: true } }));
  };
  const toggleMark = () => {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.questions.id]: { ...a[q.questions.id], markedForReview: !a[q.questions.id].markedForReview } }));
  };
  const clearResponse = () => setResponse(null);

  // ---------- SUBMIT ----------
  const handleSubmit = async (forced = false) => {
    if (submittedRef.current || !attemptId || !test) return;
    submittedRef.current = true;

    let score = 0; let correctCount = 0; let attempted = 0;
    const rows = questions.map((qq) => {
      const a = answers[qq.questions.id];
      const correct = qq.questions.correct_answer;
      let isCorrect: boolean | null = null;
      let marks = 0;
      if (a?.response !== null && a?.response !== undefined && a?.response !== "") {
        attempted++;
        if (qq.questions.q_type === "multi" && Array.isArray(correct) && Array.isArray(a.response)) {
          const cs = [...(correct as string[])].sort().join(",");
          const us = [...(a.response as string[])].sort().join(",");
          isCorrect = cs === us;
        } else {
          isCorrect = JSON.stringify(correct) === JSON.stringify(a.response);
        }
        if (isCorrect) { score += qq.questions.positive_marks || 4; correctCount++; }
        else score -= qq.questions.negative_marks || 0;
        marks = isCorrect ? (qq.questions.positive_marks || 4) : -(qq.questions.negative_marks || 0);
      }
      return {
        attempt_id: attemptId,
        question_id: qq.questions.id,
        user_response: (a?.response ?? null) as never,
        is_correct: isCorrect,
        marks_awarded: marks,
        time_spent_seconds: a?.timeSpent || 0,
        marked_for_review: a?.markedForReview || false,
        visited: a?.visited || false,
      };
    });

    const maxScore = questions.reduce((s, qq) => s + (qq.questions.positive_marks || 4), 0);
    const accuracy = attempted ? Math.round((correctCount / attempted) * 1000) / 10 : 0;
    const timeTaken = (test.duration_minutes * 60) - remaining;

    await supabase.from("answers").upsert(rows, { onConflict: "attempt_id,question_id" });
    await supabase.from("attempts").update({
      submitted_at: new Date().toISOString(),
      status: forced ? "auto_submitted" : "submitted",
      score: Math.max(0, score),
      max_score: maxScore,
      accuracy,
      time_taken_seconds: timeTaken,
      violation_count: violationCount,
      forced_submit: forced,
    }).eq("id", attemptId);

    // Reward reputation + update streak
    if (user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("reputation, current_streak, best_streak, last_activity_date")
        .eq("user_id", user.id)
        .maybeSingle();
      if (prof) {
        const repGain = Math.max(5, Math.round(Math.max(0, score)));
        const today = new Date().toISOString().slice(0, 10);
        const last = prof.last_activity_date;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        let streak = prof.current_streak ?? 0;
        if (last === today) {
          // already counted today
        } else if (last === yesterday) {
          streak = streak + 1;
        } else {
          streak = 1;
        }
        const best = Math.max(prof.best_streak ?? 0, streak);
        await supabase.from("profiles").update({
          reputation: (prof.reputation ?? 0) + repGain,
          current_streak: streak,
          best_streak: best,
          last_activity_date: today,
        }).eq("user_id", user.id);

        await supabase.from("notifications").insert({
          user_id: user.id,
          title: forced ? "Test auto-submitted" : "Test submitted ✓",
          body: `You scored ${Math.max(0, score)} / ${maxScore} (+${repGain} reputation).`,
          link: `/result/${attemptId}`,
          category: "test",
        });
      }
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { /* ignore */ });

    // Fire-and-forget result email via Brevo
    supabase.functions.invoke("send-result-email", { body: { attemptId } }).catch((e) => console.warn("email send failed", e));

    navigate(`/result/${attemptId}`);
  };

  const counts = useMemo(() => {
    let answered = 0, marked = 0, visited = 0;
    questions.forEach((qq) => {
      const a = answers[qq.questions.id];
      if (!a) return;
      if (a.response !== null && a.response !== undefined && a.response !== "") answered++;
      else if (a.markedForReview) marked++;
      else if (a.visited) visited++;
    });
    return { answered, marked, visited, notVisited: questions.length - answered - marked - visited };
  }, [answers, questions]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading test…</div>;
  if (!q) return <div className="min-h-screen flex items-center justify-center">No questions.</div>;

  const mins = Math.floor(remaining / 60); const secs = remaining % 60;
  const timerColor = remaining < 300 ? "text-destructive animate-timer-pulse" : remaining < 600 ? "text-primary" : "text-foreground";

  return (
    <div className="min-h-screen bg-background no-select" onCopy={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}>
      {/* TOP BAR */}
      <div className="sticky top-0 z-30 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="px-4 lg:px-6 h-14 flex items-center gap-4">
          <div className="font-display font-semibold truncate">{test?.name}</div>
          <div className="text-xs text-sidebar-foreground/60 hidden md:block">{q.section || "Section A"}</div>
          <div className="ml-auto flex items-center gap-3">
            <div className={`font-mono font-bold text-lg ${timerColor}`}>{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/20 text-destructive border border-destructive/30">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs font-bold">{violationCount}</span>
            </div>
            <div className="relative">
              <video ref={videoRef} autoPlay muted playsInline className="h-10 w-14 rounded object-cover bg-black" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-success animate-cam-dot" />
            </div>
            <Button size="sm" variant="destructive" onClick={() => setConfirmSubmit(true)}>Submit</Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-0">
        {/* QUESTION */}
        <div className="p-5 lg:p-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">Question {current + 1} of {questions.length}</div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={async () => {
                if (!user || !q) return;
                const qid = q.questions.id;
                if (bookmarked.has(qid)) {
                  await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("question_id", qid);
                  setBookmarked((s) => { const n = new Set(s); n.delete(qid); return n; });
                  toast.success("Removed bookmark");
                } else {
                  const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, question_id: qid, folder: "From tests" });
                  if (error) { toast.error(error.message); return; }
                  setBookmarked((s) => new Set(s).add(qid));
                  toast.success("Bookmarked");
                }
              }}>
                {bookmarked.has(q.questions.id) ? <BookmarkCheck className="h-3.5 w-3.5 mr-1 text-primary" /> : <Bookmark className="h-3.5 w-3.5 mr-1" />}
                {bookmarked.has(q.questions.id) ? "Saved" : "Bookmark"}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setReportOpen(true)}>
                <AlertOctagon className="h-3.5 w-3.5 mr-1" /> Report
              </Button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none mb-6 text-foreground" dangerouslySetInnerHTML={{ __html: renderMath(q.questions.question_text) }} />

          {/* Options */}
          <div className="space-y-2.5">
            {q.questions.q_type === "single" && (q.questions.options || []).map((opt, i) => (
              <label key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${answers[q.questions.id]?.response === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <input type="radio" name="opt" checked={answers[q.questions.id]?.response === i} onChange={() => setResponse(i)} className="h-4 w-4 accent-primary" />
                <span className="text-sm" dangerouslySetInnerHTML={{ __html: renderMath(opt.text) }} />
              </label>
            ))}
            {q.questions.q_type === "multi" && (q.questions.options || []).map((opt, i) => {
              const arr = (answers[q.questions.id]?.response as number[]) || [];
              const checked = arr.includes(i);
              return (
                <label key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <input type="checkbox" checked={checked} onChange={() => setResponse(checked ? arr.filter((x) => x !== i) : [...arr, i])} className="h-4 w-4 accent-primary" />
                  <span className="text-sm" dangerouslySetInnerHTML={{ __html: renderMath(opt.text) }} />
                </label>
              );
            })}
            {q.questions.q_type === "integer" && (
              <IntegerPad value={(answers[q.questions.id]?.response as string) || ""} onChange={setResponse} />
            )}
            {q.questions.q_type === "assertion_reason" && (q.questions.options || []).map((opt, i) => (
              <label key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${answers[q.questions.id]?.response === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <input type="radio" name="ar" checked={answers[q.questions.id]?.response === i} onChange={() => setResponse(i)} className="h-4 w-4 accent-primary" />
                <span className="text-sm" dangerouslySetInnerHTML={{ __html: renderMath(opt.text) }} />
              </label>
            ))}
          </div>

          {/* BOTTOM NAV */}
          <div className="flex items-center justify-between mt-8 gap-2 flex-wrap">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateTo(current - 1)} disabled={current === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button variant="outline" size="sm" onClick={toggleMark}>
                <Flag className="h-4 w-4 mr-1" /> {answers[q.questions.id]?.markedForReview ? "Unmark" : "Mark for Review"}
              </Button>
              <Button variant="outline" size="sm" onClick={clearResponse}>
                <Eraser className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
            <Button size="sm" onClick={() => navigateTo(current + 1)} disabled={current === questions.length - 1} className="bg-sidebar text-sidebar-foreground hover:bg-sidebar/90">
              Save & Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* PALETTE */}
        <aside className="border-l border-border bg-card p-4 lg:p-5 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] overflow-y-auto">
          <h4 className="font-display font-semibold mb-3 text-sm">Question Palette</h4>
          <div className="grid grid-cols-6 gap-1.5 mb-4">
            {questions.map((qq, i) => {
              const a = answers[qq.questions.id];
              const answered = a?.response !== null && a?.response !== undefined && a?.response !== "";
              let cls = "bg-muted text-muted-foreground";
              if (answered && a?.markedForReview) cls = "bg-success text-white ring-2 ring-primary";
              else if (answered) cls = "bg-success text-white";
              else if (a?.markedForReview) cls = "bg-primary text-primary-foreground";
              else if (a?.visited) cls = "bg-card border border-border text-foreground";
              return (
                <button key={qq.questions.id} onClick={() => navigateTo(i)} className={`h-8 rounded-md text-xs font-semibold ${cls} ${current === i ? "ring-2 ring-foreground" : ""}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] space-y-1.5 text-muted-foreground">
            <Legend color="bg-success" label={`Answered: ${counts.answered}`} />
            <Legend color="bg-primary" label={`Marked: ${counts.marked}`} />
            <Legend color="bg-card border border-border" label={`Visited: ${counts.visited}`} />
            <Legend color="bg-muted" label={`Not visited: ${counts.notVisited}`} />
          </div>
        </aside>
      </div>

      {/* FS WARNING */}
      <Dialog open={showFsWarning} onOpenChange={() => { /* locked */ }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Fullscreen exited</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Returning to fullscreen in {fsCountdown}s. Repeated exits will auto-submit your test.</p>
          <DialogFooter>
            <Button onClick={() => { document.documentElement.requestFullscreen().catch(() => { /* ignore */ }); setShowFsWarning(false); }}>
              Re-enter fullscreen now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM SUBMIT */}
      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit your test?</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <SubStat label="Answered" value={counts.answered} />
            <SubStat label="Marked" value={counts.marked} />
            <SubStat label="Visited" value={counts.visited} />
            <SubStat label="Not visited" value={counts.notVisited} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmit(false)}>Go back</Button>
            <Button onClick={() => handleSubmit(false)} className="bg-sidebar text-sidebar-foreground hover:bg-sidebar/90">Submit final</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REPORT ISSUE */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report an issue</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Tell us what's wrong with this question. Coordinators will review.</p>
          <Textarea value={reportText} onChange={(e) => setReportText(e.target.value)} rows={4} placeholder="e.g. Wrong correct answer, typo, image not loading…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!user || !reportText.trim() || !q) return;
              await supabase.from("violations").insert({
                user_id: user.id, test_id: id, attempt_id: attemptId,
                v_type: "other", question_number: current + 1,
                metadata: { kind: "question_report", question_id: q.questions.id, message: reportText } as never,
              });
              toast.success("Reported. Thanks!");
              setReportText(""); setReportOpen(false);
            }} className="bg-sidebar text-sidebar-foreground">Send report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <div className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${color}`} /> {label}</div>;
}
function SubStat({ label, value }: { label: string; value: number }) {
  return <div className="bg-muted/40 rounded-lg p-2.5"><div className="text-[10px] uppercase text-muted-foreground">{label}</div><div className="font-bold text-lg">{value}</div></div>;
}

function IntegerPad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const press = (k: string) => {
    if (k === "C") onChange("");
    else if (k === "⌫") onChange(value.slice(0, -1));
    else if (k === "-") onChange(value.startsWith("-") ? value.slice(1) : "-" + value);
    else if (k === ".") { if (!value.includes(".")) onChange(value + "."); }
    else onChange(value + k);
  };
  return (
    <div>
      <div className="px-4 py-3 border border-border rounded-xl bg-muted/40 font-mono text-lg mb-3 min-h-[48px]">{value || <span className="text-muted-foreground">Enter your answer</span>}</div>
      <div className="grid grid-cols-5 gap-2 max-w-sm">
        {["7","8","9","-","⌫","4","5","6",".","C","1","2","3","0",""].filter(Boolean).map((k) => (
          <button key={k} onClick={() => press(k)} className="h-12 rounded-lg border border-border bg-card hover:bg-muted font-semibold transition">{k}</button>
        ))}
      </div>
    </div>
  );
}

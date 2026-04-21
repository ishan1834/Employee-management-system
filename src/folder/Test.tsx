



import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, Mic, Wifi, Maximize, ShieldCheck, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface TestRow { id: string; name: string; description: string | null; instructions: string | null; duration_minutes: number; starts_at: string | null; ends_at: string | null; attempts_allowed: number | null; total_marks: number | null; password: string | null; proctoring_level: string; }

export default function TestIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState<TestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [stage, setStage] = useState<"intro" | "checklist" | "consent" | "starting">("intro");

  // Checklist state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camOk, setCamOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [netOk, setNetOk] = useState(false);
  const [fsOk, setFsOk] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [agree, setAgree] = useState(false);
  const [pw, setPw] = useState("");

  useEffect(() => {
    if (!id || !user) return;
    Promise.all([
      supabase.from("tests").select("*").eq("id", id).maybeSingle(),
      supabase.from("test_questions").select("id", { count: "exact", head: true }).eq("test_id", id),
      supabase.from("attempts").select("id", { count: "exact", head: true }).eq("test_id", id).eq("user_id", user.id).neq("status", "in_progress"),
    ]).then(([tRes, qRes, aRes]) => {
      const t = tRes.data as TestRow | null;
      setTest(t);
      setQuestionCount(qRes.count || 0);
      setAttemptCount(aRes.count || 0);

      if (!t) { setReason("Test not found."); setLoading(false); return; }
      const now = Date.now();
      if (t.starts_at && now < new Date(t.starts_at).getTime()) {
        setReason(`Test opens at ${new Date(t.starts_at).toLocaleString()}.`);
      } else if (t.ends_at && now > new Date(t.ends_at).getTime()) {
        setReason(`Test window closed on ${new Date(t.ends_at).toLocaleString()}.`);
      } else if ((t.attempts_allowed || 1) > 0 && (aRes.count || 0) >= (t.attempts_allowed || 1)) {
        setReason(`You have used all ${t.attempts_allowed} attempt(s).`);
      } else if ((qRes.count || 0) === 0) {
        setReason("This test has no questions assigned yet. Contact your coordinator.");
      }
      setLoading(false);
    });

    // Network check
    setNetOk(navigator.onLine);
    // Fullscreen API check
    setFsOk(typeof document.fullscreenEnabled === "boolean" ? document.fullscreenEnabled : false);
  }, [id, user]);

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamOk(true);
      toast.success("Camera ready");
    } catch {
      toast.error("Camera permission denied");
    }
  };

  const requestMic = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      setMicOk(true);
    } catch {
      toast.error("Mic permission denied (optional)");
    }
  };

  const startTest = async () => {
    if (!user || !test) return;
    if (test.password && pw !== test.password) { toast.error("Wrong test password"); return; }
    if (!camOk) { toast.error("Camera is required"); return; }
    if (!confirmName.trim()) { toast.error("Type your name to confirm"); return; }
    if (!agree) { toast.error("Please agree to the rules"); return; }

    setStage("starting");

    // Stop preview stream — runner will start its own
    const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks();
    tracks?.forEach((t) => t.stop());

    // Create attempt
    const { data: attempt, error } = await supabase
      .from("attempts")
      .insert({ user_id: user.id, test_id: test.id, max_score: test.total_marks || 0 })
      .select("id")
      .single();
    if (error || !attempt) { toast.error(error?.message || "Failed to start"); setStage("checklist"); return; }
    navigate(`/test/${test.id}/run/${attempt.id}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-hero-gradient">Loading…</div>;

  if (reason) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-elevated border border-border p-8 max-w-md text-center">
          <AlertTriangle className="h-10 w-10 text-warning mx-auto mb-3" />
          <h2 className="font-display text-xl mb-2">Cannot start test</h2>
          <p className="text-sm text-muted-foreground mb-6">{reason}</p>
          <Button onClick={() => navigate("/tests")} variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to tests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/tests")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> All tests
        </Button>
        <div className="bg-card rounded-2xl shadow-elevated border border-border p-7 lg:p-10">
          {stage === "intro" && (
            <>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-2">{test?.name}</h1>
              <p className="text-muted-foreground mb-6">{test?.description}</p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <Stat label="Duration" value={`${test?.duration_minutes}m`} />
                <Stat label="Questions" value={`${questionCount}`} />
                <Stat label="Total Marks" value={`${test?.total_marks ?? 0}`} />
                <Stat label="Attempts Used" value={`${attemptCount}/${test?.attempts_allowed ?? 1}`} />
              </div>

              {test?.instructions && (
                <div className="bg-muted/50 rounded-xl p-4 mb-6 text-sm whitespace-pre-line">{test.instructions}</div>
              )}

              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> This test is proctored</h3>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Camera and fullscreen will be required throughout.</li>
                  <li>Tab switches, dev-tools, and copy-paste will be flagged.</li>
                  <li>5 violations will auto-submit your attempt.</li>
                </ul>
              </div>

              <Button onClick={() => setStage("checklist")} className="w-full h-12 bg-sidebar text-sidebar-foreground hover:bg-sidebar/90">
                Continue to system check
              </Button>
            </>
          )}

          {stage === "checklist" && (
            <>
              <h2 className="font-display text-2xl mb-1">System Check</h2>
              <p className="text-sm text-muted-foreground mb-6">Verify your setup before starting.</p>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <CheckRow icon={Camera} label="Camera" ok={camOk} action={!camOk && <Button size="sm" onClick={requestCamera}>Allow</Button>} />
                  <CheckRow icon={Mic} label="Microphone (optional)" ok={micOk} action={!micOk && <Button size="sm" variant="outline" onClick={requestMic}>Allow</Button>} />
                  <CheckRow icon={Wifi} label="Internet" ok={netOk} />
                  <CheckRow icon={Maximize} label="Fullscreen support" ok={fsOk} />
                </div>
                <div>
                  <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-xl bg-muted aspect-video object-cover" />
                  <p className="text-[11px] text-muted-foreground mt-2 text-center">Live camera preview</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {test?.password && (
                  <Input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Test password" type="password" />
                )}
                <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder="Type your full name to confirm" />
                <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
                  <span>I will not switch tabs, exit fullscreen, or use unauthorized aids. I understand my session is monitored.</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStage("intro")}>Back</Button>
                <Button onClick={startTest} className="flex-1 bg-sidebar text-sidebar-foreground hover:bg-sidebar/90">
                  Start proctored test
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 text-center">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="font-display text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function CheckRow({ icon: Icon, label, ok, action }: { icon: React.ComponentType<{ className?: string }>; label: string; ok: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm flex-1">{label}</span>
      {ok ? <span className="text-xs text-success font-semibold">Ready</span> : action}
    </div>
  );
}

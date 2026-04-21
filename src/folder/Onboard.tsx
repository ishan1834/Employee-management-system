
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface Track { code: string; name: string; category: string | null; icon: string | null; }

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Reasoning", "GK", "Aptitude"];
const YEARS = [2026, 2027, 2028];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [primaryTrack, setPrimaryTrack] = useState("");
  const [secondaryTrack, setSecondaryTrack] = useState("");
  const [year, setYear] = useState(2026);
  const [bg, setBg] = useState("");
  const [goal, setGoal] = useState(2);
  const [weak, setWeak] = useState<string[]>([]);
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("exam_tracks").select("*").eq("enabled", true).then(({ data }) => setTracks(data || []));
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (profile?.onboarding_complete) navigate("/dashboard");
  }, [loading, user, profile, navigate]);

  const totalSteps = 5;
  const pct = ((step + 1) / totalSteps) * 100;

  const savePartial = async (final = false) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      primary_track: primaryTrack || null,
      secondary_track: secondaryTrack || null,
      target_year: year,
      education_background: bg || null,
      daily_goal_hours: goal,
      weak_subjects: weak,
      social_handle: handle || null,
      ...(final ? { onboarding_complete: true } : {}),
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return false; }
    await refreshProfile();
    return true;
  };

  const next = async () => {
    if (step === 0 && !primaryTrack) { toast.error("Pick a primary exam track"); return; }
    if (step === totalSteps - 1) {
      const ok = await savePartial(true);
      if (ok) { toast.success("Profile complete!"); navigate("/dashboard"); }
    } else {
      await savePartial(false);
      setStep(step + 1);
    }
  };

  const toggleWeak = (s: string) => setWeak(weak.includes(s) ? weak.filter((x) => x !== s) : [...weak, s]);

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-elevated border border-border p-7 lg:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-sidebar flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold">Set up your profile</div>
            <div className="text-xs text-muted-foreground">Step {step + 1} of {totalSteps}</div>
          </div>
        </div>
        <Progress value={pct} className="mb-8" />

        {step === 0 && (
          <div>
            <h2 className="font-display text-2xl mb-2">Which exam are you targeting?</h2>
            <p className="text-sm text-muted-foreground mb-5">Pick your primary track. You can add a secondary one too.</p>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Primary track</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 mb-5 max-h-64 overflow-auto pr-1">
              {tracks.map((t) => (
                <button key={t.code} onClick={() => setPrimaryTrack(t.code)} className={`p-3 rounded-xl border text-left text-sm transition ${primaryTrack === t.code ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <span className="text-base">{t.icon}</span> <span className="font-medium ml-1">{t.name}</span>
                </button>
              ))}
            </div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Secondary (optional)</Label>
            <select value={secondaryTrack} onChange={(e) => setSecondaryTrack(e.target.value)} className="w-full mt-2 px-3 py-2 rounded-xl border border-border bg-background text-sm">
              <option value="">— None —</option>
              {tracks.filter((t) => t.code !== primaryTrack).map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-display text-2xl mb-2">Target year?</h2>
            <p className="text-sm text-muted-foreground mb-5">When do you plan to write your exam?</p>
            <div className="grid grid-cols-3 gap-3">
              {YEARS.map((y) => (
                <button key={y} onClick={() => setYear(y)} className={`p-5 rounded-xl border text-center transition ${year === y ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <div className="font-display text-2xl font-bold">{y}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-2xl mb-2">Tell us about you</h2>
            <p className="text-sm text-muted-foreground mb-5">A line about your background helps us personalize.</p>
            <Label>Educational background</Label>
            <Input value={bg} onChange={(e) => setBg(e.target.value)} placeholder="e.g. Class 12, PCM, CBSE" className="mt-1.5" />
            <Label className="mt-4 block">Daily study goal (hours)</Label>
            <Input type="number" min={0.5} max={16} step={0.5} value={goal} onChange={(e) => setGoal(parseFloat(e.target.value) || 0)} className="mt-1.5 max-w-[140px]" />
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl mb-2">Where do you struggle?</h2>
            <p className="text-sm text-muted-foreground mb-5">Pick your weak subjects so we can recommend tests.</p>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button key={s} onClick={() => toggleWeak(s)} className={`px-3.5 py-1.5 rounded-full text-sm border transition ${weak.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-2xl mb-2">Almost done!</h2>
            <p className="text-sm text-muted-foreground mb-5">Add a social handle for the leaderboard (optional).</p>
            <Label>Display handle</Label>
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@username" className="mt-1.5" />
          </div>
        )}

        <div className="flex justify-between mt-8 gap-3">
          <Button variant="outline" disabled={step === 0 || saving} onClick={() => setStep(step - 1)}>Back</Button>
          <Button onClick={next} disabled={saving} className="bg-sidebar text-sidebar-foreground hover:bg-sidebar/90">
            {step === totalSteps - 1 ? "Finish setup" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

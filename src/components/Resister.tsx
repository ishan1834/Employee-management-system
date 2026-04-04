



import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, Check, X as XIcon, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const isUrl = (s: string) => typeof s === "string" && (s.startsWith("http") || s.startsWith("/"));

// Fallback icons per track name
const TRACK_FALLBACK: Record<string, string> = {
  "Web Development": "🌐",
  "App Development": "📱",
  "AI & Machine Learning": "🤖",
  "Cybersecurity": "🔐",
  "Digital Marketing": "📣",
  "Cloud & DevOps": "☁️",
};

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const FEE = 300;

const Register = () => {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", college: "", branch: "", year: "",
    track: "", referral: "", password: "", confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [referralStatus, setReferralStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [referralMsg, setReferralMsg] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("tracks").select("*").eq("status", "active").order("display_order").then(({ data }) => {
      if (data) setTracks(data);
    });
  }, []);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const checkReferral = async (code: string) => {
    if (!code.trim()) { setReferralStatus("idle"); setReferralDiscount(0); setReferralMsg(""); return; }
    setReferralStatus("checking");
    const { data } = await supabase.from("referral_codes").select("*").eq("code", code.toUpperCase()).eq("is_active", true).maybeSingle();
    if (!data) { setReferralStatus("invalid"); setReferralMsg("This referral code doesn't exist"); setReferralDiscount(0); return; }
    if (data.max_uses && (data.used_count || 0) >= data.max_uses) { setReferralStatus("invalid"); setReferralMsg("This code has reached its usage limit"); setReferralDiscount(0); return; }
    const discount = data.discount_amount || Math.round(FEE * (data.discount_percent || 0) / 100);
    setReferralDiscount(discount);
    setReferralStatus("valid");
    setReferralMsg(`Code applied — you save ₹${discount}`);
  };

  const clearReferral = () => { update("referral", ""); setReferralStatus("idle"); setReferralDiscount(0); setReferralMsg(""); };

  const strength = () => {
    const p = form.password; let s = 0;
    if (p.length >= 6) s++; if (p.length >= 10) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strengthColor = () => { const s = strength(); if (s <= 1) return "bg-red-500"; if (s <= 3) return "bg-amber-400"; return "bg-emerald-500"; };
  const strengthLabel = () => { const s = strength(); if (!form.password) return ""; if (s <= 1) return "Weak"; if (s <= 3) return "Fair"; return "Strong"; };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (form.password.length < 6) { toast({ title: "Password too short", description: "Minimum 6 characters required.", variant: "destructive" }); return; }
    setLoading(true);
    const batchMap: Record<string, string> = { "Web Development": "WD-A", "App Development": "AD-A", "AI & Machine Learning": "AI-A", "Cybersecurity": "CS-A", "Digital Marketing": "DM-A", "Cloud & DevOps": "CD-A" };
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.fullName, phone: form.phone, college: form.college, branch: form.branch, year: form.year, track: form.track, referral_code_used: form.referral.toUpperCase() } },
    });
    if (error) { toast({ title: "Registration Failed", description: error.message, variant: "destructive" }); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").update({
        full_name: form.fullName, phone: form.phone, college: form.college, branch: form.branch,
        year: form.year, track: form.track, batch: batchMap[form.track] || "GEN-A", referral_code_used: form.referral.toUpperCase(),
      }).eq("id", data.user.id);
      if (form.referral.trim() && referralStatus === "valid") {
        const { data: codeData } = await supabase.from("referral_codes").select("*").eq("code", form.referral.toUpperCase()).maybeSingle();
        if (codeData) {
          await supabase.from("referral_codes").update({ used_count: (codeData.used_count || 0) + 1 }).eq("id", codeData.id);
          if (codeData.owner_user_id) {
            const discount = codeData.discount_amount || Math.round(300 * (codeData.discount_percent || 0) / 100);
            await supabase.from("referral_earnings").insert({
              referrer_user_id: codeData.owner_user_id, referred_user_id: data.user.id,
              referral_code: form.referral.toUpperCase(), amount_saved: discount,
              commission_earned: Math.round(discount * 0.5), status: "pending",
            });
          }
        }
      }
      toast({ title: `Welcome aboard, ${form.fullName.split(" ")[0]}! 🎉`, description: "Your account is ready." });
      setLoading(false);
      navigate("/dashboard");
    }
  };

  // Section label
  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/70 mb-3">{children}</p>
  );

  // Shared input class
  const inputCls = [
    "w-full px-4 py-3 rounded-xl",
    "bg-white/[0.04] border border-white/10",
    "text-foreground text-sm placeholder:text-muted-foreground/40",
    "focus:outline-none focus:border-primary/60 focus:bg-white/[0.06]",
    "transition-all duration-200",
  ].join(" ");

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-14">
      {/* Subtle ambient bg blobs — no motion, pure CSS */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="gradient-text text-3xl font-black tracking-widest inline-block mb-2">
            THRYNTERN
          </Link>
          <p className="text-muted-foreground text-sm">Join the internship program — create your account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">

          {/* Top accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <form onSubmit={handleRegister} className="p-7 space-y-7">

            {/* ── Personal Info ── */}
            <div className="space-y-3">
              <SectionLabel>Personal Info</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">Full Name</label>
                  <input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)}
                    className={inputCls} placeholder="Your full name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">Email</label>
                  <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)}
                    className={inputCls} placeholder="you@email.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">Phone</label>
                  <input type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)}
                    className={inputCls} placeholder="+91 9876543210" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">College</label>
                  <input required value={form.college} onChange={(e) => update("college", e.target.value)}
                    className={inputCls} placeholder="College name" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground/80">Branch</label>
                  <input required value={form.branch} onChange={(e) => update("branch", e.target.value)}
                    className={inputCls} placeholder="CSE / ECE / ME / etc." />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.07]" />

            {/* ── Year of Study ── */}
            <div className="space-y-3">
              <SectionLabel>Year of Study</SectionLabel>
              <div className="grid grid-cols-4 gap-2">
                {YEARS.map((y) => (
                  <button
                    key={y} type="button"
                    onClick={() => update("year", y)}
                    className={[
                      "py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200",
                      form.year === y
                        ? "bg-primary/15 border-primary/60 text-primary shadow-sm shadow-primary/10"
                        : "bg-white/[0.03] border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground",
                    ].join(" ")}
                  >
                    {y.replace(" Year", "")}
                    <span className="block text-[10px] font-normal opacity-60">Year</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.07]" />

            {/* ── Internship Track ── */}
            <div className="space-y-3">
              <SectionLabel>Choose Your Track</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tracks.map((t) => {
                  const selected = form.track === t.name;
                  const fallbackEmoji = TRACK_FALLBACK[t.name] || "💻";
                  return (
                    <button
                      key={t.name} type="button"
                      onClick={() => update("track", t.name)}
                      className={[
                        "relative flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-left",
                        "transition-all duration-200 group overflow-hidden",
                        selected
                          ? "bg-primary/10 border-primary/50 shadow-sm shadow-primary/10"
                          : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]",
                      ].join(" ")}
                    >
                      {/* Glow on selected */}
                      {selected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/8 to-transparent pointer-events-none" />
                      )}

                      {/* Icon box */}
                      <div className={[
                        "relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
                        "border transition-all duration-200",
                        selected
                          ? "bg-primary/20 border-primary/40"
                          : "bg-white/[0.05] border-white/10 group-hover:border-white/20",
                      ].join(" ")}>
                        {isUrl(t.icon) ? (
                          <img
                            src={t.icon}
                            alt={t.name}
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = "none";
                              const span = document.createElement("span");
                              span.className = "text-base";
                              span.textContent = fallbackEmoji;
                              img.parentElement?.appendChild(span);
                            }}
                          />
                        ) : (
                          <span className="text-base leading-none">{t.icon || fallbackEmoji}</span>
                        )}
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate transition-colors ${selected ? "text-primary" : "text-foreground"}`}>
                          {t.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">{t.difficulty}</p>
                      </div>

                      {/* Check */}
                      <div className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${
                        selected ? "bg-primary border-primary" : "border-white/20"
                      }`}>
                        {selected && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>


export default Register;

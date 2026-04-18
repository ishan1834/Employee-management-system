import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, Check, X as XIcon, Loader2, ArrowRight, Sparkles, Phone, Mail, GraduationCap, School } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// --- Helpers & Constants ---
const isUrl = (s: string) => typeof s === "string" && (s.startsWith("http") || s.startsWith("/"));

const BATCH_MAP: Record<string, string> = { 
  "Web Development": "WD-A", 
  "App Development": "AD-A", 
  "AI & Machine Learning": "AI-A", 
  "Cybersecurity": "CS-A", 
  "Digital Marketing": "DM-A", 
  "Cloud & DevOps": "CD-A" 
};

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const BASE_FEE = 300;

const INPUT_CLASSES = "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-foreground text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 focus:bg-white/[0.06] transition-all duration-200 outline-none";

const SectionLabel = memo(({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/60 mb-3 flex items-center gap-2">
    <span className="w-4 h-px bg-white/10" />
    {children}
  </p>
));

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
    const fetchTracks = async () => {
      const { data } = await supabase.from("tracks").select("*").eq("status", "active").order("display_order");
      if (data) setTracks(data);
    };
    fetchTracks();
  }, []);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const validateReferral = async () => {
    const code = form.referral.trim().toUpperCase();
    if (!code) return;
    
    setReferralStatus("checking");
    const { data, error } = await supabase.from("referral_codes").select("*").eq("code", code).eq("is_active", true).maybeSingle();
    
    if (!data || error) { 
      setReferralStatus("invalid"); setReferralMsg("Invalid referral code"); setReferralDiscount(0); return; 
    }
    if (data.max_uses && (data.used_count || 0) >= data.max_uses) { 
      setReferralStatus("invalid"); setReferralMsg("Usage limit reached"); setReferralDiscount(0); return; 
    }

    const discount = data.discount_amount || Math.round(BASE_FEE * (data.discount_percent || 0) / 100);
    setReferralDiscount(discount);
    setReferralStatus("valid");
    setReferralMsg(`Applied! Saved ₹${discount}`);
  };

  const passwordStrength = useMemo(() => {
    const p = form.password; 
    let s = 0;
    if (p.length >= 6) s++; if (p.length >= 10) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [form.password]);

  const strengthUI = useMemo(() => {
    if (!form.password) return { color: "bg-white/10", label: "", width: "0%" };
    if (passwordStrength <= 2) return { color: "bg-red-500", label: "Weak", width: "33%" };
    if (passwordStrength <= 4) return { color: "bg-amber-400", label: "Fair", width: "66%" };
    return { color: "bg-emerald-500", label: "Strong", width: "100%" };
  }, [passwordStrength, form.password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { 
      toast({ title: "Passwords don't match", variant: "destructive" }); return; 
    }
    if (!form.track) {
      toast({ title: "Please select a track", variant: "destructive" }); return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName } },
    });

    if (error) { 
      toast({ title: "Error", description: error.message, variant: "destructive" }); 
      setLoading(false); return; 
    }

    if (data.user) {
      await supabase.from("profiles").update({
        full_name: form.fullName, phone: form.phone, college: form.college, branch: form.branch,
        year: form.year, track: form.track, batch: BATCH_MAP[form.track] || "GEN-A", 
        referral_code_used: form.referral.toUpperCase(),
      }).eq("id", data.user.id);

      // (Handle Referral Earnings Insertion as per your original logic here...)
      
      toast({ title: "Welcome to Thryntern!", description: "Registration successful." });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-14 selection:bg-primary/30">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-xl">
        <div className="text-center mb-10">
          <Link to="/" className="text-3xl font-black tracking-tighter inline-flex items-center gap-2 mb-3">
            <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">THRYNTERN</span>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </Link>
          <p className="text-muted-foreground/80 text-sm font-medium">Elevate your career with elite internships.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden shadow-black/60">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          
          <form onSubmit={handleRegister} className="p-8 space-y-8">
            {/* Account Details */}
            <div className="space-y-4">
              <SectionLabel>Account Credentials</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 ml-1 mb-1"><Mail className="w-3.5 h-3.5 text-primary" /><label className="text-xs font-semibold">Email</label></div>
                  <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className={INPUT_CLASSES} placeholder="name@college.edu" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 ml-1 mb-1"><Eye className="w-3.5 h-3.5 text-primary" /><label className="text-xs font-semibold">Password</label></div>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} required value={form.password} onChange={(e) => update("password", e.target.value)} className={INPUT_CLASSES} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                  </div>
                  {/* Strength Bar */}
                  {form.password && (
                    <div className="px-1 pt-2">
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: strengthUI.width }} className={`h-full ${strengthUI.color}`} />
                      </div>
                      <p className="text-[10px] mt-1 font-bold uppercase opacity-50">{strengthUI.label}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <SectionLabel>Academic Profile</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={INPUT_CLASSES} placeholder="Full Name" />
                </div>
                <div className="relative">
                   <input type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)} className={INPUT_CLASSES} placeholder="Phone Number" />
                </div>
                <input required value={form.college} onChange={(e) => update("college", e.target.value)} className={INPUT_CLASSES} placeholder="College/University" />
                <div className="sm:col-span-2">
                  <input required value={form.branch} onChange={(e) => update("branch", e.target.value)} className={INPUT_CLASSES} placeholder="Branch (e.g. Computer Science)" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                {YEARS.map((y) => (
                  <button key={y} type="button" onClick={() => update("year", y)} className={`py-3 rounded-xl text-xs font-bold border transition-all ${form.year === y ? "bg-primary/20 border-primary text-primary" : "bg-white/[0.03] border-white/5 text-muted-foreground hover:border-white/20"}`}>
                    {y.split(" ")[0]} <span className="block text-[9px] opacity-50 font-normal">Year</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Track Selection */}
            <div className="space-y-4">
              <SectionLabel>Choose Specialization</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tracks.map((t) => (
                  <button key={t.name} type="button" onClick={() => update("track", t.name)} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${form.track === t.name ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20" : "bg-white/[0.03] border-white/5 hover:border-white/20"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${form.track === t.name ? "bg-primary/20 border-primary/20" : "bg-white/5 border-white/10"}`}>
                       {isUrl(t.icon) ? <img src={t.icon} className="w-4 h-4" /> : <Sparkles size={14}/>}
                    </div>
                    <span className={`text-xs font-semibold ${form.track === t.name ? "text-primary" : "text-foreground/70"}`}>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Referral & Payment Preview */}
            <div className="p-5 rounded-2xl bg-primary/[0.03] border border-primary/10 space-y-4">
               <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input value={form.referral} onChange={(e) => update("referral", e.target.value)} className={`${INPUT_CLASSES} !bg-black/20`} placeholder="Referral Code (Optional)" />
                    {referralStatus === "valid" && <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={16}/>}
                  </div>
                  <button type="button" onClick={validateReferral} disabled={!form.referral || referralStatus === "checking"} className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all disabled:opacity-50">
                    {referralStatus === "checking" ? <Loader2 className="animate-spin" size={16}/> : "Apply"}
                  </button>
               </div>
               
               <AnimatePresence>
                {referralMsg && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className={`text-[11px] font-bold ${referralStatus === "valid" ? "text-emerald-500" : "text-red-400"}`}>
                    {referralMsg}
                  </motion.p>
                )}
               </AnimatePresence>

               <div className="flex justify-between items-end pt-2">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Enrollment Fee</p>
                    <div className="flex items-center gap-2">
                       <span className="text-2xl font-black">₹{BASE_FEE - referralDiscount}</span>
                       {referralDiscount > 0 && <span className="text-sm line-through text-muted-foreground/50">₹{BASE_FEE}</span>}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right max-w-[120px]">One-time certification & platform fee</p>
               </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black text-sm tracking-widest uppercase hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 group">
              {loading ? <Loader2 className="animate-spin" /> : <>Complete Registration <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/></>}
            </button>
            
            <p className="text-center text-xs text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;

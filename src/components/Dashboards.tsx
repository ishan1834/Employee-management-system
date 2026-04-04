



import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderGit2, Upload, Award, Megaphone, User, HelpCircle, LogOut, Bell, Menu, X,
  Clock, Lock, Github, IndianRupee, Trophy, Camera, ExternalLink, CheckCircle2, Send, Home,
  BookOpen, Copy, Share2, Gift, Star, Zap, ChevronDown, ChevronUp, Loader2, Check, RefreshCw, Download, Ban,
  FileText, Flame, Target, TrendingUp, Medal, Sparkles, Crown, MessageSquare, ShieldCheck, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const UPI_ID = "utsavratan@ybl";
const CERTIFICATE_FEE = 300;
const DOMAIN = "thryntern.in";
const WHATSAPP_COMMUNITY_LINK = "https://chat.whatsapp.com/JkxY2oRrpf83iYT0OM91t4?mode=gi_t";

const ALL_SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", key: "dashboard" },
  { icon: FolderGit2, label: "My Projects", key: "projects" },
  { icon: BookOpen, label: "Resources", key: "resources" },
  { icon: Trophy, label: "Leaderboard", key: "leaderboard" },
  { icon: IndianRupee, label: "Payment", key: "payment" },
  { icon: FileText, label: "Offer Letter", key: "offer-letter" },
  { icon: Award, label: "Certificates", key: "certificate" },
  { icon: Megaphone, label: "Announcements", key: "announcements" },
  { icon: Bell, label: "Notifications", key: "notifications" },
  { icon: User, label: "Profile", key: "profile" },
  { icon: HelpCircle, label: "Support", key: "support" },
];

const bottomNavItems = [
  { icon: FolderGit2, label: "Projects", key: "projects" },
  { icon: Trophy, label: "Board", key: "leaderboard" },
  { icon: Home, label: "Home", key: "dashboard", isCenter: true },
  { icon: Bell, label: "Alerts", key: "notifications" },
  { icon: User, label: "Profile", key: "profile" },
];

const toIST = (d: string) => new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const toISTDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const Dashboard = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, { github: string; demo: string; notes: string }>>({});
  const [profileForm, setProfileForm] = useState({ linkedin: "", github: "", full_name: "", phone: "", college: "", branch: "", year: "", bio: "", portfolio_url: "" });
  const [supportMsg, setSupportMsg] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [paymentTxn, setPaymentTxn] = useState("");
  const [uploading, setUploading] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [couponMsg, setCouponMsg] = useState("");
  const [ambassadorApp, setAmbassadorApp] = useState<any>(null);
  const [ambassadorReferrals, setAmbassadorReferrals] = useState<any[]>([]);
  const [ambassadorEarnings, setAmbassadorEarnings] = useState<any[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<any[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);
  const [whatsappLink, setWhatsappLink] = useState(WHATSAPP_COMMUNITY_LINK);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (!loading && profile && (!profile.phone || !profile.college || !profile.track)) navigate("/onboarding");
  }, [loading, user, profile, navigate]);

  const checkCoupon = async (code: string) => {
    if (!code.trim()) { setCouponStatus("idle"); setReferralDiscount(0); setCouponMsg(""); return; }
    setCouponStatus("checking");
    const { data } = await supabase.from("referral_codes").select("*").eq("code", code.toUpperCase()).eq("is_active", true).maybeSingle();
    if (!data) { setCouponStatus("invalid"); setCouponMsg("Invalid coupon code"); setReferralDiscount(0); return; }
    if (data.max_uses && (data.used_count || 0) >= data.max_uses) { setCouponStatus("invalid"); setCouponMsg("This code has reached its usage limit"); setReferralDiscount(0); return; }
    const discount = data.discount_amount || Math.round(CERTIFICATE_FEE * (data.discount_percent || 0) / 100);
    setReferralDiscount(discount);
    setCouponStatus("valid");
    setCouponMsg(`Coupon applied — you save ₹${discount}`);
  };

  const applyCoupon = async () => {
    if (couponStatus !== "valid" || !couponCode.trim() || !user) return;
    await supabase.from("profiles").update({ referral_code_used: couponCode.toUpperCase() }).eq("id", user.id);
    // Update referral earnings
    const { data: codeData } = await supabase.from("referral_codes").select("*").eq("code", couponCode.toUpperCase()).maybeSingle();
    if (codeData) {
      await supabase.from("referral_codes").update({ used_count: (codeData.used_count || 0) + 1 }).eq("id", codeData.id);
      if (codeData.owner_user_id) {
        const discount = codeData.discount_amount || Math.round(CERTIFICATE_FEE * (codeData.discount_percent || 0) / 100);
        await supabase.from("referral_earnings").insert({
          referrer_user_id: codeData.owner_user_id, referred_user_id: user.id,
          referral_code: couponCode.toUpperCase(), amount_saved: discount,
          commission_earned: Math.round(discount * 0.5), status: "pending",
        });
      }
    }
    await refreshProfile();
  };

  // Fetch existing coupon discount from profile
  useEffect(() => {
    const fetchDiscount = async () => {
      if (!profile?.referral_code_used) { setReferralDiscount(0); return; }
      const { data } = await supabase.from("referral_codes").select("*").eq("code", profile.referral_code_used).maybeSingle();
      if (data) {
        const d = data.discount_amount || Math.round(CERTIFICATE_FEE * (data.discount_percent || 0) / 100);
        setReferralDiscount(d);
        setCouponCode(profile.referral_code_used);
        setCouponStatus("valid");
        setCouponMsg(`Coupon applied — you save ₹${d}`);
      }
    };
    fetchDiscount();
  }, [profile?.referral_code_used]);

  // Fetch WhatsApp community link from program_settings
  useEffect(() => {
    supabase.from("program_settings").select("value").eq("key", "whatsapp_community_link").maybeSingle().then(({ data }) => {
      if (data?.value) setWhatsappLink(data.value);
    });
  }, []);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [projRes, subRes, annRes, notRes, profilesRes, allSubsRes, resRes, badgeRes, ubRes, payRes, tcRes, wtRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("project_submissions").select("*").eq("user_id", user.id),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id, full_name, avatar_url, track, college, points"),
      supabase.from("project_submissions").select("*"),
      supabase.from("track_resources").select("*").order("week_number"),
      supabase.from("badges").select("*"),
      supabase.from("user_badges").select("*, badges(*)").eq("user_id", user.id),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("task_completions").select("*").eq("user_id", user.id),
      supabase.from("weekly_tasks").select("*"),
    ]);
    if (projRes.data) setProjects(projRes.data.filter((p: any) => !p.assigned_track || p.assigned_track === profile?.track || p.assigned_track === ""));
    if (subRes.data) setUserSubmissions(subRes.data);
    if (annRes.data) setAnnouncements(annRes.data);
    if (notRes.data) setNotifications(notRes.data);
    if (profilesRes.data) setAllProfiles(profilesRes.data);
    if (allSubsRes.data) setAllSubmissions(allSubsRes.data);
    if (resRes.data) setResources(resRes.data);
    if (badgeRes.data) setBadges(badgeRes.data);
    if (ubRes.data) setUserBadges(ubRes.data);
    if (payRes.data) setMyPayments(payRes.data);
    if (tcRes.data) setTaskCompletions(tcRes.data);
    if (wtRes.data) setWeeklyTasks(wtRes.data);

    const { data: ambApp } = await supabase.from("ambassador_applications").select("*").eq("user_id", user.id).maybeSingle();
    setAmbassadorApp(ambApp);
    if (ambApp?.status === "approved" && ambApp.ambassador_code) {
      const [refUsers, refEarnings] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, payment_status, created_at").eq("referral_code_used", ambApp.ambassador_code),
        supabase.from("referral_earnings").select("*").eq("referral_code", ambApp.ambassador_code),
      ]);
      if (refUsers.data) setAmbassadorReferrals(refUsers.data);
      if (refEarnings.data) setAmbassadorEarnings(refEarnings.data);
    }
  }, [user, profile?.track]);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);
  useEffect(() => { if (!user) return; const i = setInterval(fetchAll, 5000); return () => clearInterval(i); }, [user, fetchAll]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel('user-notifs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (p) => {
      setNotifications(prev => [p.new as any, ...prev]);
      toast({ title: (p.new as any).title, description: (p.new as any).message });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    if (profile) setProfileForm({ linkedin: profile.linkedin_url || "", github: profile.github_url || "", full_name: profile.full_name || "", phone: profile.phone || "", college: profile.college || "", branch: profile.branch || "", year: profile.year || "", bio: profile.bio || "", portfolio_url: profile.portfolio_url || "" });
  }, [profile]);

  const submitProject = async (projectId: string) => {
    const sub = submissions[projectId];
    if (!sub?.github || !sub.github.includes("github.com")) { toast({ title: "Invalid GitHub URL", variant: "destructive" }); return; }
    const { error } = await supabase.from("project_submissions").upsert({ user_id: user!.id, project_id: projectId, github_url: sub.github, demo_url: sub.demo || "", notes: sub.notes || "", status: "submitted" }, { onConflict: "user_id,project_id" });
    if (error) toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Project Submitted! 🎉" }); setExpandedProject(null); fetchAll(); }
  };

  const actualCertFee = Math.max(0, CERTIFICATE_FEE - referralDiscount);
  const hasReferral = referralDiscount > 0;

  const submitPayment = async () => {
    if (!user || !paymentTxn.trim()) { toast({ title: "Enter your transaction ID", variant: "destructive" }); return; }
    const { error } = await supabase.from("payments").insert({ user_id: user.id, transaction_id: paymentTxn, amount: actualCertFee, status: "pending" });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Payment Submitted!" }); setPaymentTxn(""); fetchAll(); }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) { toast({ title: "Upload Failed", variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    await refreshProfile();
    setUploading(false);
    toast({ title: "Avatar updated! ✨" });
  };

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ full_name: profileForm.full_name, phone: profileForm.phone, college: profileForm.college, branch: profileForm.branch, year: profileForm.year, linkedin_url: profileForm.linkedin, github_url: profileForm.github, bio: profileForm.bio, portfolio_url: profileForm.portfolio_url }).eq("id", user.id);
    await refreshProfile();
    toast({ title: "Profile Updated! ✅" });
  };

  const sendSupport = async () => {
    if (!user || !supportMsg.trim()) return;
    await supabase.from("support_messages").insert({ user_id: user.id, message: supportMsg });
    setSupportMsg("");
    toast({ title: "Message Sent!" });
  };

  const markNotifRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user || !profile) return null;

  // Suspension check
  if ((profile as any).is_suspended) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center glass-card-static p-8 rounded-3xl border border-destructive/40 bg-destructive/5">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
            <Ban className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">Account Suspended</h2>
          <p className="text-sm text-muted-foreground mb-4">Your account has been suspended by the coordinator.</p>
          {(profile as any).suspended_reason && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-6">
              <p className="text-sm font-semibold text-destructive">Reason:</p>
              <p className="text-sm text-foreground mt-1">{(profile as any).suspended_reason}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mb-6">Contact support at support@{DOMAIN} for assistance.</p>
          <button onClick={signOut} className="gradient-button px-6 py-3 rounded-lg text-sm font-bold text-primary-foreground w-full">Sign Out</button>
        </div>
      </div>
    );
  }

  // Approval gate - show pending approval screen with WhatsApp community link
  if (!(profile as any).is_approved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center glass-card-static p-8 rounded-3xl border border-yellow-500/40 bg-yellow-500/5">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">Account Pending Approval</h2>
          <p className="text-sm text-muted-foreground mb-2">Your registration is being reviewed by our team. You'll get access once approved.</p>
          <p className="text-xs text-muted-foreground mb-6">This usually takes 24-48 hours.</p>
          
          <div className="space-y-3 mb-6">
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-left space-y-2">
              <p className="text-sm font-bold text-foreground">📋 Your Details</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-medium">{profile.full_name}</span></div>
                <div><span className="text-muted-foreground">Track:</span> <span className="text-foreground font-medium">{profile.track}</span></div>
                <div><span className="text-muted-foreground">College:</span> <span className="text-foreground font-medium">{profile.college}</span></div>
                <div><span className="text-muted-foreground">ID:</span> <span className="text-foreground font-medium">{profile.intern_id || "Pending"}</span></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
              className="w-full py-3 rounded-xl text-sm font-bold text-foreground bg-green-500/15 border border-green-500/40 hover:bg-green-500/25 transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              Join WhatsApp Community
            </a>
            <button onClick={signOut} className="w-full py-3 rounded-xl text-sm font-semibold text-muted-foreground border border-border hover:bg-secondary/50 transition-colors">Sign Out</button>
          </div>
        </motion.div>
      </div>
    );
  }

  const visibleTabs: string[] = (profile as any).visible_tabs || ALL_SIDEBAR_ITEMS.map(i => i.key);
  const sidebarItems = ALL_SIDEBAR_ITEMS.filter(i => visibleTabs.includes(i.key));

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const leaderboard = allProfiles.filter(p => p.track === profile.track).map(p => {
    const subs = allSubmissions.filter((s: any) => s.user_id === p.id && s.score != null);
    const totalScore = subs.reduce((acc: number, s: any) => acc + (s.score || 0), 0);
    return { ...p, totalScore, submissionCount: subs.length };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const myRank = leaderboard.findIndex(l => l.id === user.id) + 1;
  const submittedProjects = userSubmissions.length;
  const approvedProjects = userSubmissions.filter(s => s.status === "approved" || s.status === "reviewed").length;
  const totalProjects = projects.length;
  const progressPercent = totalProjects > 0 ? Math.round((submittedProjects / totalProjects) * 100) : 0;

  const inputCls = "w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-colors";

  const streakDays = profile.streak_days || 0;
  const points = profile.points || 0;
  const level = points < 50 ? "Rookie" : points < 150 ? "Explorer" : points < 300 ? "Builder" : points < 500 ? "Pro" : "Legend";
  const levelProgress = points < 50 ? (points / 50) * 100 : points < 150 ? ((points - 50) / 100) * 100 : points < 300 ? ((points - 150) / 150) * 100 : points < 500 ? ((points - 300) / 200) * 100 : 100;

  const getCertificateUrl = () => {
    if (!profile.certificate_url) return "";
    if (profile.certificate_url.startsWith("https://") && !profile.certificate_url.includes(DOMAIN)) {
      const path = profile.certificate_url.split("/storage/v1/object/public/")[1];
      if (path) return `https://${DOMAIN}/files/${path}`;
    }
    return profile.certificate_url;
  };

  const getOfferLetterUrl = () => {
    const url = (profile as any).offer_letter_url;
    if (!url) return "";
    if (url.startsWith("https://") && !url.includes(DOMAIN)) {
      const path = url.split("/storage/v1/object/public/")[1];
      if (path) return `https://${DOMAIN}/files/${path}`;
    }
    return url;
  };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-xl" />
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative p-4 sm:p-6 lg:p-10 border border-border/30 glass-card-static">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-3xl lg:text-5xl font-black text-foreground mb-1 leading-tight">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {profile.full_name?.split(" ")[0]}! 👋</h2>
                  <p className="text-muted-foreground text-xs sm:text-sm">Welcome back to your internship journey</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border border-primary/30">
                    <span className="text-lg sm:text-xl">🎓</span>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Your Track</p>
                    <p className="text-sm sm:text-lg font-bold text-primary">{profile.track}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
                <div className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 whitespace-nowrap"><span className="font-semibold text-primary">{profile.batch}</span></div>
                <div className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-full bg-secondary/50 border border-border whitespace-nowrap"><span className="font-semibold text-foreground">{profile.intern_id}</span></div>
                <div className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 whitespace-nowrap"><ShieldCheck className="w-3 h-3 text-green-500" /><span className="text-green-500 font-semibold">Approved</span></div>
                {streakDays > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 whitespace-nowrap"><Flame className="w-3 h-3 text-orange-500" /><span className="text-orange-500 font-semibold">{streakDays} day streak</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Gamification */}
          <div className="glass-card-static p-5 rounded-2xl border border-border/40 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30"><Crown className="w-6 h-6 text-primary" /></div>
                <div><p className="font-black text-foreground text-lg">{level}</p><p className="text-xs text-muted-foreground">{points} XP Points</p></div>
              </div>
              <div className="text-right"><p className="text-xs text-muted-foreground">Next Level</p><p className="text-sm font-bold text-primary">{Math.round(levelProgress)}%</p></div>
            </div>
            <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent" /></div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Submitted", value: submittedProjects, icon: Zap, color: "text-blue-400" },
              { label: "Rank", value: myRank > 0 ? `#${myRank}` : "—", icon: Trophy, color: "text-yellow-400" },
              { label: "Approved", value: approvedProjects, icon: CheckCircle2, color: "text-green-400" },
              { label: "Points", value: points, icon: Star, color: "text-purple-400" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-card-static p-4 lg:p-5 rounded-2xl border border-border/40 hover:border-border/70 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</span><s.icon className={`w-4 h-4 ${s.color}`} /></div>
                <p className="text-3xl lg:text-4xl font-black text-foreground">{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Badges */}
          {userBadges.length > 0 && (
            <div className="glass-card-static p-5 rounded-2xl border border-border/40">
              <div className="flex items-center gap-3 mb-4"><Medal className="w-5 h-5 text-primary" /><h3 className="font-bold text-foreground">Achievements ({userBadges.length})</h3></div>
              <div className="flex flex-wrap gap-2">{userBadges.map((ub: any) => (
                <motion.div key={ub.id} whileHover={{ scale: 1.05 }} className="px-3 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 text-sm font-bold text-foreground">{ub.badges?.icon} {ub.badges?.name}</motion.div>
              ))}</div>
            </div>
          )}

          {/* Progress */}
          <div className="glass-card-static p-5 rounded-2xl border border-border/40">
            <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-foreground">Internship Progress</h3><p className="text-2xl font-black text-primary">{progressPercent}%</p></div>
            <div className="h-3 bg-secondary/50 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary" /></div>
            <p className="text-xs text-muted-foreground mt-2">{submittedProjects}/{totalProjects} projects submitted</p>
          </div>

            <div>
              <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Quick Access</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {[
                  { label: "Projects", key: "projects", icon: FolderGit2 },
                  { label: "Resources", key: "resources", icon: BookOpen },
                  { label: "Leaderboard", key: "leaderboard", icon: Trophy },
                  { label: "Payment", key: "payment", icon: IndianRupee },
                  { label: "Offer Letter", key: "offer-letter", icon: FileText },
                  { label: "Certificates", key: "certificate", icon: Award },
                  { label: "Announcements", key: "announcements", icon: Megaphone },
                  { label: "Notifications", key: "notifications", icon: Bell },
                  { label: "Support", key: "support", icon: MessageSquare },
                  { label: "Profile", key: "profile", icon: User },
                ].filter(a => visibleTabs.includes(a.key)).map(a => (
                  <button key={a.key} onClick={() => setActiveTab(a.key)} className="glass-card-static p-3 rounded-xl border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 text-center">
                    <a.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <span className="text-[10px] font-bold text-foreground block">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

          {/* WhatsApp */}
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full glass-card-static p-4 rounded-2xl border border-green-500/30 hover:border-green-500/50 flex items-center gap-4 transition-all hover:shadow-lg bg-green-500/5">
            <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center"><MessageSquare className="w-6 h-6 text-green-500" /></div>
            <div className="flex-1"><p className="font-bold text-foreground">Join WhatsApp Community</p><p className="text-xs text-muted-foreground">Get updates, connect with peers & mentors</p></div>
            <ExternalLink className="w-5 h-5 text-green-500" />
          </a>

          {/* Ambassador */}
          {ambassadorApp?.status === "approved" ? (
            <div className="glass-card-static p-5 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🎓</span>
                <div><p className="font-black text-foreground">Campus Ambassador</p><p className="text-xs text-primary font-semibold">Code: {ambassadorApp.ambassador_code}</p></div>
                <button onClick={() => { navigator.clipboard.writeText(ambassadorApp.ambassador_code); toast({ title: "Copied!" }); }} className="ml-auto p-2 rounded-lg bg-primary/10 hover:bg-primary/20"><Copy className="w-4 h-4 text-primary" /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  { v: ambassadorReferrals.length, l: "Referrals" },
                  { v: ambassadorReferrals.filter(r => r.payment_status === "paid").length, l: "Paid" },
                  { v: formatINR(ambassadorEarnings.reduce((s: number, e: any) => s + Number(e.commission_earned || 0), 0)), l: "Earned" },
                  { v: formatINR(ambassadorEarnings.reduce((s: number, e: any) => s + Number(e.amount_saved || 0), 0)), l: "Saved" },
                ].map((s, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-secondary/30 text-center"><p className="text-lg font-black text-foreground">{s.v}</p><p className="text-[10px] text-muted-foreground">{s.l}</p></div>
                ))}
              </div>
            </div>
          ) : (
            <button onClick={() => navigate("/campus-ambassador")} className="w-full glass-card-static p-5 rounded-2xl border border-border/40 hover:border-border/70 text-left transition-all hover:shadow-lg">
              <div className="flex items-center gap-4">
                <span className="text-3xl">🎓</span>
                <div className="flex-1"><p className="font-black text-foreground">Become a Campus Ambassador</p><p className="text-xs text-muted-foreground mt-1">Earn commissions & exclusive perks</p>{ambassadorApp?.status === "pending" && <p className="text-[10px] text-yellow-500 font-semibold mt-1">⏳ Under review</p>}</div>
                <ChevronDown className="w-5 h-5 text-primary -rotate-90" />
              </div>
            </button>
          )}

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="glass-card-static p-5 rounded-2xl border border-border/40">
              <div className="flex items-center gap-2 mb-4"><Megaphone className="w-5 h-5 text-primary" /><h3 className="font-bold text-foreground">Latest Announcements</h3></div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {announcements.slice(0, 5).map(a => (
                  <div key={a.id} className="p-3 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors">
                    <p className="text-sm font-bold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{toISTDate(a.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

      case "projects": return (
        <div className="space-y-6">
          <div><h2 className="text-2xl font-bold text-foreground mb-1">My Projects</h2><p className="text-sm text-muted-foreground"><span className="text-primary font-semibold">{submittedProjects}/{totalProjects}</span> submitted • <span className="text-primary font-semibold">{approvedProjects}</span> approved</p></div>
          {projects.length === 0 ? (
            <div className="glass-card-static p-12 rounded-2xl text-center"><FolderGit2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" /><p className="text-foreground font-semibold">No projects assigned yet</p></div>
          ) : (
            <div className="space-y-3">
              {projects.map(p => {
                const sub = userSubmissions.find(s => s.project_id === p.id);
                const isExpanded = expandedProject === p.id;
                return (
                  <div key={p.id} className={`glass-card-static rounded-2xl border transition-all overflow-hidden ${sub?.status === "reviewed" || sub?.status === "approved" ? "border-green-500/30" : sub?.status === "submitted" ? "border-yellow-500/30" : "border-border/50"}`}>
                    <button onClick={() => setExpandedProject(isExpanded ? null : p.id)} className="w-full p-4 text-left flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground">{p.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sub?.status === "reviewed" || sub?.status === "approved" ? "bg-green-500/15 text-green-400" : sub?.status === "submitted" ? "bg-yellow-500/15 text-yellow-400" : "bg-muted text-muted-foreground"}`}>{sub?.status || "Not submitted"}</span>
                          {sub?.score != null && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{sub.score}/{p.max_marks || 100}</span>}
                          {p.deadline && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-3 h-3" />{toISTDate(p.deadline)}</span>}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                            <p className="text-sm text-muted-foreground">{p.description}</p>
                            {p.tech_stack?.length > 0 && <div className="flex flex-wrap gap-1.5">{p.tech_stack.map((t: string) => <span key={t} className="px-2 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">{t}</span>)}</div>}
                            {sub?.feedback && <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"><p className="text-xs font-bold text-yellow-400 mb-1">📝 Feedback</p><p className="text-sm text-muted-foreground">{sub.feedback}</p></div>}
                            {(!sub || sub.status === "needs_revision") && (
                              <div className="space-y-2 pt-2 border-t border-border/30">
                                <input placeholder="GitHub URL *" value={submissions[p.id]?.github || sub?.github_url || ""} onChange={e => setSubmissions(prev => ({ ...prev, [p.id]: { ...prev[p.id], github: e.target.value, demo: prev[p.id]?.demo || "", notes: prev[p.id]?.notes || "" } }))} className={inputCls} />
                                <input placeholder="Demo URL (optional)" value={submissions[p.id]?.demo || sub?.demo_url || ""} onChange={e => setSubmissions(prev => ({ ...prev, [p.id]: { ...prev[p.id], demo: e.target.value, github: prev[p.id]?.github || "", notes: prev[p.id]?.notes || "" } }))} className={inputCls} />
                                <textarea placeholder="Notes (optional)" value={submissions[p.id]?.notes || sub?.notes || ""} onChange={e => setSubmissions(prev => ({ ...prev, [p.id]: { ...prev[p.id], notes: e.target.value, github: prev[p.id]?.github || "", demo: prev[p.id]?.demo || "" } }))} className={`${inputCls} min-h-[60px]`} />
                                <button onClick={() => submitProject(p.id)} className="gradient-button w-full py-2.5 rounded-lg text-sm font-bold text-primary-foreground flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Submit</button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

      case "resources": return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Learning Resources</h2>
          {resources.length === 0 ? (
            <div className="glass-card-static p-12 rounded-2xl text-center"><BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" /><p className="text-foreground font-semibold">No resources yet</p></div>
          ) : (
            <div className="space-y-3">{resources.map(r => (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="glass-card-static p-4 rounded-xl border border-border/50 flex items-center gap-3 hover:border-primary/40 transition-all hover:shadow-lg">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div>
                <div className="flex-1 min-w-0"><p className="font-semibold text-foreground text-sm truncate">{r.title}</p><p className="text-xs text-muted-foreground">Week {r.week_number} • {r.resource_type}</p></div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </a>
            ))}</div>
          )}
        </div>
      );

      case "leaderboard": return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" /> Leaderboard</h2>
          {leaderboard.length === 0 ? <div className="glass-card-static p-12 rounded-2xl text-center"><p className="text-muted-foreground">No scores yet</p></div> : (
            <div className="space-y-2">{leaderboard.slice(0, 20).map((l, i) => (
              <div key={l.id} className={`glass-card-static p-4 rounded-xl border flex items-center gap-3 ${l.id === user.id ? "border-primary/50 bg-primary/5" : "border-border/50"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? "bg-yellow-500/20 text-yellow-500" : i === 1 ? "bg-gray-400/20 text-gray-400" : i === 2 ? "bg-orange-500/20 text-orange-500" : "bg-secondary text-muted-foreground"}`}>{i + 1}</div>
                {l.avatar_url ? <img src={l.avatar_url} className="w-10 h-10 rounded-full object-cover border border-border" /> : <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">{l.full_name?.charAt(0)}</div>}
                <div className="flex-1 min-w-0"><p className="font-bold text-foreground text-sm truncate">{l.full_name}</p><p className="text-[10px] text-muted-foreground">{l.college}</p></div>
                <div className="text-right"><p className="text-lg font-black text-foreground">{l.totalScore}</p><p className="text-[10px] text-muted-foreground">{l.submissionCount} reviewed</p></div>
              </div>
            ))}</div>
          )}
        </div>
      );

      case "payment": return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Certificate Payment</h2>
          {profile.payment_status === "paid" ? (
            <div className="glass-card-static p-8 rounded-2xl bg-gradient-to-r from-green-500/20 to-green-500/5 border border-green-500/30 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-xl font-bold text-foreground">Payment Verified ✅</p>
              <p className="text-sm text-muted-foreground mt-2">Your certificate fee has been confirmed.</p>
            </div>
          ) : (
            <div className="glass-card-static p-5 rounded-2xl border border-border/50 space-y-5">
              {/* Coupon Code Section */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Have a Coupon Code?</p>
                {profile.referral_code_used && referralDiscount > 0 ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-emerald-400">Coupon Applied: {profile.referral_code_used}</p><p className="text-xs text-muted-foreground">You save {formatINR(referralDiscount)}</p></div>
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={couponCode} onChange={e => { setCouponCode(e.target.value); checkCoupon(e.target.value); }} className={`${inputCls} flex-1 uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal`} placeholder="Enter coupon code" />
                    <button onClick={applyCoupon} disabled={couponStatus !== "valid"} className="gradient-button px-4 py-2.5 rounded-lg text-xs font-bold text-primary-foreground disabled:opacity-50">Apply</button>
                  </div>
                )}
                {couponMsg && !profile.referral_code_used && <p className={`text-xs ${couponStatus === "valid" ? "text-emerald-400" : "text-red-400"}`}>{couponMsg}</p>}
              </div>

              <div className="text-center">
                {referralDiscount > 0 ? (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-1">
                    <p className="text-sm text-muted-foreground line-through">Original: {formatINR(CERTIFICATE_FEE)}</p>
                    <p className="text-sm font-bold text-green-500">Coupon Discount: -{formatINR(referralDiscount)}</p>
                    <p className="text-3xl font-bold text-foreground">{formatINR(actualCertFee)}</p>
                  </div>
                ) : (
                  <div><p className="text-4xl font-bold text-foreground">{formatINR(CERTIFICATE_FEE)}</p><p className="text-sm text-muted-foreground mt-1">Certificate Fee</p></div>
                )}
                <p className="text-sm text-muted-foreground mt-4">Pay via UPI to:</p>
                <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border mt-2">
                  <span className="font-mono text-lg font-bold text-primary">{UPI_ID}</span>
                  <button onClick={() => { navigator.clipboard.writeText(UPI_ID); toast({ title: "Copied!" }); }}><Copy className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              </div>
              <div className="flex justify-center"><div className="p-3 rounded-xl bg-white"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${UPI_ID}&pn=Thryntern&am=${actualCertFee}&cu=INR`} alt="QR" className="rounded-lg w-44 h-44" /></div></div>
              <div className="space-y-3 border-t border-border/30 pt-4">
                <input placeholder="Enter Transaction/UTR ID" value={paymentTxn} onChange={e => setPaymentTxn(e.target.value)} className={inputCls} />
                <button onClick={submitPayment} className="gradient-button w-full py-3 rounded-lg text-sm font-bold text-primary-foreground">Submit Payment</button>
              </div>
              {myPayments.length > 0 && (
                <div className="space-y-2 border-t border-border/30 pt-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase">History</p>
                  {myPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 border border-border/50 text-sm">
                      <div><p className="font-semibold text-foreground">{formatINR(p.amount)}</p><p className="text-[10px] text-muted-foreground font-mono">{p.transaction_id}</p></div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.status === "verified" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{p.status === "verified" ? "✓ Verified" : "⏳ Pending"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );



export default Dashboard;

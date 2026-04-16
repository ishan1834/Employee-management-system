



import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2, Upload, FileText, Shield, Briefcase, Users, Rocket,
  Heart, ChevronDown, Mail, Camera, MapPin, Target, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StackCards } from '@/components/StackCards';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';

/* ─── types ─── */
interface OpenPosition {
  id: string; title: string; department: string; location: string;
  type: string; description: string | null; requirements: string | null; is_active: boolean;
}

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Scroll Reveal ─── */
const SR: React.FC<{
  children: React.ReactNode; delay?: number; className?: string;
  from?: 'bottom' | 'left' | 'right';
}> = ({ children, delay = 0, className = '', from = 'bottom' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const init = from === 'left' ? { opacity: 0, x: -56, y: 0 }
    : from === 'right' ? { opacity: 0, x: 56, y: 0 }
    : { opacity: 0, x: 0, y: 52 };
  return (
    <motion.div ref={ref} initial={init}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 1.0, delay, ease }}
      className={className}>
      {children}
    </motion.div>
  );
};

/* ─── Glass Card ─── */
const GC: React.FC<{
  children: React.ReactNode; className?: string; accent?: string;
  style?: React.CSSProperties; onClick?: () => void;
}> = ({ children, className = '', accent = 'rgba(255,255,255,.15)', style = {}, onClick }) => (
  <motion.div
    onClick={onClick}
    whileHover={{ scale: 1.022, y: -5 }}
    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    className={`relative overflow-hidden ${className}`}
    style={{
      background: 'rgba(255,255,255,.030)',
      border: '1px solid rgba(255,255,255,.072)',
      borderRadius: 28,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      boxShadow: '0 4px 32px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)',
      ...style,
    }}>
    <div className="absolute inset-0 pointer-events-none rounded-[inherit]"
      style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.045) 50%,rgba(255,255,255,0) 70%)' }} />
    <div className="absolute top-0 left-[15%] right-[15%] h-px pointer-events-none"
      style={{ background: `linear-gradient(90deg,transparent,${accent},transparent)`, opacity: .65 }} />
    {children}
  </motion.div>
);

/* ─── Typography helpers ─── */
const Pill: React.FC<{ children: React.ReactNode; color: string; border: string; bg: string }> = ({ children, color, border, bg }) => (
  <div className="inline-block px-4 py-1.5 rounded-full text-[10.5px] font-semibold tracking-[.2em] uppercase mb-4"
    style={{ color, border: `1px solid ${border}`, background: bg }}>{children}</div>
);
const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem,5vw,3.4rem)', fontWeight: 800, lineHeight: 1.08, color: '#f0f0f8' }}>{children}</h2>
);
const Grad: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ backgroundImage: 'linear-gradient(110deg,#f97316 0%,#e84393 48%,#a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{children}</span>
);
const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(180,180,210,.45)' }}>{children}</p>
);

/* ─── Step SVG ─── */
const StepSVG: React.FC<{ i: number; accent: string; size?: number }> = ({ i, accent, size = 62 }) => {
  const a = (o: number) => {
    const base = accent.replace(/,\s*[\d.]+\)$/, '');
    return `${base},${o})`;
  };
  const svgs = [
    <svg key={0} viewBox="0 0 64 64" fill="none" width={size} height={size}>
      <circle cx="32" cy="32" r="28" stroke={a(.22)} strokeWidth="1"/>
      <circle cx="32" cy="32" r="28" stroke={a(.82)} strokeWidth="1.5" strokeDasharray="176" strokeDashoffset="44" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="8s" repeatCount="indefinite"/>
      </circle>
      <rect x="22" y="20" width="20" height="24" rx="3" fill={a(.1)} stroke={a(.5)} strokeWidth="1.2"/>
      <line x1="27" y1="27" x2="37" y2="27" stroke={a(.65)} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="27" y1="31" x2="37" y2="31" stroke={a(.42)} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="27" y1="35" x2="33" y2="35" stroke={a(.28)} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>,
    <svg key={1} viewBox="0 0 64 64" fill="none" width={size} height={size}>
      <circle cx="32" cy="32" r="28" stroke={a(.22)} strokeWidth="1"/>
      <circle cx="32" cy="32" r="28" stroke={a(.82)} strokeWidth="1.5" strokeDasharray="176" strokeDashoffset="88" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="12s" repeatCount="indefinite"/>
      </circle>
      <circle cx="32" cy="26" r="7" fill={a(.1)} stroke={a(.5)} strokeWidth="1.2"/>
      <path d="M20 44c0-6.627 5.373-10 12-10s12 3.373 12 10" stroke={a(.5)} strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="43" cy="21" r="4" fill={a(.07)} stroke={a(.35)} strokeWidth="1"/>
      <path d="M40 30c0-2.5 1.3-3.8 3-3.8s3 1.3 3 3.8" stroke={a(.3)} strokeWidth="1" strokeLinecap="round"/>
    </svg>,
    <svg key={2} viewBox="0 0 64 64" fill="none" width={size} height={size}>
      <circle cx="32" cy="32" r="28" stroke={a(.22)} strokeWidth="1"/>
      <circle cx="32" cy="32" r="28" stroke={a(.82)} strokeWidth="1.5" strokeDasharray="176" strokeDashoffset="132" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="10s" repeatCount="indefinite"/>
      </circle>
      <rect x="18" y="22" width="28" height="20" rx="4" fill={a(.08)} stroke={a(.45)} strokeWidth="1.2"/>
      <circle cx="32" cy="32" r="4" fill={a(.2)} stroke={a(.65)} strokeWidth="1.2"/>
      <line x1="32" y1="22" x2="32" y2="27" stroke={a(.35)} strokeWidth="1" strokeLinecap="round"/>
      <line x1="42" y1="32" x2="37" y2="32" stroke={a(.35)} strokeWidth="1" strokeLinecap="round"/>
      <line x1="22" y1="32" x2="27" y2="32" stroke={a(.35)} strokeWidth="1" strokeLinecap="round"/>
      <line x1="32" y1="42" x2="32" y2="37" stroke={a(.35)} strokeWidth="1" strokeLinecap="round"/>
    </svg>,
    <svg key={3} viewBox="0 0 64 64" fill="none" width={size} height={size}>
      <circle cx="32" cy="32" r="28" stroke={a(.22)} strokeWidth="1"/>
      <circle cx="32" cy="32" r="28" stroke={a(.82)} strokeWidth="1.5" strokeDasharray="176" strokeDashoffset="0" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="6s" repeatCount="indefinite"/>
      </circle>
      <path d="M22 32l7 7 13-14" stroke={a(.88)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
  ];
  return svgs[i] || null;
};

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
const Careers: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showStatusTracker, setShowStatusTracker] = useState(false);
  const [trackerEmail, setTrackerEmail] = useState('');
  const [trackerResult, setTrackerResult] = useState<any>(null);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  const [formData, setFormData] = useState({
    fullName: '', mobileNumber: '', email: '', fullAddress: '', city: '',
    state: '', country: 'India', dateOfBirth: '', roleAppliedFor: '',
    yearsOfExperience: '', skills: '', whyJoinThrylos: '', additionalNotes: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [applicantImage, setApplicantImage] = useState<File | null>(null);
  const [applicantImagePreview, setApplicantImagePreview] = useState<string | null>(null);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);

  useEffect(() => {
    const fetchPositions = async () => {
      const { data, error } = await supabase.from('open_positions').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (!error && data) setOpenPositions(data as OpenPosition[]);
    };
    fetchPositions();
    const channel = supabase.channel('open-positions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'open_positions' }, fetchPositions)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });
  const handleInputChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const uploadFile = async (file: File, folder: string, bucket = 'career-documents'): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) { console.error('Upload error:', error); return null; }
    return fileName;
  };

  const handleApplicantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) { toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' }); return; }
      setApplicantImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setApplicantImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleTrackApplication = async () => {
    if (!trackerEmail) return;
    setTrackerLoading(true);
    try {
      const { data, error } = await supabase.from('job_applications')
        .select('full_name, role, status, created_at').eq('email', trackerEmail.trim())
        .order('created_at', { ascending: false }).limit(1);
      if (error) throw error;
      setTrackerResult(data && data.length > 0 ? data[0] : 'not_found');
    } catch { setTrackerResult('error'); } finally { setTrackerLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNumber || !formData.email || !formData.roleAppliedFor || !formData.skills || !resumeFile || !aadharFile || !applicantImage) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' }); return;
    }
    setIsSubmitting(true);
    try {
      let resumeUrl = null, aadharUrl = null, applicantImagePath = null;
      const additionalDocUrls: string[] = [];
      if (resumeFile) resumeUrl = await uploadFile(resumeFile, 'resumes', 'career-documents');
      if (aadharFile) aadharUrl = await uploadFile(aadharFile, 'aadhar', 'career-documents');
      if (applicantImage) applicantImagePath = await uploadFile(applicantImage, 'photos', 'career-applicant-images');
      for (const file of additionalFiles) { const url = await uploadFile(file, 'additional', 'career-documents'); if (url) additionalDocUrls.push(url); }

      const { error } = await supabase.from('job_applications').insert([{
        full_name: formData.fullName.trim(), mobile: formData.mobileNumber.trim(), email: formData.email.trim(),
        address: formData.fullAddress?.trim() || null, city: formData.city?.trim() || null,
        state: formData.state?.trim() || null, country: formData.country?.trim() || null,
        date_of_birth: formData.dateOfBirth || null, role: formData.roleAppliedFor,
        years_of_experience: formData.yearsOfExperience || null, skills: formData.skills?.trim() || null,
        why_join: formData.whyJoinThrylos?.trim() || null, additional_notes: formData.additionalNotes?.trim() || null,
        resume_url: resumeUrl, aadhar_urls: aadharUrl ? [aadharUrl] : null,
        additional_doc_urls: additionalDocUrls.length ? additionalDocUrls : null, applicant_image_path: applicantImagePath,
      }]);
      if (error) throw error;

      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        await fetch(`https://${projectId}.supabase.co/functions/v1/send-career-email`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: formData.email.trim(), name: formData.fullName.trim(), type: 'application_received', role: formData.roleAppliedFor }),
        });
      } catch (emailErr) { console.error('Email send failed:', emailErr); }

      toast({ title: 'Application Submitted!', description: 'Thank you for applying! A confirmation email has been sent.' });
      setFormData({ fullName: '', mobileNumber: '', email: '', fullAddress: '', city: '', state: '', country: 'India', dateOfBirth: '', roleAppliedFor: '', yearsOfExperience: '', skills: '', whyJoinThrylos: '', additionalNotes: '' });
      setResumeFile(null); setAadharFile(null); setAdditionalFiles([]); setApplicantImage(null); setApplicantImagePreview(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to submit application.', variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  const roles = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Software Developer', 'Designer', 'Video Editor', 'Marketing', 'Content Creator', 'Other'];
  const whatsappLinks = { channel: 'https://whatsapp.com/channel/0029VbBSmHiLNSa8gJWvuA09', community: 'https://chat.whatsapp.com/Hio4CFnk9Hm5AymrnxR0ct' };

  const faqs = [
    {
      q: 'What is the hiring process at THRYLOS?',
      a: `Our hiring process is designed to be transparent and candidate-friendly. It typically starts with an application review where a recruiter or hiring manager evaluates your resume and submitted documents for role fit. Shortlisted candidates are invited to a focused interview (we usually conduct these on Discord) that assesses your technical skills, problem-solving approach, and cultural fit — some roles may include a short take-home task or a portfolio review. After interviews, successful candidates receive an offer and onboarding details; throughout the process we aim to give clear timelines and next steps via email. If you need feedback or clarification at any stage, you can reach out to careers@thrylos.in.`
    },
    {
      q: 'Is this a remote position?',
      a: `Most roles at THRYLOS are remote-first, enabling you to work from anywhere in India. Some positions that require close collaboration with local partners or periodic in-person sessions may have location preferences — such requirements will be clearly indicated in the job listing. Remote employees receive full support for onboarding, communication, and collaboration through our tooling and documentation; we also encourage occasional meetups for team bonding when feasible. If you have location-specific questions, mention them in your application or contact the hiring team.`
    },
    {
      q: 'How long does the review process take?',
      a: `We strive to review new applications within 5–7 business days for an initial decision. If you are shortlisted, scheduling interviews can add another 1–2 weeks depending on availability and timezones. Some roles with additional assessment steps may take longer to complete the full hiring cycle (up to a few weeks). If you haven’t heard back within two weeks, you can use the Track Application feature on this page or email careers@thrylos.in for an update — we appreciate patience and try to keep communication timely.`
    },
    {
      q: 'What documents do I need to apply?',
      a: `At minimum, please provide a professional photo, an up-to-date resume/CV, and an Aadhar card (for identity verification). We accept common file formats (PDF, DOC/DOCX for resumes; JPG/PNG for images). Optional but recommended attachments include a cover letter, portfolio links (Dribbble/Behance/GitHub), relevant certifications, and sample project write-ups — these help us better understand your work. Make sure files are readable and named clearly (e.g., "Firstname_Lastname_Resume.pdf"). If you have any privacy or upload concerns, mention them in the additional notes field and the hiring team will advise.`
    },
    {
      q: 'Can I apply for multiple positions?',
      a: `Yes, you can apply for more than one role, but we recommend submitting a separate application for each position and tailoring your resume and the 'Why join THRYLOS' section to explain your fit for that specific role. Submitting the same resume for multiple positions is fine if your background suits them, but customizing your examples and highlighting relevant skills greatly increases your chances of being shortlisted. Multiple applications are reviewed independently, and our team will contact you regarding the role(s) where your profile aligns best.`
    },
    {
      q: 'How will I know if I am selected?',
      a: `You will receive email notifications at key stages — confirmation of application receipt, shortlist/interview invitations, and final selection or rejection. For shortlisted candidates we will share interview scheduling details and preparation notes; if selected, you will get a formal offer with compensation and onboarding instructions via email. Please check your spam/junk folder if you don’t see messages, and feel free to use the Track Application modal on this page or contact careers@thrylos.in if you need a status update. We endeavour to communicate professionally and promptly at every step.`
    },
  ];

  const STATUS_STEPS = ['pending', 'shortlisted', 'interview', 'accepted'];
  const STATUS_LABELS: Record<string, string> = { pending: 'Under Review', shortlisted: 'Shortlisted', interview: 'Interview', accepted: 'Selected' };

  const stepsData = [
    { title: 'Apply', accent: 'rgba(249,115,22,1)', desc: 'Fill the form, attach your resume and Aadhar.', detail: "Submit your application through the THRYLOS careers page. You'll need a professional photo, resume/CV, and Aadhar card. The form takes under 10 minutes." },
    { title: 'Review', accent: 'rgba(167,139,250,1)', desc: 'Our team reads every application within 5–7 days.', detail: 'Every application is read by a real person — not a bot. We look at your skills, experience, and why you want to join. You will hear back within 5–7 business days.' },
    { title: 'Interview', accent: 'rgba(52,211,153,1)', desc: 'A focused conversation on Discord. No tricks.', detail: "Shortlisted candidates get a direct message to schedule a conversation on Discord. It's relaxed and honest — we want to know how you think. No whiteboard puzzles." },
    { title: 'Selection', accent: 'rgba(232,67,147,1)', desc: 'Offer letter, onboarding, and day one.', detail: 'Selected candidates receive a formal offer letter over email. Our onboarding team walks you through tools, team introductions, and your first project. Welcome to THRYLOS.' },
  ];

  /* ── Page Loader ── */
  if (pageLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: '#07080f' }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center">
          <motion.h1
            style={{ fontFamily: "'Nixmat', sans-serif", backgroundImage: 'linear-gradient(90deg,#f97316 0%,#ec4899 50%,#3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 'clamp(3rem,10vw,5rem)', fontWeight: 800, letterSpacing: '.1em' }}
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
            THRYLOS
          </motion.h1>
          <motion.div className="mt-6 flex justify-center gap-1.5">
            {[0,1,2,3,4].map(i => (
              <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: '#a78bfa' }}
                animate={{ y: [0,-12,0], opacity: [0.3,1,0.3] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }} />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    
    <div style={{ background: '#07080f', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Ambient background ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div style={{ y: parallaxY }} className="absolute inset-0">
          <div className="absolute inset-0" style={{ backgroundImage: 'url(/thrylosbg.png)', backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.18 }} />
        </motion.div>
        {[
          { w: 500, h: 500, x: '-8%', y: '8%', c: 'rgba(167,139,250,.048)', d: 22 },
          { w: 400, h: 400, x: '70%', y: '45%', c: 'rgba(249,115,22,.035)', d: 28 },
          { w: 360, h: 360, x: '30%', y: '72%', c: 'rgba(232,67,147,.032)', d: 19 },
        ].map((o, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: o.w, height: o.h, left: o.x, top: o.y, background: `radial-gradient(circle,${o.c} 0%,transparent 70%)`, filter: 'blur(40px)' }}
            animate={{ x: [0, 35, -20, 0], y: [0, -28, 18, 0] }}
            transition={{ duration: o.d, repeat: Infinity, ease: 'easeInOut' }} />
        ))}
        {/* Subtle grid */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      {/* ════════════════════════════════════
          HERO
      ════════════════════════════════════ */}
     {/* Hero Section */}
         <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
           <motion.div className="text-center z-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
             <Link to="/">
               <motion.h1 className="text-6xl md:text-8xl font-extrabold tracking-wide text-transparent bg-clip-text mb-6 cursor-pointer"
                 style={{ fontFamily: "'Nixmat', sans-serif", backgroundImage: 'linear-gradient(90deg, #f97316 0%, #ec4899 50%, #3b82f6 100%)' }}
                 whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                 THRYLOS
               </motion.h1>
             </Link>
             <motion.h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
               Careers
             </motion.h2>
             <motion.p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
               Build the future of technology with us
             </motion.p>
             <motion.p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
               Join India's fastest-growing tech organization and be part of a team that's building innovative solutions.
             </motion.p>
             <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
               <Button onClick={scrollToForm} size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold hover:scale-105 transition-all">
                 Apply Now <ChevronDown className="ml-2 w-5 h-5 animate-bounce" />
               </Button>
               <Button onClick={() => setShowStatusTracker(true)} size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary px-8 py-6 text-lg font-semibold hover:scale-105 transition-all">
                 <Target className="mr-2 w-5 h-5" /> Track Application
               </Button>
             </motion.div>
           </motion.div>
         </section>

      {/* ════════════════════════════════════
          STATS — Zig-zag organic cards
      ════════════════════════════════════ */}
      <section className="relative z-10 py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SR><Pill color="rgba(167,139,250,.8)" border="rgba(167,139,250,.22)" bg="rgba(167,139,250,.08)">Our Impact</Pill></SR>
            <SR delay={0.08}><H2>THRYLOS in <Grad>Numbers</Grad></H2></SR>
            <SR delay={0.16}><Sub>The metrics that define us — team, reach, momentum, mindset.</Sub></SR>
          </div>

          {/* Two large horizontal cards — alternating left/right reveal */}
          <div className="space-y-5 md:space-y-0 md:grid md:grid-cols-2 gap-5">
            {[
              {
                val: '50', suffix: '+', label: 'Team Members',
                meta: 'Talented people across India, remote-first and growing every quarter.',
                accent: 'rgba(167,139,250,1)', accentDim: 'rgba(167,139,250,.22)',
                radius: '32px 14px 32px 14px', from: 'left' as const,
              },
              {
                val: 'Pan', suffix: ' India', label: 'Remote First',
                meta: 'No office required. Work from your city.',
                accent: 'rgba(249,115,22,1)', accentDim: 'rgba(249,115,22,.22)',
                radius: '14px 32px 14px 32px', from: 'right' as const,
              },
              {
                val: '10', suffix: '+', label: 'Active Projects',
                meta: 'Simultaneous live products shipping real value to real users.',
                accent: 'rgba(232,67,147,1)', accentDim: 'rgba(232,67,147,.22)',
                radius: '14px 32px 14px 32px', from: 'right' as const,
              },
              {
                val: '100', suffix: '%', label: 'Growth Focused',
                meta: 'Every role has a clear advancement path built into it from day one.',
                accent: 'rgba(52,211,153,1)', accentDim: 'rgba(52,211,153,.22)',
                radius: '32px 14px 32px 14px', from: 'left' as const,
              },
            ].map((s, i) => (
              <SR key={i} delay={i * 0.09} from={s.from}>
                <GC accent={s.accentDim} style={{ borderRadius: s.radius }}>
                  <div className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Value */}
                    <div className="flex-shrink-0" style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(2.8rem,6vw,4rem)', fontWeight: 800, lineHeight: 1, color: '#f0f0f8' }}>
                      {s.val}<span style={{ color: s.accent, fontSize: '.6em' }}>{s.suffix}</span>
                    </div>
                    {/* Divider */}
                    <div className="hidden md:block w-px h-14 flex-shrink-0" style={{ background: `linear-gradient(to bottom,transparent,${s.accentDim},transparent)` }} />
                    <div className="md:hidden h-px w-10" style={{ background: `linear-gradient(to right,${s.accentDim},transparent)` }} />
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: s.accent.replace('1)', '.75)'), marginBottom: 7 }}>{s.label}</p>
                      <p style={{ fontSize: 13, lineHeight: 1.68, color: 'rgba(180,180,210,.44)' }}>{s.meta}</p>
                    </div>
                  </div>
                  {/* Corner shape */}
                  <div className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-[100%] pointer-events-none"
                    style={{ background: s.accent, opacity: 0.04 }} />
                </GC>
              </SR>
            ))}
          </div>
        </div>
      </section>

    {/* Open Positions Section */}
    {openPositions.length > 0 && (
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <SR>
            <div className="text-center mb-20">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-500/15 to-blue-500/15 border border-purple-500/30 text-purple-400 text-sm font-semibold mb-6">We're Hiring</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-5">
                Open <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500">Positions</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">Join THRYLOS and help shape the future of technology in India.</p>
            </div>
          </SR>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {openPositions.map((position, index) => (
              <SR key={position.id} delay={index * 0.08}>
                <motion.div onClick={() => { handleInputChange('roleAppliedFor', position.title); scrollToForm(); }}
                  whileHover={{ y: -6, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}
                  className="group relative cursor-pointer rounded-3xl bg-gradient-to-br from-card to-background border border-border backdrop-blur-xl transition-all duration-500 hover:border-purple-500/50 hover:shadow-[0_30px_80px_rgba(168,85,247,0.15)] overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
                  <div className="relative z-10 p-6 md:p-8 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-green-500/80 to-emerald-500/80 border border-green-400/60 text-white text-xs font-bold uppercase tracking-wide">{position.type}</span>
                      <img src="/application.png" alt={position.title} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-xl opacity-90" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-300">{position.title}</h3>
                    <div className="flex flex-wrap gap-3 mb-6">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-sm"><Users className="w-4 h-4 text-purple-400" />{position.department}</span>
                      <span className="flex items-center gap-1.5 text-muted-foreground text-sm"><MapPin className="w-4 h-4 text-blue-400" />{position.location}</span>
                    </div>
                    {position.description && <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-8">{position.description}</p>}
                    <div className="mt-auto flex items-center gap-2 text-purple-400 font-semibold group-hover:gap-4 transition-all duration-300">
                      <span>Apply Now</span>
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.div>
              </SR>
            ))}
          </div>
        </div>
      </section>
    )}

      {/* ════════════════════════════════════
          WHY THRYLOS
      ════════════════════════════════════ */}
      <SR>
        <section className="relative z-10 py-10 text-center px-4" style={{ fontFamily: "'Nixmat', sans-serif" }}>
          <H2>Why <Grad>THRYLOS</Grad>?</H2>
          <Sub>Discover what makes working at THRYLOS a unique and rewarding experience.</Sub>
        </section>
      </SR>
      <StackCards />

      {/* ════════════════════════════════════
          LIFE AT THRYLOS — Editorial zig-zag
      ════════════════════════════════════ */}
      <section className="relative z-10 py-28 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <SR><Pill color="rgba(249,115,22,.8)" border="rgba(249,115,22,.22)" bg="rgba(249,115,22,.08)">Our Culture</Pill></SR>
            <SR delay={0.08}><H2>Life at <Grad>THRYLOS</Grad></H2></SR>
            <SR delay={0.16}><Sub>Where innovation meets passion — and every voice shapes what we build next.</Sub></SR>
          </div>

          {/* Row 1: Large featured left + 2 stacked right */}
          <div className="grid md:grid-cols-[1.45fr_1fr] gap-5 mb-5">
            <SR from="left">
              <GC accent="rgba(167,139,250,.28)" style={{ minHeight: 360 }}>
                <div className="p-9 md:p-10 h-full flex flex-col justify-between" style={{ minHeight: 360 }}>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-[9.5px] font-black tracking-[.2em] uppercase mb-6"
                      style={{ background: 'rgba(167,139,250,.1)', color: 'rgba(167,139,250,.88)', border: '1px solid rgba(167,139,250,.22)' }}>
                      TECH
                    </span>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.6rem,3vw,2rem)', fontWeight: 800, color: '#f0f0f8', lineHeight: 1.15 }}>
                      Innovation<br />First
                    </h3>
                    <p style={{ marginTop: 16, fontSize: 13.5, lineHeight: 1.78, color: 'rgba(180,180,210,.5)' }}>
                      Work on cutting-edge projects that push boundaries and solve problems that actually matter. No bureaucracy — just pure execution, ownership, and real impact every day. Work with the latest tech stacks, experiment with new tools, and ship products that users love with a team that values creativity and bold ideas and work in a culture that fosters learning and growth.
                    </p>
                  </div>
                  <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                    <div className="flex items-baseline gap-2">
                      <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '2.6rem', fontWeight: 800, color: 'rgba(167,139,250,.88)' }}>10+</span>
                      <span style={{ fontSize: 12, color: 'rgba(180,180,210,.38)' }}>live products shipped</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-36 h-36 pointer-events-none rounded-tl-[50%]"
                  style={{ background: 'rgba(167,139,250,1)', opacity: 0.05 }} />
              </GC>
            </SR>

            <div className="flex flex-col gap-5">
              <SR from="right" delay={0.1}>
                <GC accent="rgba(249,115,22,.24)" style={{ flex: 1 }}>
                  <div className="p-7 flex flex-col justify-between" style={{ minHeight: 166 }}>
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-[9.5px] font-black tracking-[.2em] uppercase mb-4"
                        style={{ background: 'rgba(249,115,22,.1)', color: 'rgba(249,115,22,.88)', border: '1px solid rgba(249,115,22,.22)' }}>
                        CULTURE
                      </span>
                      <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#f0f0f8' }}>Creative Freedom</h3>
                      <p style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'rgba(180,180,210,.48)' }}>
                        Propose ideas, own initiatives, drive them from concept to launch.
                      </p>
                    </div>
                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '2rem', fontWeight: 800, color: 'rgba(249,115,22,.82)' }}>∞</span>
                      <span style={{ fontSize: 11, color: 'rgba(180,180,210,.35)' }}>ideas we say yes to</span>
                    </div>
                  </div>
                </GC>
              </SR>

              <SR from="right" delay={0.18}>
                <GC accent="rgba(52,211,153,.22)" style={{ flex: 1 }}>
                  <div className="p-7 flex flex-col justify-between" style={{ minHeight: 166 }}>
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-[9.5px] font-black tracking-[.2em] uppercase mb-4"
                        style={{ background: 'rgba(52,211,153,.1)', color: 'rgba(52,211,153,.88)', border: '1px solid rgba(52,211,153,.22)' }}>
                        CAREER
                      </span>
                      <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#f0f0f8' }}>Growth & Learning</h3>
                      <p style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: 'rgba(180,180,210,.48)' }}>
                        Mentorship and a crystal-clear advancement path.
                      </p>
                    </div>
                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '2rem', fontWeight: 800, color: 'rgba(52,211,153,.82)' }}>100%</span>
                      <span style={{ fontSize: 11, color: 'rgba(180,180,210,.35)' }}>internal promotions</span>
                    </div>
                  </div>
                </GC>
              </SR>
            </div>
          </div>

          {/* Row 2: 4 mini tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Recognition', sub: 'Regular spotlights & awards', accent: 'rgba(167,139,250,.7)', dot: 'rgba(167,139,250,.5)' },
              { label: 'Innovation Labs', sub: 'Weekly internal hackathons', accent: 'rgba(249,115,22,.7)', dot: 'rgba(249,115,22,.5)' },
              { label: 'Work-Life Balance', sub: 'Fully flexible hours', accent: 'rgba(232,67,147,.7)', dot: 'rgba(232,67,147,.5)' },
              { label: 'Open Culture', sub: 'Flat hierarchy, real voice', accent: 'rgba(52,211,153,.7)', dot: 'rgba(52,211,153,.5)' },
            ].map((m, i) => (
              <SR key={i} delay={0.05 + i * 0.07}>
                <GC accent={m.accent.replace('.7)', '.18)')} style={{ borderRadius: 20 }}>
                  <div className="p-5 text-center flex flex-col justify-center" style={{ minHeight: 100 }}>
                    <div className="w-1.5 h-1.5 rounded-full mx-auto mb-3" style={{ background: m.dot }} />
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: '#d4d4ec' }}>{m.label}</p>
                    <p style={{ fontSize: 11, marginTop: 5, color: 'rgba(180,180,210,.35)' }}>{m.sub}</p>
                  </div>
                </GC>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          HIRING PROCESS — Interactive (no numbers)
      ════════════════════════════════════ */}
      <section className="relative z-10 py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SR><Pill color="rgba(232,67,147,.8)" border="rgba(232,67,147,.22)" bg="rgba(232,67,147,.08)">How It Works</Pill></SR>
            <SR delay={0.08}><H2>Hiring <Grad>Process</Grad></H2></SR>
            <SR delay={0.16}><Sub>Four transparent steps. Tap any stage to preview what happens there.</Sub></SR>
          </div>

          <SR delay={0.2}>
            {/* Desktop */}
            <div className="hidden md:grid grid-cols-4 gap-4">
              {stepsData.map((s, i) => (
                <motion.div key={i} onClick={() => setActiveStep(i)}
                  animate={activeStep === i ? { y: -8, scale: 1.03 } : { y: 0, scale: 1 }}
                  whileHover={{ scale: activeStep === i ? 1.03 : 1.022, y: activeStep === i ? -8 : -4 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="relative overflow-hidden cursor-pointer flex flex-col items-center text-center rounded-[24px]"
                  style={{
                    background: activeStep === i ? 'rgba(255,255,255,.062)' : 'rgba(255,255,255,.028)',
                    border: `1px solid ${activeStep === i ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.07)'}`,
                    padding: '28px 18px',
                    minHeight: 240,
                    boxShadow: activeStep === i ? '0 20px 60px rgba(0,0,0,.45)' : 'none',
                    backdropFilter: 'blur(24px)',
                  }}>
                  <div className="absolute top-0 left-[8%] right-[8%] h-px"
                    style={{ background: `linear-gradient(90deg,transparent,${s.accent.replace('1)', '.7)')},transparent)`, opacity: activeStep === i ? 1 : 0.4 }} />
                  <div className="mb-5 mt-1"><StepSVG i={i} accent={s.accent} size={62} /></div>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1rem', fontWeight: 800, color: '#f0f0f8', marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 12, lineHeight: 1.65, color: 'rgba(180,180,210,.45)' }}>{s.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Mobile */}
            <div className="flex md:hidden flex-col gap-3">
              {stepsData.map((s, i) => (
                <motion.div key={i} onClick={() => setActiveStep(i)}
                  animate={activeStep === i ? { scale: 1.01 } : { scale: 1 }}
                  className="relative overflow-hidden cursor-pointer flex gap-4 items-start rounded-[20px] p-4"
                  style={{
                    background: activeStep === i ? 'rgba(255,255,255,.055)' : 'rgba(255,255,255,.028)',
                    border: `1px solid ${activeStep === i ? 'rgba(255,255,255,.13)' : 'rgba(255,255,255,.07)'}`,
                    backdropFilter: 'blur(20px)',
                  }}>
                  <div className="absolute top-0 left-[15%] right-[15%] h-px"
                    style={{ background: `linear-gradient(90deg,transparent,${s.accent.replace('1)', '.6)')},transparent)`, opacity: .6 }} />
                  <div style={{ width: 46, height: 46, flexShrink: 0 }}><StepSVG i={i} accent={s.accent} size={46} /></div>
                  <div>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '.95rem', color: '#f0f0f8', marginBottom: 4 }}>{s.title}</p>
                    <p style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(180,180,210,.45)' }}>{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Info panel */}
            <AnimatePresence mode="wait">
              <motion.div key={activeStep}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4, ease }}
                className="mt-4 rounded-[20px] p-5 px-6"
                style={{
                  background: 'rgba(255,255,255,.022)',
                  border: `1px solid ${stepsData[activeStep].accent.replace('1)', '.18)')}`,
                  backdropFilter: 'blur(16px)',
                }}>
                <p style={{ fontSize: 13, lineHeight: 1.78, color: 'rgba(180,180,210,.55)' }}>
                  <span style={{ color: stepsData[activeStep].accent, marginRight: 10, fontSize: 7 }}>◆</span>
                  {stepsData[activeStep].detail}
                </p>
              </motion.div>
            </AnimatePresence>
          </SR>
        </div>
      </section>

      {/* ════════════════════════════════════
          APPLICATION FORM
      ════════════════════════════════════ */}
      <section ref={formRef} className="relative z-10 py-10 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <SR>
              <h3 className="flex items-center justify-center gap-3 flex-wrap"
                style={{ fontFamily: "'Nixmat',sans-serif", fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 800, color: '#f0f0f8' }}>
                Apply to{' '}
                <span style={{ backgroundImage: 'linear-gradient(90deg,#f97316,#ec4899,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  THRYLOS
                </span>
              </h3>
              <p style={{ marginTop: 8, fontSize: 13.5, color: 'rgba(180,180,210,.44)' }}>Fill out the form below to start your journey with us</p>
            </SR>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Details */}
            <SR delay={0.1}>
              <GC>
                <div className="p-7 md:p-9">
                  <h4 className="text-sm font-semibold mb-6 flex items-center gap-2" style={{ color: '#e0e0f0' }}>
                    <Users className="w-4 h-4" style={{ color: 'rgba(167,139,250,.7)' }} /> Personal Details
                  </h4>
                  <div className="space-y-5">
                    {/* Photo */}
                    <div className="flex flex-col items-center gap-3 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                      <Label style={{ fontSize: 12, color: 'rgba(180,180,210,.65)' }}>Your Photo <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
                          style={{ border: `2px solid ${applicantImagePreview ? 'rgba(52,211,153,.5)' : 'rgba(255,255,255,.1)'}`, background: 'rgba(255,255,255,.04)' }}>
                          {applicantImagePreview ? <img src={applicantImagePreview} alt="Preview" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8" style={{ color: 'rgba(180,180,210,.3)' }} />}
                        </div>
                        <input type="file" accept="image/*" onChange={handleApplicantImageChange} className="hidden" id="applicant-image-upload" required />
                        <label htmlFor="applicant-image-upload" className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
                          style={{ background: 'linear-gradient(135deg,#f97316,#e84393)' }}>
                          <Camera className="w-4 h-4 text-white" />
                        </label>
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(180,180,210,.32)' }}>Upload a professional photo (JPG, PNG)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[{ id: 'fullName', label: 'Full Name', ph: 'Enter your full name', req: true }, { id: 'mobileNumber', label: 'Mobile Number', ph: '+91 XXXXXXXXXX', req: true }].map(f => (
                        <div key={f.id} className="space-y-2">
                          <Label htmlFor={f.id} style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)' }}>{f.label} {f.req && <span className="text-red-400">*</span>}</Label>
                          <Input id={f.id} value={(formData as any)[f.id]} onChange={e => handleInputChange(f.id, e.target.value)} placeholder={f.ph}
                            className="h-11 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: '#e0e0f0' }} required={f.req} />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)' }}>Email Address <span className="text-red-400">*</span></Label>
                        <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} placeholder="your@email.com"
                          className="h-11 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: '#e0e0f0' }} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth" style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)' }}>Date of Birth</Label>
                        <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={e => handleInputChange('dateOfBirth', e.target.value)}
                          className="h-11 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: '#e0e0f0' }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullAddress" style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)' }}>Full Address</Label>
                      <Textarea id="fullAddress" value={formData.fullAddress} onChange={e => handleInputChange('fullAddress', e.target.value)} placeholder="Enter your complete address"
                        className="rounded-xl text-sm min-h-[70px]" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: '#e0e0f0' }} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['city', 'state', 'country'].map(f => (
                        <div key={f} className="space-y-2">
                          <Label htmlFor={f} style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)', textTransform: 'capitalize' }}>{f}</Label>
                          <Input id={f} value={(formData as any)[f]} onChange={e => handleInputChange(f, e.target.value)} placeholder={`Your ${f}`}
                            className="h-11 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: '#e0e0f0' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GC>
            </SR>

            {/* Professional Details */}
            <SR delay={0.15}>
              <GC>
                <div className="p-7 md:p-9">
                  <h4 className="text-sm font-semibold mb-6 flex items-center gap-2" style={{ color: '#e0e0f0' }}>
                    <Briefcase className="w-4 h-4" style={{ color: 'rgba(249,115,22,.7)' }} /> Professional Details
                  </h4>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)' }}>Role Applying For <span className="text-red-400">*</span></Label>
                        <Select value={formData.roleAppliedFor} onValueChange={v => handleInputChange('roleAppliedFor', v)}>
                          <SelectTrigger className="h-11 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: '#e0e0f0' }}>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent style={{ background: '#13141f', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12 }}>
                            {roles.map(r => <SelectItem key={r} value={r} style={{ color: '#e0e0f0' }}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)' }}>Years of Experience</Label>
                        <Select value={formData.yearsOfExperience} onValueChange={v => handleInputChange('yearsOfExperience', v)}>
                          <SelectTrigger className="h-11 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: '#e0e0f0' }}>
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent style={{ background: '#13141f', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12 }}>
                            {['fresher','0-1','1-3','3-5','5+'].map(v => <SelectItem key={v} value={v} style={{ color: '#e0e0f0' }}>{v === 'fresher' ? 'Fresher' : `${v} Years`}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)' }}>Skills <span className="text-red-400">*</span></Label>
                      <Textarea value={formData.skills} onChange={e => handleInputChange('skills', e.target.value)} placeholder="List your relevant skills..."
                        className="rounded-xl text-sm min-h-[90px]" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: '#e0e0f0' }} required />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)' }}>Why do you want to join THRYLOS?</Label>
                      <Textarea value={formData.whyJoinThrylos} onChange={e => handleInputChange('whyJoinThrylos', e.target.value)} placeholder="Tell us why you're excited..."
                        className="rounded-xl text-sm min-h-[100px]" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: '#e0e0f0' }} />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)' }}>Additional Notes</Label>
                      <Textarea value={formData.additionalNotes} onChange={e => handleInputChange('additionalNotes', e.target.value)} placeholder="Anything else..."
                        className="rounded-xl text-sm min-h-[80px]" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: '#e0e0f0' }} />
                    </div>
                  </div>
                </div>
              </GC>
            </SR>

            {/* Documents */}
            <SR delay={0.2}>
              <GC>
                <div className="p-7 md:p-9">
                  <h4 className="text-sm font-semibold mb-6 flex items-center gap-2" style={{ color: '#e0e0f0' }}>
                    <Upload className="w-4 h-4" style={{ color: 'rgba(52,211,153,.7)' }} /> Document Upload
                  </h4>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: 'resume-upload', label: 'Resume / CV', accept: '.pdf,.doc,.docx', file: resumeFile, setFile: setResumeFile, req: true },
                        { id: 'aadhar-upload', label: 'Aadhar Card', accept: '.pdf,.jpg,.jpeg,.png', file: aadharFile, setFile: setAadharFile, req: true },
                      ].map(f => (
                        <div key={f.id} className="space-y-2">
                          <Label style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)' }}>{f.label} {f.req && <span className="text-red-400">*</span>}</Label>
                          <input type="file" accept={f.accept} onChange={e => f.setFile(e.target.files?.[0] || null)} className="hidden" id={f.id} required={f.req} />
                          <label htmlFor={f.id} className="flex items-center justify-center gap-2.5 p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all"
                            style={{ borderColor: f.file ? 'rgba(52,211,153,.42)' : 'rgba(255,255,255,.09)', background: f.file ? 'rgba(52,211,153,.055)' : 'rgba(255,255,255,.02)' }}>
                            {f.file
                              ? <><FileText className="w-5 h-5" style={{ color: 'rgba(52,211,153,.8)' }} /><span className="text-sm truncate max-w-[180px]" style={{ color: 'rgba(52,211,153,.8)' }}>{f.file.name}</span></>
                              : <><Upload className="w-5 h-5" style={{ color: 'rgba(180,180,210,.32)' }} /><span className="text-sm" style={{ color: 'rgba(180,180,210,.38)' }}>Upload {f.label}</span></>}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label style={{ fontSize: 11.5, color: 'rgba(180,180,210,.6)' }}>Additional Documents (Optional)</Label>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple onChange={e => setAdditionalFiles(Array.from(e.target.files || []))} className="hidden" id="additional-upload" />
                      <label htmlFor="additional-upload" className="flex items-center justify-center gap-2.5 p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all"
                        style={{ borderColor: additionalFiles.length > 0 ? 'rgba(52,211,153,.42)' : 'rgba(255,255,255,.09)', background: additionalFiles.length > 0 ? 'rgba(52,211,153,.055)' : 'rgba(255,255,255,.02)' }}>
                        {additionalFiles.length > 0
                          ? <><FileText className="w-5 h-5" style={{ color: 'rgba(52,211,153,.8)' }} /><span className="text-sm" style={{ color: 'rgba(52,211,153,.8)' }}>{additionalFiles.length} file(s) selected</span></>
                          : <><Upload className="w-5 h-5" style={{ color: 'rgba(180,180,210,.32)' }} /><span className="text-sm" style={{ color: 'rgba(180,180,210,.38)' }}>Upload Additional Documents</span></>}
                      </label>
                    </div>
                  </div>
                </div>
              </GC>
            </SR>

            {/* Submit */}
            <SR delay={0.25}>
              <GC>
                <div className="p-7 md:p-9 space-y-4">
                  <Button type="button" onClick={() => setShowWhatsAppModal(true)}
                    className="w-full h-14 text-sm font-bold rounded-2xl text-white border-0"
                    style={{ background: 'linear-gradient(110deg,#22c55e,#16a34a)', boxShadow: '0 0 28px rgba(34,197,94,.18)' }}>
                    <img src="/whatsapp.webp" alt="WhatsApp" className="w-5 h-5 mr-2" /> Join WhatsApp Updates
                  </Button>
                  <Button type="submit" disabled={isSubmitting}
                    className="w-full h-14 text-sm font-bold rounded-2xl text-white border-0"
                    style={{ background: 'linear-gradient(110deg,#f97316,#e84393,#a78bfa)', boxShadow: '0 0 40px rgba(232,67,147,.22)' }}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</> : <><Rocket className="mr-2 h-5 w-5" /> Apply to THRYLOS</>}
                  </Button>
                  <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,.055)' }}>
                    <p className="text-xs text-center flex items-center justify-center gap-2" style={{ color: 'rgba(180,180,210,.3)' }}>
                      <Shield className="w-3.5 h-3.5" style={{ color: 'rgba(52,211,153,.55)' }} /> All information shared is kept secure.
                    </p>
                  </div>
                </div>
              </GC>
            </SR>
          </form>
        </div>
      </section>

      {/* ════════════════════════════════════
          FAQ
      ════════════════════════════════════ */}
      <section className="relative z-10 py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <SR><H2>Frequently Asked <Grad>Questions</Grad></H2></SR>
            <SR delay={0.08}><Sub>Everything you need to know about applying at THRYLOS.</Sub></SR>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <SR key={i} delay={i * 0.055}>
                <div className="overflow-hidden rounded-2xl"
                  style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.07)', backdropFilter: 'blur(16px)' }}>
                  <button onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left gap-4">
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: '#e0e0f0' }}>{faq.q}</span>
                    <motion.div animate={{ rotate: openFaqIndex === i ? 180 : 0 }} transition={{ duration: 0.3 }} className="flex-shrink-0">
                      <ChevronDown className="w-4 h-4" style={{ color: 'rgba(167,139,250,.65)' }} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaqIndex === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease }}>
                        <p className="px-5 pb-5" style={{ fontSize: 13, lineHeight: 1.72, color: 'rgba(180,180,210,.48)' }}>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* ── Status Tracker Modal ── */}
      <Dialog open={showStatusTracker} onOpenChange={setShowStatusTracker}>
        <DialogContent className="max-w-md rounded-3xl" style={{ background: '#11121e', border: '1px solid rgba(255,255,255,.1)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontSize: '1.2rem', color: '#f0f0f8' }}>
              <Target className="w-5 h-5" style={{ color: 'rgba(167,139,250,.8)' }} /> Track Your Application
            </DialogTitle>
            <DialogDescription style={{ color: 'rgba(180,180,210,.5)', fontSize: 13 }}>Enter the email you used to apply</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input value={trackerEmail} onChange={e => setTrackerEmail(e.target.value)} placeholder="your@email.com"
              className="h-11 rounded-xl" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#e0e0f0' }} />
            <Button onClick={handleTrackApplication} disabled={trackerLoading || !trackerEmail}
              className="w-full h-11 rounded-xl text-white border-0"
              style={{ background: 'linear-gradient(110deg,#7c3aed,#a78bfa)' }}>
              {trackerLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />} Track Application
            </Button>
            {trackerResult && trackerResult !== 'not_found' && trackerResult !== 'error' && (
              <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f0f8' }}>{trackerResult.full_name}</span>
                  <span style={{ fontSize: 11.5, color: 'rgba(167,139,250,.8)' }}>{trackerResult.role}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {STATUS_STEPS.map((step, i) => {
                    const currentIdx = STATUS_STEPS.indexOf(trackerResult.status === 'rejected' ? 'pending' : trackerResult.status);
                    const done = i <= currentIdx;
                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ background: done ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(255,255,255,.06)', fontSize: 11, fontWeight: 700, color: done ? '#fff' : 'rgba(180,180,210,.38)' }}>
                            {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                          </div>
                          <span style={{ fontSize: 9, color: done ? 'rgba(52,211,153,.8)' : 'rgba(180,180,210,.32)' }}>{STATUS_LABELS[step]}</span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: i < currentIdx ? 'rgba(52,211,153,.45)' : 'rgba(255,255,255,.07)' }} />}
                      </React.Fragment>
                    );
                  })}
                </div>
                {trackerResult.status === 'rejected' && <p style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>Unfortunately your application was not selected. You are welcome to apply again.</p>}
                <p style={{ fontSize: 10, color: 'rgba(180,180,210,.28)', textAlign: 'center' }}>Applied on {new Date(trackerResult.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            )}
            {trackerResult === 'not_found' && <p style={{ fontSize: 13, color: 'rgba(180,180,210,.5)', textAlign: 'center' }}>No application found with this email.</p>}
            {trackerResult === 'error' && <p style={{ fontSize: 13, color: '#f87171', textAlign: 'center' }}>Something went wrong. Please try again.</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── WhatsApp Modal ── */}
      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent className="rounded-3xl" style={{ background: '#11121e', border: '1px solid rgba(255,255,255,.1)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontSize: '1.2rem', color: '#f0f0f8' }}>
              <img src="/whatsapp.webp" alt="WhatsApp" className="w-5 h-5" /> Join WhatsApp Updates
            </DialogTitle>
            <DialogDescription style={{ color: 'rgba(180,180,210,.5)', fontSize: 13 }}>Get real-time hiring updates and announcements</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[{ href: whatsappLinks.channel, label: 'Channel', sub: 'Official Updates' }, { href: whatsappLinks.community, label: 'Community', sub: 'Connect & Discuss' }].map(w => (
              <a key={w.href} href={w.href} target="_blank" rel="noopener noreferrer" onClick={() => setShowWhatsAppModal(false)}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl cursor-pointer transition-all hover:scale-105"
                style={{ background: 'rgba(34,197,94,.07)', border: '1px solid rgba(34,197,94,.18)' }}>
                <img src="/whatsapp.webp" alt={w.label} className="w-12 h-12 object-contain" />
                <div className="text-center">
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f0f8' }}>{w.label}</p>
                  <p style={{ fontSize: 11, marginTop: 4, color: 'rgba(180,180,210,.42)' }}>{w.sub}</p>
                </div>
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════
          FOOTER
      ════════════════════════════════════ */}
     {/* Footer */}
         <footer className="relative py-16 px-4 border-t border-border">
           <div className="max-w-4xl mx-auto">
             <div className="text-center space-y-8">
               <Link to="/">
                 <h3 className="text-4xl font-extrabold tracking-wide text-transparent bg-clip-text inline-block cursor-pointer hover:scale-105 transition-transform"
                   style={{ fontFamily: "'Nixmat', sans-serif", backgroundImage: 'linear-gradient(90deg, #f97316 0%, #ec4899 50%, #3b82f6 100%)' }}>
                   THRYLOS
                 </h3>
               </Link>
               <p className="text-xl text-foreground/80 font-medium">Building India's Tech Future, One Innovation at a Time</p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 text-muted-foreground">
                 <a href="mailto:hr@thrylos.in" className="flex items-center gap-2 hover:text-foreground transition-colors"><Mail className="w-4 h-4" /> hr@thrylos.in</a>
                 <span className="hidden sm:block">·</span>
                 <a href="mailto:careers@thrylos.in" className="flex items-center gap-2 hover:text-foreground transition-colors"><Mail className="w-4 h-4" /> careers@thrylos.in</a>
                 <span className="hidden sm:block">·</span>
                 <a href="mailto:support@thrylos.in" className="flex items-center gap-2 hover:text-foreground transition-colors"><Mail className="w-4 h-4" /> support@thrylos.in</a>
               </div>
               <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                 <Link to="/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link>
                 <span>·</span>
                 <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
               </div>
               <div className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
               <div className="space-y-2">
                 <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60">
                   <span>A</span>
                    <span className="font-bold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text" style={{ fontFamily: "'Merlin', cursive" }}>misterutsav</span>
                   <span>PRODUCT</span>
                   <Heart className="h-3 w-3 text-destructive fill-destructive animate-pulse" />
                 </div>
                 <p className="text-xs text-muted-foreground/40">&copy; {new Date().getFullYear()} THRYLOS INDIA. All rights reserved.</p>
               </div>
             </div>
           </div>
         </footer>
      </div>
    );
  };

export default Careers;

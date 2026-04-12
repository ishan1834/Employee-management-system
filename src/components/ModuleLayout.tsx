import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileBottomNav from '@/components/MobileBottomNav';
import { cn } from "@/lib/utils";

interface ModuleLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  accentGradient?: string;
  badge?: string;
}

/* ── Thin animated top progress bar ── */
const PageLoader: React.FC = () => {
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    const sequence = [
      { w: 30, t: 0 },
      { w: 70, t: 100 },
      { w: 100, t: 400 }
    ];
    
    const timers = sequence.map(s => setTimeout(() => setWidth(s.w), s.t));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-[2px] z-[999] transition-all duration-500 ease-out pointer-events-none"
      style={{
        width: `${width}%`,
        background: 'linear-gradient(90deg, #6366f1, #38bdf8, #6366f1)',
        boxShadow: '0 0 10px rgba(99,102,241,0.6)',
        opacity: width === 100 ? 0 : 1,
      }}
    />
  );
};

const ModuleLayout: React.FC<ModuleLayoutProps> = ({
  title,
  description,
  children,
  actions,
  icon,
  accentGradient = 'from-indigo-500 to-sky-400',
  badge,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  /* Memoized breadcrumb calculation */
  const moduleCrumb = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last) return title;
    return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }, [location.pathname, title]);

  return (
    <>
      <PageLoader />

      <div className="min-h-screen selection:bg-indigo-500/30 text-slate-200"
           style={{ background: 'radial-gradient(at top left, #0d0d12 0%, #07070a 100%)' }}>
        
        {/* ── HERO HEADER ── */}
        <header className="relative pt-6 pb-8 border-b border-white/[0.04]">
          {/* Ambient background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[120%] bg-indigo-500/5 blur-[120px] rounded-full" />
            <div className="absolute top-0 right-0 w-[30%] h-[100%] bg-sky-500/5 blur-[100px] rounded-full" />
            <div className="absolute inset-0 opacity-[0.015]" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.826 10.558c1.026 1.312 1.594 2.977 1.594 4.685V20H60v-4.757c0-2.433-.808-4.805-2.29-6.696l-2.884 2.011zM6.19 4.636L9.074 2.625A11.066 11.066 0 0 0 2.29 9.304l2.884 2.01c1.027-1.31 2.45-2.22 4.016-2.678z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} 
            />
          </div>

          <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
            
            {/* ── BREADCRUMB ── */}
            <nav className={cn(
              "flex items-center gap-2 mb-6 text-[11px] font-semibold tracking-widest uppercase transition-all duration-700",
              mounted ? "opacity-50 translate-y-0" : "opacity-0 -translate-y-2"
            )}>
              <button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" />
                DASHBOARD
              </button>
              <ChevronRight className="w-3 h-3 opacity-30" />
              <span className="text-indigo-400">{moduleCrumb}</span>
            </nav>

            {/* ── TITLE ROW ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className={cn(
                "flex items-start gap-5 transition-all duration-700 delay-100",
                mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              )}>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="group flex-shrink-0 mt-1 w-11 h-11 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/20 flex items-center justify-center transition-all active:scale-95 shadow-xl"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-4">
                    {icon && (
                      <div className={cn("p-2.5 rounded-2xl bg-gradient-to-br shadow-lg flex-shrink-0", accentGradient)}>
                        <div className="text-white drop-shadow-md">{icon}</div>
                      </div>
                    )}
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none">
                      {title}
                    </h1>
                    {badge && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        {badge}
                      </span>
                    )}
                  </div>
                  {description && (
                    <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
                      {description}
                    </p>
                  )}
                  <div className={cn("h-1 w-12 rounded-full bg-gradient-to-r opacity-50", accentGradient)} />
                </div>
              </div>

              {actions && (
                <div className={cn(
                  "flex items-center gap-3 transition-all duration-700 delay-200",
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}>
                  {actions}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── CONTENT AREA ── */}
        <main className={cn(
          "px-4 sm:px-6 lg:px-8 py-8 max-w-[1600px] mx-auto transition-all duration-1000 delay-300",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <div className="group relative rounded-[2rem] border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl overflow-hidden shadow-2xl">
            {/* Top accent light */}
            <div className={cn("absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent")} />
            
            {/* Content wrapper */}
            <div className="p-6 sm:p-8 min-h-[400px]">
              {children}
            </div>
          </div>
        </main>

        {/* ── MOBILE NAV ── */}
        {isMobile && (
          <div className="h-24">
            <MobileBottomNav />
          </div>
        )}
      </div>
    </>
  );
};

export default ModuleLayout;

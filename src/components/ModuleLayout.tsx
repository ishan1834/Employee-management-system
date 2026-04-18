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

/* ── Page Loader ── */
const PageLoader: React.FC = () => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setWidth(30), 0),
      setTimeout(() => setWidth(70), 100),
      setTimeout(() => setWidth(100), 400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-[2px] z-[999] transition-all duration-500 ease-out"
      style={{
        width: `${width}%`,
        background: 'linear-gradient(90deg,#6366f1,#38bdf8,#6366f1)',
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

  /* 🔥 Dynamic Page Title */
  useEffect(() => {
    document.title = `${title} • Admin Panel`;
  }, [title]);

  /* ⌨️ Keyboard Shortcut (Back) */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        navigate('/dashboard');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  /* Breadcrumb */
  const moduleCrumb = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return last
      ? last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : title;
  }, [location.pathname, title]);

  return (
    <>
      <PageLoader />

      <div
        className="min-h-screen text-slate-200"
        style={{
          background:
            'radial-gradient(at top left, #0d0d12 0%, #07070a 100%)',
        }}
      >

        {/* HEADER */}
        <header className="relative pt-6 pb-8 border-b border-white/[0.04] group">

          {/* Glow hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.08), transparent 60%)',
            }}
          />

          <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">

            {/* BREADCRUMB */}
            <nav className={cn(
              "flex items-center gap-2 mb-6 text-[11px] font-semibold tracking-widest uppercase transition-all duration-700",
              mounted ? "opacity-50" : "opacity-0"
            )}>
              <button
                onClick={() => navigate('/dashboard')}
                className="hover:text-white flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                DASHBOARD
              </button>

              <ChevronRight className="w-3 opacity-30" />

              {/* Active crumb highlight */}
              <span className="text-indigo-400 font-bold tracking-wide">
                {moduleCrumb}
              </span>
            </nav>

            {/* TITLE */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

              <div className={cn(
                "flex items-start gap-5 transition-all duration-700",
                mounted ? "opacity-100" : "opacity-0"
              )}>

                {/* BACK BUTTON */}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="group w-11 h-11 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.08] flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </button>

                <div>
                  <div className="flex items-center gap-4">

                    {icon && (
                      <div className={cn(
                        "p-2.5 rounded-2xl bg-gradient-to-br shadow-lg",
                        accentGradient
                      )}>
                        {icon}
                      </div>
                    )}

                    <h1 className="text-3xl sm:text-4xl font-bold">
                      {title}
                    </h1>

                    {badge && (
                      <span className="px-2 py-1 text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full">
                        {badge}
                      </span>
                    )}
                  </div>

                  {description && (
                    <p className="text-sm text-slate-500 mt-2 max-w-xl">
                      {description}
                    </p>
                  )}

                  <div className={cn(
                    "h-1 w-12 rounded-full mt-2 opacity-60 bg-gradient-to-r",
                    accentGradient
                  )} />
                </div>
              </div>

              {actions && (
                <div className="flex items-center gap-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className={cn(
          "px-4 sm:px-6 lg:px-8 py-8 max-w-[1600px] mx-auto transition-all duration-700",
          mounted ? "opacity-100" : "opacity-0"
        )}>
          <div className="relative rounded-[2rem] border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl">

            {/* glow */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition duration-500 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(56,189,248,0.05), transparent 70%)',
              }}
            />

            <div className="p-6 sm:p-8 min-h-[400px]">
              {children}
            </div>
          </div>
        </main>

        {/* MOBILE NAV */}
        {isMobile && (
          <div className="h-20">
            <MobileBottomNav />
          </div>
        )}
      </div>
    </>
  );
};

export default ModuleLayout;

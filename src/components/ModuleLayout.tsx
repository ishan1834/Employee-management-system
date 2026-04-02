




import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileBottomNav from '@/components/MobileBottomNav';

interface ModuleLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  /** Optional icon to display next to the title */
  icon?: React.ReactNode;
  /** Optional accent color class e.g. "from-indigo-500 to-violet-500" */
  accentGradient?: string;
  /** Optional tag/badge text shown beside the title */
  badge?: string;
}

/* ── thin animated top progress bar ── */
const PageLoader: React.FC = () => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    setWidth(30);
    const t1 = setTimeout(() => setWidth(70), 100);
    const t2 = setTimeout(() => setWidth(100), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div
      className="fixed top-0 left-0 h-[2px] z-[999] transition-all duration-500 ease-out"
      style={{
        width: `${width}%`,
        background: 'linear-gradient(90deg, #6366f1, #38bdf8, #6366f1)',
        boxShadow: '0 0 8px rgba(99,102,241,0.8)',
        opacity: width === 100 ? 0 : 1,
        transition: 'width 0.5s ease-out, opacity 0.4s ease 0.5s',
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  /* derive breadcrumb segment from URL */
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const moduleCrumb = pathSegments[pathSegments.length - 1]
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) || title;

  return (
    <>
      <PageLoader />

      <div
        className="min-h-screen overflow-x-hidden"
        style={{ background: 'linear-gradient(160deg, #090909 0%, #0a0a0f 60%, #08080e 100%)' }}
      >
        {/* ── HERO HEADER ── */}
        <div className="relative overflow-hidden">
          {/* Ambient glow blobs */}
          <div
            className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)`,
              filter: 'blur(50px)',
            }}
          />
          <div
            className="absolute -top-10 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }}
          />

          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-8">
            {/* ── BREADCRUMB ── */}
            <div
              className="flex items-center gap-1.5 mb-5 text-[11px] font-medium tracking-wide"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(-6px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}
            >
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-300 transition-colors"
              >
                <LayoutDashboard className="w-3 h-3" />
                <span>Dashboard</span>
              </button>
              <ChevronRight className="w-3 h-3 text-gray-700" />
              <span className="text-gray-400">{moduleCrumb}</span>
            </div>

            {/* ── TITLE ROW ── */}
            <div className="flex items-start justify-between gap-4">
              <div
                className="flex items-start gap-4 min-w-0"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.45s ease 0.05s, transform 0.45s ease 0.05s',
                }}
              >
                {/* Back button */}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 flex items-center justify-center transition-all active:scale-90"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                >
                  <ArrowLeft className="w-4 h-4 text-gray-300" />
                </button>

                <div className="min-w-0">
                  {/* Icon + title */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {icon && (
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${accentGradient} flex-shrink-0`}
                        style={{ boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
                      >
                        <span className="text-white">{icon}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                      <h1
                        className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none truncate"
                        style={{ fontFeatureSettings: '"ss01" 1' }}
                      >
                        {title}
                      </h1>
                      {badge && (
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border flex-shrink-0"
                          style={{
                            background: 'rgba(99,102,241,0.12)',
                            borderColor: 'rgba(99,102,241,0.25)',
                            color: '#a5b4fc',
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {description && (
                    <p className="text-[13px] text-gray-500 mt-2 leading-relaxed max-w-lg">
                      {description}
                    </p>
                  )}

                  {/* Accent rule under title */}
                  <div
                    className={`mt-3 h-px w-16 rounded-full bg-gradient-to-r ${accentGradient} opacity-60`}
                  />
                </div>
              </div>

              {/* ── ACTIONS ── */}
              {actions && (
                <div
                  className="flex items-center gap-2 flex-shrink-0"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateX(0)' : 'translateX(12px)',
                    transition: 'opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s',
                  }}
                >
                  {actions}
                </div>
              )}
            </div>
          </div>

          {/* Bottom border with gradient fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent 100%)',
            }}
          />
        </div>

        {/* ── CONTENT AREA ── */}
        <div
          ref={contentRef}
          className="px-4 sm:px-6 lg:px-8 py-6"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s',
          }}
        >
          {/* Content card */}
          <div
            className="rounded-2xl border border-white/[0.07] overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Inner top shimmer line */}
            <div
              className={`h-[1px] w-full bg-gradient-to-r ${accentGradient} opacity-20`}
            />

            <div className="p-4 sm:p-6 overflow-x-auto">
              {children}
            </div>
          </div>
        </div>

        {/* ── MOBILE NAV ── */}
        {isMobile && (
          <div className="pb-24">
            <MobileBottomNav />
          </div>
        )}
      </div>
    </>
  );
};

export default ModuleLayout;

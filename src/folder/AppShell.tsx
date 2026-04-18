




import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { signOut } from "@/lib/auth";
import { examLabel } from "@/lib/exams";
import {
  LayoutDashboard, ClipboardList, BarChart3, CalendarDays, Bookmark,
  Users, Trophy, Settings, HelpCircle, GraduationCap, Flame, LogOut, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV_MAIN: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tests", label: "Take Test", icon: ClipboardList },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/planner", label: "Study Planner", icon: CalendarDays },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
];
const NAV_COMMUNITY: NavItem[] = [
  { to: "/forum", label: "Forum", icon: Users },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];
const NAV_ACCOUNT: NavItem[] = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/support", label: "Support", icon: HelpCircle },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && profile && !profile.onboarding_complete && location.pathname !== "/onboarding") {
      navigate({ to: "/onboarding" });
    }
  }, [user, profile, loading, navigate, location.pathname]);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const name = profile?.full_name || user?.email?.split("@")[0] || "Aspirant";
  const initials = (name.split(" ").map((p) => p[0]).join("").slice(0, 2) || "A").toUpperCase();
  const examTag = profile?.primary_exam ? `${examLabel(profile.primary_exam)} · ${profile.target_year ?? ""}` : "Set up your profile";

  async function handleLogout() {
    await signOut();
    navigate({ to: "/" });
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;

  const SidebarBody = (
    <>
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber text-amber-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-semibold">KalyanTestLabs</span>
      </div>

      <div className="px-5 pb-4">
        <Link to="/settings" className="flex items-center gap-3 rounded-xl p-2 -mx-2 transition hover:bg-sidebar-accent">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={name} className="h-10 w-10 rounded-full bg-sidebar-accent object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-amber text-sm font-semibold text-amber-foreground">{initials}</div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{name}</div>
            <div className="truncate text-xs text-amber">{examTag}</div>
          </div>
        </Link>

        <div className="mt-3 rounded-xl bg-sidebar-accent p-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-wider text-sidebar-foreground/70">
            <span>Streak</span>
            <span className="inline-flex items-center gap-1 text-amber"><Flame className="h-3 w-3" /> {profile?.current_streak ?? 0}d</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-sidebar-border">
            <div className="h-full bg-amber transition-all" style={{ width: `${Math.min(100, ((profile?.current_streak ?? 0) / 30) * 100)}%` }} />
          </div>
          <div className="mt-1.5 text-[10px] text-sidebar-foreground/60">Best: {profile?.longest_streak ?? 0}d · Goal {profile?.daily_goal_hours ?? 2}h/day</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        <NavGroup title="Main Menu" items={NAV_MAIN} pathname={location.pathname} />
        <NavGroup title="Community" items={NAV_COMMUNITY} pathname={location.pathname} />
        <NavGroup title="Account" items={NAV_ACCOUNT} pathname={location.pathname} />
      </nav>

      <button onClick={handleLogout} className="mx-3 mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-foreground">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-72 flex-col bg-sidebar text-sidebar-foreground shadow-elegant">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"><X className="h-4 w-4" /></button>
            {SidebarBody}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-secondary"><Menu className="h-5 w-5" /></button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background"><GraduationCap className="h-4 w-4" /></div>
              <span className="font-display font-semibold">KalyanTestLabs</span>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { to: "/dashboard", label: "Dashboard" },
              { to: "/tests", label: "Tests" },
              { to: "/analytics", label: "Analytics" },
              { to: "/forum", label: "Community" },
              { to: "/leaderboard", label: "Leaderboard" },
            ].map((n) => (
              <Link key={n.to} to={n.to}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  location.pathname === n.to ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >{n.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1 text-xs font-semibold text-amber-foreground sm:inline-flex">
              <Flame className="h-3.5 w-3.5 text-amber" /> {profile?.current_streak ?? 0} day streak
            </div>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-amber text-sm font-semibold text-amber-foreground shadow-amber">{initials}</div>
            )}
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavGroup({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <div>
      <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/50">{title}</div>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <li key={item.to}>
              <Link to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition", active ? "bg-amber text-amber-foreground" : "bg-sidebar-border/40 group-hover:bg-sidebar-border/70")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-amber" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

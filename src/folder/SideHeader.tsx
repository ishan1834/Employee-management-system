



import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { user, profile, loading } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const name = profile?.full_name || user?.email?.split("@")[0] || "Aspirant";
  const initials = (name.split(" ").map((p) => p[0]).join("").slice(0, 2) || "A").toUpperCase();

  async function handleLogout() {
    await signOut();
    setOpen(false);
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-slate text-amber shadow-soft">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            KalyanTestLabs
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <a href="#features" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Features</a>
          <a href="#tracks" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Exam Tracks</a>
          <a href="#pricing" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((v) => !v)}
                className={cn("flex items-center gap-2 rounded-full border border-border bg-card/60 px-2 py-1 pr-3 text-sm font-medium shadow-soft transition hover:bg-card", open && "bg-card")}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={name} className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-amber text-xs font-semibold text-amber-foreground">{initials}</span>
                )}
                <span className="hidden max-w-[120px] truncate sm:inline">{name}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition", open && "rotate-180")} />
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-elegant">
                  <div className="border-b border-border px-3 py-2">
                    <div className="truncate text-sm font-medium">{name}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

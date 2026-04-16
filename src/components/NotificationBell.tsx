import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, ChevronRight, Home, Settings, User, 
  Zap, Users, Shield, Circle, Moon, Coffee, 
  Search, Bell 
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { roleNames } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import NotificationBell from '@/components/NotificationBell';

// ─── Types & Constants ────────────────────────────────────────────────────────

export const ADMIN_STATUSES = ['online', 'away', 'busy'] as const;
export type AdminStatus = typeof ADMIN_STATUSES[number];

const ROUTE_LABELS: Record<string, string> = {
  esports: 'eSports Management',
  users: 'User Directory',
  settings: 'System Settings',
  analytics: 'Data Insights',
};

const QUICK_ACTIONS = [
  { label: 'Dashboard', shortcut: 'G D', keys: ['g', 'd'], icon: <Home className="w-3.5 h-3.5" />, path: '/' },
  { label: 'eSports', shortcut: 'G E', keys: ['g', 'e'], icon: <Zap className="w-3.5 h-3.5" />, path: '/esports' },
  { label: 'Admins', shortcut: 'G A', keys: ['g', 'a'], icon: <Shield className="w-3.5 h-3.5" />, path: '/admins' },
  { label: 'Settings', shortcut: 'G S', keys: ['g', 's'], icon: <Settings className="w-3.5 h-3.5" />, path: '/settings' },
];

const STATUS_CONFIG: Record<AdminStatus, { label: string; color: string; icon: React.ReactNode }> = {
  online: { label: 'Online', color: 'bg-green-500', icon: <Circle className="w-3 h-3 fill-green-500 text-green-500" /> },
  away: { label: 'Away', color: 'bg-yellow-500', icon: <Moon className="w-3 h-3 text-yellow-500" /> },
  busy: { label: 'DND', color: 'bg-red-500', icon: <Coffee className="w-3 h-3 text-red-500" /> },
};

// ─── Styled Components ────────────────────────────────────────────────────────

const AnimatedLogo = memo(() => (
  <div className="flex items-center gap-3 group cursor-pointer">
    <div className="relative">
      <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-md group-hover:bg-orange-500/40 transition-all" />
      <img
        src="/thrylosindia.png"
        alt="Logo"
        className="relative w-9 h-9 rounded-full border border-white/10 shadow-2xl transition-transform group-hover:scale-105"
      />
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-xl font-black tracking-tighter italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-400 to-orange-600">
        ThryLos
      </span>
      <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
        Admin Core
      </span>
    </div>
  </div>
));
AnimatedLogo.displayName = 'AnimatedLogo';

// ─── Main Header Component ────────────────────────────────────────────────────

const Header: React.FC = () => {
  const { user, adminProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [status, setStatus] = useState<AdminStatus>(
    () => (localStorage.getItem('adminStatus') as AdminStatus) || 'online'
  );

  const handleStatusChange = useCallback((newStatus: AdminStatus) => {
    setStatus(newStatus);
    localStorage.setItem('adminStatus', newStatus);
  }, []);

  // Keyboard Shortcuts (G + key)
  useEffect(() => {
    let lastKey = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      if (lastKey === 'g') {
        const action = QUICK_ACTIONS.find(a => a.keys[1] === key);
        if (action) {
          e.preventDefault();
          navigate(action.path);
        }
      }
      lastKey = key;
      setTimeout(() => { if (lastKey === key) lastKey = ''; }, 500);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Breadcrumb Logic
  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    return segments.map((seg, i) => ({
      label: ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      path: '/' + segments.slice(0, i + 1).join('/'),
    }));
  }, [location.pathname]);

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Section: Branding & Navigation */}
            <div className="flex items-center gap-8 min-w-0">
              <div onClick={() => navigate('/')}>
                <AnimatedLogo />
              </div>

              <nav className="hidden lg:flex items-center gap-2 text-sm">
                <div className="h-4 w-[1px] bg-zinc-800 mx-2" />
                <Home className="w-4 h-4 text-zinc-600" />
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.path}>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
                    <button
                      onClick={() => navigate(crumb.path)}
                      className={`transition-colors truncate max-w-[150px] ${
                        i === breadcrumbs.length - 1 
                          ? 'text-zinc-200 font-semibold' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {crumb.label}
                    </button>
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Right Section: System Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {user && adminProfile ? (
                <>
                  <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9 text-zinc-400 hover:bg-white/5 rounded-xl">
                    <Search className="w-4 h-4" />
                  </Button>

                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-orange-500 hover:bg-orange-500/10 rounded-xl">
                            <Zap className="w-4 h-4 fill-orange-500/20" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-zinc-900 border-zinc-800 text-[10px] font-bold">
                        QUICK NAV
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-white/5 shadow-2xl">
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-500">Jump To</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/5" />
                      {QUICK_ACTIONS.map((action) => (
                        <DropdownMenuItem key={action.path} onClick={() => navigate(action.path)} className="gap-3 py-2 cursor-pointer">
                          <span className="p-1.5 bg-zinc-900 rounded-lg text-zinc-400">{action.icon}</span>
                          <span className="text-sm font-medium">{action.label}</span>
                          <DropdownMenuShortcut className="font-mono text-[10px] opacity-50">{action.shortcut}</DropdownMenuShortcut>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <NotificationBell />

                  <div className="w-[1px] h-6 bg-white/5 mx-1 hidden sm:block" />

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 pl-1 pr-3 gap-3 hover:bg-white/5 rounded-2xl transition-all group">
                        <div className="relative">
                          <Avatar className="h-8 w-8 border border-white/10 group-hover:border-orange-500/50 transition-colors">
                            <AvatarImage src={adminProfile.avatar || undefined} />
                            <AvatarFallback className="bg-zinc-800 text-[10px] font-bold">
                              {adminProfile.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#050505] ${STATUS_CONFIG[status].color}`} />
                        </div>
                        <div className="text-left hidden md:block">
                          <p className="text-xs font-bold leading-none text-zinc-200">{adminProfile.name}</p>
                          <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-tighter">
                            {roleNames[adminProfile.role] || 'Administrator'}
                          </p>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-64 bg-zinc-950 border-white/5 p-2 shadow-2xl rounded-2xl">
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-2">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarImage src={adminProfile.avatar || undefined} />
                          <AvatarFallback>{adminProfile.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate text-white">{adminProfile.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{adminProfile.email}</p>
                        </div>
                      </div>

                      <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-500 px-2 py-1">Availability</DropdownMenuLabel>
                      <div className="grid grid-cols-3 gap-1 px-1 mb-2">
                        {(Object.entries(STATUS_CONFIG) as [AdminStatus, any][]).map(([key, cfg]) => (
                          <button
                            key={key}
                            onClick={() => handleStatusChange(key)}
                            className={`flex flex-col items-center gap-1.5 py-2 rounded-lg transition-all border ${
                              status === key ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' : 'border-transparent text-zinc-500 hover:bg-white/5'
                            }`}
                          >
                            {cfg.icon}
                            <span className="text-[9px] font-bold uppercase">{cfg.label}</span>
                          </button>
                        ))}
                      </div>

                      <DropdownMenuSeparator className="bg-white/5" />
                      
                      <DropdownMenuGroup className="p-1">
                        <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-3 py-2 rounded-lg cursor-pointer">
                          <User className="w-4 h-4 text-zinc-400" />
                          <span className="text-sm font-medium">Profile Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-3 py-2 rounded-lg cursor-pointer">
                          <Settings className="w-4 h-4 text-zinc-400" />
                          <span className="text-sm font-medium">System Settings</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator className="bg-white/5" />
                      
                      <DropdownMenuItem 
                        onClick={logout} 
                        className="gap-3 py-2 text-red-400 focus:text-red-400 focus:bg-red-400/10 rounded-lg cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-bold">Terminate Session</span>
                        <DropdownMenuShortcut className="text-red-900 opacity-50 font-mono">⇧ Q</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button 
                  onClick={() => navigate('/login')} 
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl px-6 h-9 transition-all active:scale-95"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};

export default Header;

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, ChevronRight, Home, Settings, User, 
  Zap, Users, Shield, Circle, Moon, Coffee, 
  Command, Search, Bell
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { roleNames } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

  // Keyboard Shortcuts Listener (G + Key)
  useEffect(() => {
    let lastKey = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (lastKey === 'g') {
        const action = QUICK_ACTIONS.find(a => a.keys[1] === key);
        if (action) {
          e.preventDefault();
          navigate(action.path);
        }
      }
      lastKey = key;
      setTimeout(() => { if(lastKey === key) lastKey = ''; }, 500);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Breadcrumb Logic
  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    return segments.map((seg, i) => ({
      label: ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
      path: '/' + segments.slice(0, i + 1).join('/'),
    }));
  }, [location.pathname]);

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-

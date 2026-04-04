



import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo
} from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Send, Users, X, Smile, Paperclip, MessageCircle,
  CheckCheck, Loader2, Camera, Search, Trash2, Copy, Reply,
  ChevronDown, Bell, BellOff, RefreshCw, Zap, Download,
  Pin, Hash, AtSign,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { roleNames } from '@/types/auth';
import { castToAdminProfiles } from '@/utils/adminTypeCasting';

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES  — THRYLOS dark-cinematic identity
// cyan #00f5ff · violet #7c3aed · pure black bg
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');

  .tc { font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif; -webkit-font-smoothing:antialiased; }

  :root {
    --tc-bg0:#000000;
    --tc-bg1:#060608;
    --tc-bg2:#0a0a0f;
    --tc-bg3:#0f0f18;
    --tc-bg4:#13131e;
    --tc-bg5:#1a1a28;
    --tc-border:rgba(255,255,255,0.05);
    --tc-border-md:rgba(255,255,255,0.09);
    --tc-border-hi:rgba(255,255,255,0.16);
    --tc-t0:rgba(255,255,255,0.95);
    --tc-t1:rgba(255,255,255,0.70);
    --tc-t2:rgba(255,255,255,0.38);
    --tc-t3:rgba(255,255,255,0.18);
    --tc-cyan:#00f5ff;
    --tc-violet:#7c3aed;
    --tc-cyan-dim:rgba(0,245,255,0.10);
    --tc-violet-dim:rgba(124,58,237,0.10);
    --tc-accent:linear-gradient(135deg,#00f5ff 0%,#7c3aed 100%);
    --tc-own-bg:linear-gradient(140deg,rgba(0,245,255,0.13) 0%,rgba(124,58,237,0.16) 100%);
    --tc-own-border:rgba(0,245,255,0.20);
    --tc-online:#22c55e;
    --tc-away:#f59e0b;
    --tc-offline:#2d2d44;
  }

  /* ── Shell ── */
  .tc-shell {
    position:relative;
    display:flex; flex-direction:column;
    width:100%;
    height:calc(100dvh - 130px);
    min-height:540px;
    background:var(--tc-bg0);
    border-radius:20px;
    overflow:hidden;
    border:1px solid var(--tc-border-md);
    box-shadow:0 0 0 1px rgba(0,245,255,0.04), 0 40px 120px rgba(0,0,0,0.8);
  }
  @media(max-width:768px){ .tc-shell{ height:calc(100dvh - 88px); border-radius:14px; } }

  /* scanline atmosphere */
  .tc-shell::before {
    content:''; position:absolute; inset:0; pointer-events:none; z-index:1;
    background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px);
  }

  /* ── Inner row ── */
  .tc-inner{ display:flex; flex:1; min-height:0; overflow:hidden; position:relative; z-index:2; }

  /* ── Sidebar (members) ── */
  .tc-sidebar-panel{
    width:252px; flex-shrink:0;
    display:flex; flex-direction:column;
    background:var(--tc-bg1);
    border-right:1px solid var(--tc-border);
    overflow:hidden;
  }

  /* ── Chat column ── */
  .tc-chat-col{ flex:1; min-width:0; display:flex; flex-direction:column; overflow:hidden; }

  /* ── Header ── */
  .tc-header{
    flex-shrink:0;
    display:flex; align-items:center; gap:10px;
    padding:11px 16px;
    background:rgba(0,0,0,0.75);
    backdrop-filter:blur(32px) saturate(160%);
    -webkit-backdrop-filter:blur(32px) saturate(160%);
    border-bottom:1px solid var(--tc-border);
    z-index:10;
  }

  /* ── Messages ── */
  .tc-messages{
    flex:1; min-height:0;
    overflow-y:auto; overflow-x:hidden;
    padding:6px 0 4px;
    background:
      radial-gradient(ellipse 80% 40% at 8% 8%,rgba(0,245,255,0.04) 0%,transparent 60%),
      radial-gradient(ellipse 60% 45% at 92% 88%,rgba(124,58,237,0.05) 0%,transparent 60%),
      var(--tc-bg0);
  }
  .tc-messages::-webkit-scrollbar{ width:2px; }
  .tc-messages::-webkit-scrollbar-track{ background:transparent; }
  .tc-messages::-webkit-scrollbar-thumb{ background:rgba(255,255,255,0.06); border-radius:99px; }
  @media(max-width:768px){ .tc-messages{ -webkit-overflow-scrolling:touch; } }

  /* ── Input zone — always pinned to bottom ── */
  .tc-input-zone{
    flex-shrink:0;
    padding:10px 14px 12px;
    background:var(--tc-bg0);
    border-top:1px solid var(--tc-border);
    position:relative; z-index:5;
  }
  @supports(padding-bottom:env(safe-area-inset-bottom)){
    .tc-input-zone{ padding-bottom:calc(12px + env(safe-area-inset-bottom)); }
  }

  /* ── Pinned banner ── */
  .tc-pinned{
    flex-shrink:0;
    display:flex; align-items:center; gap:9px;
    padding:7px 16px;
    background:rgba(0,245,255,0.03);
    border-bottom:1px solid rgba(0,245,255,0.07);
    animation:tc-in .25s ease both;
  }

  /* ── Animations ── */
  @keyframes tc-in{ from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes tc-ping{ 0%,100%{transform:scale(1);opacity:.7} 60%{transform:scale(2.2);opacity:0} }
  @keyframes tc-shimmer{ from{background-position:-600px 0} to{background-position:600px 0} }
  @keyframes tc-dot{ 0%,80%,100%{transform:scale(.65);opacity:.35} 40%{transform:scale(1);opacity:1} }
  @keyframes tc-pop{ 0%{transform:scale(.82);opacity:0} 70%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
  @keyframes tc-notif{ 0%{opacity:0;transform:translateX(-50%) translateY(-14px)} 12%{opacity:1;transform:translateX(-50%) translateY(0)} 85%{opacity:1;transform:translateX(-50%) translateY(0)} 100%{opacity:0;transform:translateX(-50%) translateY(-10px)} }
  @keyframes tc-lb{ from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
  @keyframes spin{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes live-pulse{ 0%,100%{opacity:1} 50%{opacity:0.25} }

  .tc-msg{ animation:tc-in .22s cubic-bezier(.34,1.4,.64,1) both; }
  .tc-skel{ background:linear-gradient(90deg,rgba(255,255,255,.025) 0%,rgba(255,255,255,.06) 50%,rgba(255,255,255,.025) 100%); background-size:600px 100%; animation:tc-shimmer 1.6s linear infinite; border-radius:12px; }
  .tc-lb-img{ animation:tc-lb .22s cubic-bezier(.34,1.3,.64,1) both; }

  /* ── Bubble styles ── */
  .tc-own {
    position:relative;
    background:var(--tc-own-bg);
    border:1px solid var(--tc-own-border);
    border-radius:18px 18px 4px 18px;
  }
  .tc-other {
    position:relative;
    background:var(--tc-bg3);
    border:1px solid var(--tc-border-md);
    border-radius:18px 18px 18px 4px;
  }

  /* ── Input bar ── */
  .tc-bar{
    display:flex; align-items:flex-end; gap:7px;
    background:var(--tc-bg2);
    border:1px solid var(--tc-border-md);
    border-radius:18px;
    padding:6px 6px 6px 12px;
    transition:border-color .2s, box-shadow .2s;
  }
  .tc-bar:focus-within{
    border-color:rgba(0,245,255,0.30);
    box-shadow:0 0 0 3px rgba(0,245,255,0.06), 0 4px 24px rgba(0,245,255,0.04);
  }

  /* ── Textarea ── */
  .tc-ta{
    flex:1; background:transparent; border:none; outline:none; resize:none;
    color:var(--tc-t0); font-size:14px;
    font-family:'DM Sans',sans-serif; font-weight:400;
    line-height:1.5; max-height:120px; min-height:22px;
    padding:2px 0; overflow-y:auto;
  }
  .tc-ta::placeholder{ color:var(--tc-t3); }
  .tc-ta::-webkit-scrollbar{ width:0; }

  /* ── Icon button ── */
  .tc-ib{
    display:inline-flex; align-items:center; justify-content:center;
    border-radius:10px; color:var(--tc-t2);
    transition:background .14s,color .14s,transform .1s;
    flex-shrink:0; cursor:pointer; border:none; background:transparent;
  }
  .tc-ib:hover{ background:rgba(255,255,255,0.06); color:var(--tc-t0); }
  .tc-ib:active{ transform:scale(.88); }
  .tc-ib:disabled{ opacity:.3; cursor:not-allowed; }

  /* ── Send button ── */
  .tc-send{
    width:38px; height:38px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; cursor:pointer; border:none;
    transition:transform .15s,box-shadow .15s;
    align-self:flex-end;
  }
  .tc-send-on{
    background:var(--tc-accent);
    box-shadow:0 4px 16px rgba(0,245,255,0.22);
    color:#000;
  }
  .tc-send-on:hover{ transform:scale(1.07); }
  .tc-send-on:active{ transform:scale(.92); }
  .tc-send-off{ background:rgba(255,255,255,.04); color:rgba(255,255,255,.16); cursor:default; }

  /* ── Context menu ── */
  .tc-ctx{
    position:fixed; z-index:200;
    background:var(--tc-bg2); border:1px solid var(--tc-border-md);
    border-radius:16px; padding:6px; min-width:182px;
    box-shadow:0 20px 60px rgba(0,0,0,.85);
    animation:tc-pop .14s ease both;
  }
  .tc-ctx-item{
    display:flex; align-items:center; gap:10px;
    padding:9px 12px; border-radius:10px;
    font-size:13px; color:var(--tc-t1);
    cursor:pointer; transition:background .12s,color .12s;
    font-family:'DM Sans',sans-serif; border:none; background:transparent;
    width:100%; text-align:left;
  }
  .tc-ctx-item:hover{ background:rgba(255,255,255,.06); color:#fff; }
  .tc-ctx-item.danger{ color:#f87171; }
  .tc-ctx-item.danger:hover{ background:rgba(248,113,113,.08); }
  .tc-ctx-sep{ height:1px; background:var(--tc-border); margin:4px 0; }

  /* ── Reply bar (inside input zone) ── */
  .tc-reply-bar{
    display:flex; align-items:center; gap:8px;
    padding:8px 12px; margin-bottom:7px;
    background:var(--tc-cyan-dim);
    border:1px solid rgba(0,245,255,0.12);
    border-radius:12px;
    animation:tc-in .17s ease both;
  }

  /* ── Date pill ── */
  .tc-datepill{
    display:inline-flex; align-items:center;
    padding:3px 13px;
    background:var(--tc-bg2); border:1px solid var(--tc-border-md);
    border-radius:99px; font-size:9.5px; font-weight:700;
    letter-spacing:.09em; text-transform:uppercase; color:var(--tc-t3);
    font-family:'Syne',sans-serif;
  }

  /* ── Scroll-to-bottom ── */
  .tc-stb{
    position:absolute; bottom:80px; right:16px; z-index:20;
    display:flex; align-items:center; gap:6px;
    padding:7px 14px;
    background:var(--tc-bg2); border:1px solid var(--tc-border-hi);
    border-radius:99px; font-size:12px; font-weight:600;
    color:var(--tc-t0); cursor:pointer;
    box-shadow:0 4px 20px rgba(0,0,0,.6);
    animation:tc-in .2s ease both; border:none;
    font-family:'Syne',sans-serif;
  }
  .tc-stb:hover{ border-color:var(--tc-cyan); color:var(--tc-cyan); }

  /* ── Member row ── */
  .tc-mrow{
    display:flex; align-items:center; gap:9px;
    padding:7px 10px; border-radius:10px;
    cursor:pointer; transition:background .14s;
    margin:0 4px;
  }
  .tc-mrow:hover{ background:rgba(255,255,255,.04); }

  /* ── Sidebar scrollable list ── */
  .tc-slist{ flex:1; overflow-y:auto; padding:4px 0 12px; }
  .tc-slist::-webkit-scrollbar{ width:2px; }
  .tc-slist::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.05); border-radius:99px; }

  /* ── Search overlay ── */
  .tc-search-overlay{
    position:absolute; inset:0; z-index:60;
    background:rgba(0,0,0,.97);
    display:flex; flex-direction:column;
    animation:tc-in .18s ease both;
  }

  /* ── Notification toast ── */
  .tc-notif{
    position:fixed; top:16px; left:50%; z-index:400;
    background:var(--tc-bg2); border:1px solid rgba(0,245,255,0.18);
    border-radius:16px; padding:10px 14px;
    display:flex; align-items:center; gap:10px;
    box-shadow:0 8px 32px rgba(0,0,0,.7);
    animation:tc-notif 3.5s ease forwards;
    min-width:240px; max-width:340px; pointer-events:none;
  }

  /* ── Photo bubble ── */
  .tc-photo img{
    display:block; border-radius:14px; object-fit:cover;
    max-width:240px; max-height:280px; cursor:zoom-in;
    transition:opacity .16s,transform .16s;
  }
  .tc-photo img:hover{ opacity:.88; transform:scale(.98); }

  /* ── Kbd ── */
  .tc-kbd{
    font-size:9px; font-family:'JetBrains Mono',monospace;
    background:rgba(255,255,255,.06); border-radius:4px;
    padding:1px 4px; border:1px solid rgba(255,255,255,.09);
    color:var(--tc-t2);
  }

  /* ── Typing indicator ── */
  .tc-typing-bubble{
    display:inline-flex; align-items:center; gap:4px;
    padding:9px 14px;
    background:var(--tc-bg3); border:1px solid var(--tc-border-md);
    border-radius:18px 18px 18px 4px;
  }
  .tc-t-dot{ width:5px; height:5px; border-radius:50%; background:var(--tc-t2); }
  .tc-t-dot:nth-child(1){ animation:tc-dot 1.2s ease infinite 0s; }
  .tc-t-dot:nth-child(2){ animation:tc-dot 1.2s ease infinite .18s; }
  .tc-t-dot:nth-child(3){ animation:tc-dot 1.2s ease infinite .36s; }

  /* ── Emoji reaction chips ── */
  .tc-reaction{
    display:inline-flex; align-items:center; gap:3px;
    padding:2px 8px; border-radius:99px;
    background:var(--tc-bg4); border:1px solid var(--tc-border-md);
    font-size:12px; cursor:pointer;
    transition:background .14s,border-color .14s;
    animation:tc-pop .14s ease both;
  }
  .tc-reaction:hover{ background:var(--tc-bg5); border-color:var(--tc-border-hi); }
  .tc-reaction.mine{ background:var(--tc-cyan-dim); border-color:rgba(0,245,255,0.22); }
  .tc-reaction-count{ font-size:10.5px; color:var(--tc-t2); font-family:'Syne',sans-serif; font-weight:600; }

  /* ── Live pill ── */
  .tc-live{
    display:flex; align-items:center; gap:4px;
    padding:3px 9px; border-radius:99px;
    background:rgba(34,197,94,.07); border:1px solid rgba(34,197,94,.18);
    font-size:9.5px; font-weight:700; color:#4ade80;
    letter-spacing:.07em; font-family:'Syne',sans-serif;
  }
  .tc-live-dot{ width:5px; height:5px; border-radius:50%; background:#4ade80; animation:live-pulse 2s ease infinite; }

  /* ── Sidebar header brand ── */
  .tc-brand{
    font-family:'Syne',sans-serif;
    font-size:17px; font-weight:800; letter-spacing:.1em;
    text-transform:uppercase;
    background:linear-gradient(135deg,#00f5ff,#a78bfa);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type UserRole = string;

/* =========================
   Chat
========================= */

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;

  sender?: {
    name: string;
    role: UserRole;
    avatar?: string;
  };
}

/* =========================
   Admin
========================= */

interface AdminProfile {
  id: string;
  user_id: string | null;

  name: string;
  email: string;
  role: UserRole;

  avatar: string | null;
  is_active: boolean;

  last_login: string | null;
  created_at: string;
  updated_at: string;
}

/* =========================
   UI State
========================= */

interface CtxMenu {
  x: number;
  y: number;
  msg: ChatMessage;
  isOwn: boolean;
}
// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
type UserRole = string;

type RoleConfig = {
  grad: string;
  color: string;
  dot: string;
  pillBg: string;
  pillColor: string;
  pillBorder: string;
};

type Status = 'online' | 'away' | 'offline';

/* =========================
   Role Config
========================= */

const ROLE_CFG: Record<UserRole, RoleConfig> = {
  super_admin: {
    grad: 'linear-gradient(135deg,#f43f5e,#fb923c)',
    color: '#fb923c',
    dot: '#f43f5e',
    pillBg: 'rgba(244,63,94,0.1)',
    pillColor: '#fda4af',
    pillBorder: 'rgba(244,63,94,0.2)',
  },
  admin: {
    grad: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
    color: '#a78bfa',
    dot: '#8b5cf6',
    pillBg: 'rgba(139,92,246,0.1)',
    pillColor: '#c4b5fd',
    pillBorder: 'rgba(139,92,246,0.2)',
  },
  tech: {
    grad: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
    color: '#38bdf8',
    dot: '#3b82f6',
    pillBg: 'rgba(59,130,246,0.1)',
    pillColor: '#93c5fd',
    pillBorder: 'rgba(59,130,246,0.2)',
  },
  content: {
    grad: 'linear-gradient(135deg,#10b981,#14b8a6)',
    color: '#34d399',
    dot: '#10b981',
    pillBg: 'rgba(16,185,129,0.1)',
    pillColor: '#6ee7b7',
    pillBorder: 'rgba(16,185,129,0.2)',
  },
  design: {
    grad: 'linear-gradient(135deg,#ec4899,#d946ef)',
    color: '#f472b6',
    dot: '#ec4899',
    pillBg: 'rgba(236,72,153,0.1)',
    pillColor: '#f9a8d4',
    pillBorder: 'rgba(236,72,153,0.2)',
  },
  moderator: {
    grad: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    color: '#fbbf24',
    dot: '#f59e0b',
    pillBg: 'rgba(245,158,11,0.1)',
    pillColor: '#fcd34d',
    pillBorder: 'rgba(245,158,11,0.2)',
  },
  hr: {
    grad: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    color: '#fbbf24',
    dot: '#f59e0b',
    pillBg: 'rgba(245,158,11,0.1)',
    pillColor: '#fcd34d',
    pillBorder: 'rgba(245,158,11,0.2)',
  },
};

const DEFAULT_ROLE_CFG: RoleConfig = {
  grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  color: '#a78bfa',
  dot: '#6366f1',
  pillBg: 'rgba(99,102,241,0.1)',
  pillColor: '#c4b5fd',
  pillBorder: 'rgba(99,102,241,0.2)',
};

const rCfg = (r: string): RoleConfig => ROLE_CFG[r] ?? DEFAULT_ROLE_CFG;

/* =========================
   Utils
========================= */

const inits = (n: string) =>
  n
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const fmtDate = (d: string) => {
  const dd = new Date(d);
  const now = new Date();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (dd.toDateString() === now.toDateString()) return 'Today';
  if (dd.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return dd.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const onlineSt = (last: string | null, isMe: boolean): Status => {
  if (isMe) return 'online';
  if (!last) return 'offline';

  const minutes = (Date.now() - new Date(last).getTime()) / 60000;

  if (minutes < 10) return 'online';
  if (minutes < 60) return 'away';
  return 'offline';
};

const ST: Record<Status, string> = {
  online: '#22c55e',
  away: '#f59e0b',
  offline: '#2d2d44',
};

const isImg = (m: string) => m.startsWith('📷 Shared an image:');

const getUrl = (m: string) =>
  m.replace('📷 Shared an image: ', '');

const REPLY_PREFIX = '↩REPLY:';

const PINNED_MSG =
  'Sprint retro tomorrow 11 AM — all hands required 📌';

const EMOJIS = [
  '👍', '🔥', '🚀', '💯', '✅', '❤️',
  '😂', '👀', '🎯', '⚡', '🙌', '💬',
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Online dot ──
const OnlineDot = memo(
  ({ status }: { status: 'online' | 'away' | 'offline' }) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 11,
      height: 11,
      borderRadius: '50%',
      border: '2px solid #000',
      background: ST[status],
      zIndex: 1,
    };

    const pingStyle: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      background: ST.online,
      animation: 'tc-ping 2.4s cubic-bezier(0,0,.2,1) infinite',
    };

    return (
      <span style={baseStyle}>
        {status === 'online' && <span style={pingStyle} />}
      </span>
    );
  }
);
// ── Avatar block ──
const AdminAv = memo(({ admin, size = 34 }: { admin: Partial<AdminProfile> & { name: string; role: string }; size?: number }) => {
  const cfg = rCfg(admin.role);
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: cfg.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      {admin.avatar
        ? <img src={admin.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.33, fontWeight: 700, color: '#fff', fontFamily: "'Syne',sans-serif" }}>{inits(admin.name)}</span>
      }
    </div>
  );
});

// ── Member row in sidebar ──
const MemberRow = memo(
  ({ admin, isMe }: { admin: AdminProfile; isMe: boolean }) => {
    const st = onlineSt(admin.last_login, isMe);
    const cfg = rCfg(admin.role);

    const roleLabel = (
      roleNames[admin.role as keyof typeof roleNames] ?? admin.role
    )
      .split(' ')[0];

    const nameStyle: React.CSSProperties = {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'rgba(255,255,255,.88)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      lineHeight: 1.3,
      margin: 0,
    };

    const youStyle: React.CSSProperties = {
      color: 'rgba(255,255,255,.25)',
      fontWeight: 400,
      fontSize: 10.5,
      marginLeft: 4,
    };

    const statusStyle: React.CSSProperties = {
      fontSize: 10.5,
      color:
        st === 'online'
          ? '#4ade80'
          : st === 'away'
          ? '#fbbf24'
          : 'rgba(255,255,255,.2)',
      lineHeight: 1.3,
      margin: 0,
    };

    const roleStyle: React.CSSProperties = {
      fontSize: 8.5,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '.07em',
      padding: '2px 6px',
      borderRadius: 5,
      background: cfg.pillBg,
      color: cfg.pillColor,
      border: `1px solid ${cfg.pillBorder}`,
      flexShrink: 0,
      fontFamily: "'Syne',sans-serif",
    };

    return (
      <div className="tc-mrow">
        {/* Avatar + Status */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <AdminAv admin={admin} size={32} />
          <OnlineDot status={st} />
        </div>

        {/* Name + Status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={nameStyle}>
            {admin.name}
            {isMe && <span style={youStyle}>(you)</span>}
          </p>

          <p style={statusStyle}>
            {st === 'online'
              ? 'Active now'
              : st === 'away'
              ? 'Away'
              : 'Offline'}
          </p>
        </div>

        {/* Role Badge */}
        <span style={roleStyle}>{roleLabel}</span>
      </div>
    );
  }
);

// ── Members panel ──
const MembersPanel = memo(({ admins, meId, onlineCount }: { admins: AdminProfile[]; meId: string; onlineCount: number }) => {
  const [q, setQ] = useState('');
  const f = useMemo(() => admins.filter(a => a.name.toLowerCase().includes(q.toLowerCase())), [admins, q]);
  const online = f.filter(a => onlineSt(a.last_login, a.id === meId) === 'online');
  const offline = f.filter(a => onlineSt(a.last_login, a.id === meId) !== 'online');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand + count */}
      <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid rgba(255,255,255,.04)', flexShrink: 0 }}>
        <div className="tc-brand" style={{ marginBottom: 2 }}>THRYLOS</div>
        <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,.28)', margin: '0 0 10px', letterSpacing: '.04em' }}>Admin Dashboard</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users style={{ width: 15, height: 15, color: '#00f5ff', opacity: .8 }} />
          </div>
          <div>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.88)', lineHeight: 1.2, margin: 0 }}>Team Members</p>
            <p style={{ fontSize: 10.5, color: '#4ade80', lineHeight: 1.2, margin: 0 }}>{onlineCount} online · {admins.length} total</p>
          </div>
        </div>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '6px 10px' }}>
          <Search style={{ width: 12, height: 12, color: 'rgba(255,255,255,.22)', flexShrink: 0 }} />
          <input
            placeholder="Search members…" value={q} onChange={e => setQ(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: 'rgba(255,255,255,.7)', fontFamily: "'DM Sans',sans-serif" }}
          />
        </div>
      </div>
      <div className="tc-slist">
        {online.length > 0 && <>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.18)', textTransform: 'uppercase', letterSpacing: '.1em', padding: '10px 14px 4px', margin: 0, fontFamily: "'Syne',sans-serif" }}>Online — {online.length}</p>
          {online.map(a => <MemberRow key={a.id} admin={a} isMe={a.id === meId} />)}
        </>}
        {offline.length > 0 && <>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.18)', textTransform: 'uppercase', letterSpacing: '.1em', padding: '12px 14px 4px', margin: 0, fontFamily: "'Syne',sans-serif" }}>Offline — {offline.length}</p>
          {offline.map(a => <MemberRow key={a.id} admin={a} isMe={a.id === meId} />)}
        </>}
        {f.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.18)', fontSize: 12, padding: '24px 0', margin: 0 }}>No members found</p>}
      </div>
    </div>
  );
});

// ── Date divider ──
const DateDivider = memo(
  ({ label }: { label: string }) => {
    const containerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '16px 16px 8px',
    };

    const lineStyleLeft: React.CSSProperties = {
      flex: 1,
      height: 1,
      background:
        'linear-gradient(90deg,transparent,rgba(255,255,255,.05))',
    };

    const lineStyleRight: React.CSSProperties = {
      flex: 1,
      height: 1,
      background:
        'linear-gradient(270deg,transparent,rgba(255,255,255,.05))',
    };

    return (
      <div style={containerStyle}>
        <div style={lineStyleLeft} />
        <span className="tc-datepill">{label}</span>
        <div style={lineStyleRight} />
      </div>
    );
  }
);

// ── Message types ──
type MsgWithMeta = ChatMessage & {
  showAvatar: boolean;
  showName: boolean;
  replyInfo: { id: string; name: string; text: string } | null;
  reactions: { emoji: string; users: string[] }[];
};

// ── Message bubble ──
const Bubble = memo(({
  msg, isOwn, meProfile, onImg, onCtx, onReply, onReact
}: {
  msg: MsgWithMeta; isOwn: boolean; meProfile: AdminProfile | null;
  onImg: (u: string) => void;
  onCtx: (e: React.MouseEvent, m: ChatMessage, o: boolean) => void;
  onReply: (m: ChatMessage) => void;
  onReact: (msgId: string, emoji: string) => void;
}) => {
  const [showReactPicker, setShowReactPicker] = useState(false);
  const cfg = rCfg(isOwn ? meProfile?.role ?? '' : msg.sender?.role ?? '');
  const senderName = isOwn ? meProfile?.name ?? 'You' : msg.sender?.name ?? 'Unknown';
  const senderAvatar = isOwn ? meProfile?.avatar : msg.sender?.avatar;
  const isImage = isImg(msg.message);
  const imgUrl = isImage ? getUrl(msg.message) : null;
  const roleLabel = (roleNames[(isOwn ? meProfile?.role : msg.sender?.role) as keyof typeof roleNames] ?? (isOwn ? meProfile?.role : msg.sender?.role) ?? '').split(' ')[0];

  return (
    <div
      className="tc-msg"
      style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: isOwn ? 'row-reverse' : 'row', padding: `${msg.showAvatar ? '2px' : '1px'} 14px` }}
      onContextMenu={e => { e.preventDefault(); onCtx(e, msg, isOwn); }}
    >
      {/* Avatar col */}
      <div style={{ width: 32, flexShrink: 0, alignSelf: 'flex-end' }}>
        {msg.showAvatar && (
          <div style={{ position: 'relative' }}>
            <AdminAv admin={{ name: senderName, role: isOwn ? meProfile?.role ?? '' : msg.sender?.role ?? '', avatar: senderAvatar }} size={32} />
          </div>
        )}
      </div>

      {/* Content stack */}
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '72%', alignItems: isOwn ? 'flex-end' : 'flex-start', position: 'relative' }}>
        {/* Sender name */}
        {msg.showName && !isOwn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, paddingLeft: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, fontFamily: "'Syne',sans-serif" }}>{senderName}</span>
            <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,.22)', textTransform: 'uppercase', letterSpacing: '.09em', fontWeight: 600 }}>{roleLabel}</span>
          </div>
        )}

        {/* Reply preview */}
        {msg.replyInfo && (
          <div style={{ marginBottom: 4, padding: '5px 10px', borderRadius: 9, background: 'rgba(255,255,255,.04)', borderLeft: `2.5px solid ${cfg.color}`, maxWidth: '100%' }}>
            <p style={{ fontSize: 10, color: cfg.color, fontWeight: 700, margin: '0 0 1px', fontFamily: "'Syne',sans-serif" }}>{msg.replyInfo.name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.38)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 210 }}>{msg.replyInfo.text}</p>
          </div>
        )}

        {/* Bubble */}
        {isImage && imgUrl ? (
          <div className="tc-photo">
            <img
              src={imgUrl} alt="Shared"
              style={{ borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px' }}
              onClick={() => onImg(imgUrl)}
            />
          </div>
        ) : (
          <div
            className={isOwn ? 'tc-own' : 'tc-other'}
            style={{ padding: '9px 13px', maxWidth: '100%', wordBreak: 'break-word' }}
          >
            <p style={{ fontSize: 13.5, lineHeight: 1.56, color: isOwn ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.86)', whiteSpace: 'pre-wrap', margin: 0, fontWeight: 400 }}>
              {msg.message}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 }}>
              <span style={{ fontSize: 10, color: isOwn ? 'rgba(0,245,255,0.35)' : 'rgba(255,255,255,.2)', fontFamily: "'JetBrains Mono',monospace" }}>{fmtTime(msg.created_at)}</span>
              {isOwn && <CheckCheck style={{ width: 12, height: 12, color: 'rgba(0,245,255,0.55)' }} />}
            </div>
          </div>
        )}

        {/* Reactions */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
            {msg.reactions.map(r => (
              <div
                key={r.emoji}
                className={`tc-reaction${r.users.includes('me') ? ' mine' : ''}`}
                onClick={() => onReact(msg.id, r.emoji)}
              >
                <span>{r.emoji}</span>
                <span className="tc-reaction-count">{r.users.length}</span>
              </div>
            ))}
            <div className="tc-reaction" style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); setShowReactPicker(v => !v); }}>
              +
            </div>
          </div>
        )}

        {/* Inline reaction picker */}
        {showReactPicker && (
          <div style={{
            position: 'absolute', zIndex: 50,
            bottom: 'calc(100% + 8px)', [isOwn ? 'right' : 'left']: 0,
            background: 'var(--tc-bg2)', border: '1px solid var(--tc-border-md)',
            borderRadius: 14, padding: '8px', display: 'flex', flexWrap: 'wrap', gap: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,.7)', animation: 'tc-pop .14s ease both',
            maxWidth: 240,
          }} onClick={e => e.stopPropagation()}>
            {EMOJIS.map(e => (
              <button key={e} style={{ fontSize: 18, cursor: 'pointer', padding: '4px 5px', borderRadius: 8, border: 'none', background: 'transparent', transition: 'background .1s', lineHeight: 1 }}
                onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(255,255,255,.07)')}
                onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                onClick={() => { onReact(msg.id, e); setShowReactPicker(false); }}>{e}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ── Skeleton loading ──
const Skeletons = () => (
  <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
    {[{ w: 160, o: false }, { w: 220, o: true }, { w: 130, o: false }, { w: 185, o: true }, { w: 110, o: false }, { w: 200, o: true }].map(({ w, o }, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: 9, flexDirection: o ? 'row-reverse' : 'row' }}>
        <div className="tc-skel" style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0 }} />
        <div className="tc-skel" style={{ width: w, height: o ? 36 : 44, borderRadius: o ? '16px 16px 4px 16px' : '16px 16px 16px 4px' }} />
      </div>
    ))}
  </div>
);

// ── Context menu ──
const CtxMenuEl = ({ ctx, onClose, onCopy, onDelete, onReply }: { ctx: CtxMenu; onClose: () => void; onCopy: () => void; onDelete: () => void; onReply: () => void; }) => {
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, [onClose]);
  return (
    <div className="tc-ctx" style={{ left: Math.min(ctx.x, window.innerWidth - 195), top: Math.min(ctx.y, window.innerHeight - 160) }} onClick={e => e.stopPropagation()}>
      <button className="tc-ctx-item" onClick={() => { onReply(); onClose(); }}><Reply style={{ width: 14, height: 14, opacity: .5 }} /> Reply</button>
      <button className="tc-ctx-item" onClick={() => { onCopy(); onClose(); }}><Copy style={{ width: 14, height: 14, opacity: .5 }} /> Copy text</button>
      {ctx.isOwn && <>
        <div className="tc-ctx-sep" />
        <button className="tc-ctx-item danger" onClick={() => { onDelete(); onClose(); }}><Trash2 style={{ width: 14, height: 14 }} /> Delete for everyone</button>
      </>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const TeamChat: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();

  // ── State ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [ctx, setCtx] = useState<CtxMenu | null>(null);
  const [replyMsg, setReplyMsg] = useState<ChatMessage | null>(null);
  const [unread, setUnread] = useState(0);
  const [atBottom, setAtBottom] = useState(true);
  const [notif, setNotif] = useState<{ name: string; text: string } | null>(null);
  const [muted, setMuted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  // Local reactions (stored per-session; real impl would be a separate table)
  const [reactions, setReactions] = useState<Record<string, { emoji: string; users: string[] }[]>>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const endRef = useRef<HTMLDivElement>(null);
  const msgsEl = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const autoGrow = useCallback(() => {
    const el = taRef.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  const scrollDown = useCallback((smooth = true) => {
    endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const handleScroll = useCallback(() => {
    const el = msgsEl.current; if (!el) return;
    const atB = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(atB);
    if (atB) setUnread(0);
  }, []);

  // ── Fetch messages from Supabase ──
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, sender:admins!sender_id(name,role,avatar)')
      .order('created_at', { ascending: true })
      .limit(300);
    if (!error && data) {
      const newMsgs = data as ChatMessage[];
      setMessages(prev => {
        if (prev.length > 0 && newMsgs.length > prev.length) {
          const newest = newMsgs[newMsgs.length - 1];
          if (newest.sender_id !== adminProfile?.id && !muted) {
            const txt = isImg(newest.message) ? '📷 Shared a photo' : newest.message.replace(/↩REPLY:[^\n]*\n/, '').slice(0, 60);
            setNotif({ name: newest.sender?.name ?? 'Someone', text: txt });
            setTimeout(() => setNotif(null), 3500);
          }
          const el = msgsEl.current;
          const isB = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 100 : true;
          if (!isB && newest.sender_id !== adminProfile?.id) setUnread(u => u + 1);
        }
        return newMsgs;
      });
    }
    setLoading(false);
  }, [adminProfile?.id, muted]);

  // ── Fetch admins from Supabase ──
  const fetchAdmins = useCallback(async () => {
    const { data } = await supabase.from('admins').select('*').eq('is_active', true).order('name');
    if (data) setAdmins(castToAdminProfiles(data));
  }, []);

  // ── Mount: fetch + realtime subscribe ──
  useEffect(() => {
    fetchMessages();
    fetchAdmins();
    if (adminProfile?.id) {
      supabase.from('admins').update({ last_login: new Date().toISOString() }).eq('id', adminProfile.id);
    }
    const ch = supabase
      .channel('tc-v4')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, fetchMessages)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, fetchMessages)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchMessages, fetchAdmins, adminProfile?.id]);

  useEffect(() => { if (!loading) scrollDown(false); }, [loading]);
  useEffect(() => { if (atBottom) scrollDown(true); }, [messages]);

  // ── Send message ──
  const send = useCallback(async () => {
    const t = text.trim();
    if (!t || !adminProfile || sending) return;
    setSending(true);
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
    let finalMsg = t;
    if (replyMsg) {
      const rName = replyMsg.sender?.name ?? adminProfile?.name ?? 'Unknown';
      const rText = isImg(replyMsg.message) ? '📷 Photo' : replyMsg.message.replace(/↩REPLY:[^\n]*\n/, '').slice(0, 60);
      finalMsg = `${REPLY_PREFIX}${replyMsg.id}|${rName}|${rText}\n${t}`;
    }
    setReplyMsg(null);
    try {
      const { error } = await supabase.from('chat_messages').insert({ sender_id: adminProfile.id, message: finalMsg } as any);
      if (error) throw error;
      scrollDown(true);
    } catch {
      toast({ title: 'Failed to send', description: 'Check your connection.', variant: 'destructive' });
      setText(t);
    } finally {
      setSending(false);
      taRef.current?.focus();
    }
  }, [text, adminProfile, sending, toast, replyMsg, scrollDown]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── Delete ──
  const deleteMsg = useCallback(async (id: string) => {
    const { error } = await supabase.from('chat_messages').delete().eq('id', id);
    if (error) toast({ title: 'Could not delete', variant: 'destructive' });
    else toast({ title: 'Message deleted' });
  }, [toast]);

  // ── Copy ──
  const copyMsg = useCallback((msg: ChatMessage) => {
    const t = isImg(msg.message) ? getUrl(msg.message) : msg.message.replace(/↩REPLY:[^\n]*\n/, '');
    navigator.clipboard.writeText(t).then(() => toast({ title: 'Copied to clipboard' }));
  }, [toast]);

  // ── Reaction (session-local) ──
  const handleReact = useCallback((msgId: string, emoji: string) => {
    setReactions(prev => {
      const msgR = prev[msgId] ?? [];
      const ex = msgR.find(r => r.emoji === emoji);
      if (ex) {
        const users = ex.users.includes('me') ? ex.users.filter(u => u !== 'me') : [...ex.users, 'me'];
        const updated = users.length === 0 ? msgR.filter(r => r.emoji !== emoji) : msgR.map(r => r.emoji === emoji ? { ...r, users } : r);
        return { ...prev, [msgId]: updated };
      }
      return { ...prev, [msgId]: [...msgR, { emoji, users: ['me'] }] };
    });
  }, []);

  // ── Upload image ──
  const uploadImg = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminProfile) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Select an image', variant: 'destructive' }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Image must be under 5 MB', variant: 'destructive' }); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `chat_images/${adminProfile.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
      const { error: msgErr } = await supabase.from('chat_messages').insert({ sender_id: adminProfile.id, message: `📷 Shared an image: ${publicUrl}` } as any);
      if (msgErr) throw msgErr;
      await supabase.from('uploaded_files').insert({ name: file.name, file_path: path, file_size: file.size, mime_type: file.type, uploaded_by: adminProfile.id } as any);
      scrollDown(true);
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  }, [adminProfile, toast, scrollDown]);

  // ── Derived ──
  const onlineCount = useMemo(() =>
    admins.filter(a => onlineSt(a.last_login, a.id === adminProfile?.id) === 'online').length,
    [admins, adminProfile?.id]
  );

  // Group messages by date + compute metadata
  const grouped = useMemo(() => {
    const out: { date: string; msgs: MsgWithMeta[] }[] = [];
    let lastDate = '';
    messages.forEach((m, i) => {
      let displayMsg = { ...m };
      let replyInfo: MsgWithMeta['replyInfo'] = null;
      if (m.message.startsWith(REPLY_PREFIX)) {
        const nl = m.message.indexOf('\n');
        if (nl > -1) {
          const meta = m.message.slice(REPLY_PREFIX.length, nl).split('|');
          replyInfo = { id: meta[0] ?? '', name: meta[1] ?? 'Unknown', text: meta[2] ?? '' };
          displayMsg = { ...m, message: m.message.slice(nl + 1) };
        }
      }
      const date = fmtDate(m.created_at);
      const prev = messages[i - 1], next = messages[i + 1];
      const samePrev = prev?.sender_id === m.sender_id && fmtDate(prev.created_at) === date;
      const sameNext = next?.sender_id === m.sender_id && fmtDate(next.created_at) === date;
      if (date !== lastDate) { out.push({ date, msgs: [] }); lastDate = date; }
      out[out.length - 1].msgs.push({
        ...displayMsg,
        showAvatar: !sameNext,
        showName: !samePrev,
        replyInfo,
        reactions: reactions[m.id] ?? [],
      });
    });
    return out;
  }, [messages, reactions]);

  // Search
  const searchResults = useMemo(() => {
    if (!searchQ.trim()) return [];
    return messages.filter(m => !isImg(m.message) && m.message.replace(/↩REPLY:[^\n]*\n/, '').toLowerCase().includes(searchQ.toLowerCase())).slice(-30);
  }, [messages, searchQ]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>






      

      {/* Notification toast */}
      {notif && (
        <div className="tc-notif">
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--tc-cyan-dim)', border: '1px solid rgba(0,245,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageCircle style={{ width: 15, height: 15, color: '#00f5ff' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.9)', margin: '0 0 1px', fontFamily: "'Syne',sans-serif" }}>{notif.name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{notif.text}</p>
          </div>
        </div>
      )}





      
      {/* Context menu */}
      {ctx && (
        <CtxMenuEl
          ctx={ctx} onClose={() => setCtx(null)}
          onCopy={() => copyMsg(ctx.msg)}
          onDelete={() => deleteMsg(ctx.msg.id)}
          onReply={() => setReplyMsg(ctx.msg)}
        />
      )}

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent style={{ maxWidth: 'min(90vw,860px)', maxHeight: '92vh', padding: 0, background: 'rgba(0,0,0,.98)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 22, overflow: 'hidden' }}>
          <DialogClose style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 15, height: 15, color: '#fff' }} />
          </DialogClose>
          {lightbox && (
            <a href={lightbox} download target="_blank" rel="noreferrer" style={{ position: 'absolute', top: 12, right: 54, zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download style={{ width: 14, height: 14, color: '#fff' }} />
            </a>
          )}
          {lightbox && <img src={lightbox} alt="Full" className="tc-lb-img" style={{ width: '100%', maxHeight: '92vh', objectFit: 'contain' }} />}
        </DialogContent>
      </Dialog>

      <div className="tc">
        <ModuleLayout title="Team Chat" description="Real-time team communication">
          <div className="tc-shell">






            

            {/* ── Search overlay ── */}






            
            {searchOpen && (
              <div className="tc-search-overlay">
                <div style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 11, padding: '7px 12px' }}>
                    <Search style={{ width: 13, height: 13, color: 'rgba(255,255,255,.28)', flexShrink: 0 }} />
                    <input
                      placeholder="Search messages…" value={searchQ} onChange={e => setSearchQ(e.target.value)} autoFocus
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'rgba(255,255,255,.78)', fontFamily: "'DM Sans',sans-serif" }}
                    />
                  </div>
                  <button className="tc-ib" style={{ width: 36, height: 36 }} onClick={() => { setSearchOpen(false); setSearchQ(''); }}>
                    <X style={{ width: 15, height: 15 }} />
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                  {searchQ && searchResults.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,.2)', fontSize: 13 }}>No messages match "{searchQ}"</div>
                  )}
                  {searchResults.map(m => {
                    const isOwn = m.sender_id === adminProfile?.id;
                    const name = isOwn ? adminProfile?.name : m.sender?.name ?? 'Unknown';
                    const display = m.message.replace(/↩REPLY:[^\n]*\n/, '');
                    const cfg = rCfg(isOwn ? adminProfile?.role ?? '' : m.sender?.role ?? '');
                    return (
                      <div key={m.id} style={{ padding: '10px 12px', borderRadius: 12, marginBottom: 4, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: cfg.color, fontFamily: "'Syne',sans-serif" }}>{name}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.22)', fontFamily: "'JetBrains Mono',monospace" }}>{fmtTime(m.created_at)}</span>
                        </div>
                        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.55)', lineHeight: 1.45, margin: 0 }}>
                          {display.split(new RegExp(`(${searchQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, pi) =>
                            part.toLowerCase() === searchQ.toLowerCase()
                              ? <mark key={pi} style={{ background: 'rgba(0,245,255,0.18)', color: '#00f5ff', borderRadius: 3, padding: '0 2px' }}>{part}</mark>
                              : part
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Inner layout ── */}

            
            <div className="tc-inner">


              
              {/* Desktop sidebar */}
              <div className="tc-sidebar-panel hidden lg:flex">
                <MembersPanel admins={admins} meId={adminProfile?.id ?? ''} onlineCount={onlineCount} />
              </div>




              

              {/* Chat column */}



              
              <div className="tc-chat-col">




                
                {/* Header */}
                <div className="tc-header">
                  {/* Mobile members sheet trigger */}
                  <Sheet open={membersOpen} onOpenChange={setMembersOpen}>
                    <SheetTrigger asChild>
                      <button className="tc-ib lg:hidden" style={{ width: 36, height: 36 }}>
                        <Users style={{ width: 17, height: 17 }} />
                      </button>
                    </SheetTrigger>
                    <SheetContent side="left" style={{ padding: 0, width: 272, background: 'var(--tc-bg1)', border: '1px solid var(--tc-border)' }}>
                      <div style={{ height: '100%' }}>
                        <MembersPanel admins={admins} meId={adminProfile?.id ?? ''} onlineCount={onlineCount} />
                      </div>
                    </SheetContent>
                  </Sheet>







                  
                  {/* Channel icon */}
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Hash style={{ width: 16, height: 16, color: '#00f5ff', opacity: .85 }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.95)', lineHeight: 1.2, margin: 0, fontFamily: "'Syne',sans-serif", letterSpacing: '.04em' }}>
                      THRYLOS Team
                    </h2>
                    <p style={{ fontSize: 11, lineHeight: 1.3, margin: 0, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                      <span style={{ color: '#4ade80', fontWeight: 500 }}>{onlineCount} online</span>
                      <span style={{ color: 'rgba(255,255,255,.18)' }}>·</span>
                      <span style={{ color: 'rgba(255,255,255,.28)' }}>{admins.length} members</span>
                    </p>
                  </div>



                  

                  
                  {/* Header actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <div className="tc-live" style={{ marginRight: 6 }}>
                      <span className="tc-live-dot" />
                      LIVE
                    </div>
                    <button className="tc-ib" style={{ width: 34, height: 34 }} onClick={() => setSearchOpen(true)} title="Search messages">
                      <Search style={{ width: 15, height: 15 }} />
                    </button>
                    <button className="tc-ib" style={{ width: 34, height: 34 }}
                      onClick={() => { setMuted(m => !m); toast({ title: muted ? 'Notifications on' : 'Notifications muted' }); }}
                      title={muted ? 'Unmute' : 'Mute notifications'}>
                      {muted ? <BellOff style={{ width: 15, height: 15, color: '#fbbf24' }} /> : <Bell style={{ width: 15, height: 15 }} />}
                    </button>
                    <button className="tc-ib" style={{ width: 34, height: 34 }}
                      onClick={() => { setLoading(true); fetchMessages(); fetchAdmins(); }}
                      title="Refresh">
                      <RefreshCw style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>





                

                {/* Pinned banner */}
                <div className="tc-pinned">
                  <Pin style={{ width: 11, height: 11, color: '#00f5ff', opacity: .7, flexShrink: 0 }} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: '#00f5ff', opacity: .75, letterSpacing: '.06em', textTransform: 'uppercase', marginRight: 7, fontFamily: "'Syne',sans-serif" }}>Pinned</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{PINNED_MSG}</span>
                </div>





                

                {/* Messages */}
                <div ref={msgsEl} className="tc-messages" onScroll={handleScroll} style={{ position: 'relative' }}>
                  {loading ? (
                    <Skeletons />
                  ) : messages.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: '40px 20px', textAlign: 'center' }}>
                      <div style={{ width: 60, height: 60, borderRadius: 20, background: 'var(--tc-cyan-dim)', border: '1px solid rgba(0,245,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle style={{ width: 26, height: 26, color: 'rgba(0,245,255,0.6)' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.6)', margin: '0 0 4px', fontFamily: "'Syne',sans-serif" }}>No messages yet</p>
                        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.22)', margin: 0 }}>Be the first to say something 👋</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {grouped.map(({ date, msgs }) => (
                        <div key={date}>
                          <DateDivider label={date} />
                          {msgs.map(msg => (
                            <Bubble
                              key={msg.id} msg={msg}
                              isOwn={msg.sender_id === adminProfile?.id}
                              meProfile={adminProfile as AdminProfile | null}
                              onImg={setLightbox}
                              onCtx={(e, m, o) => setCtx({ x: e.clientX, y: e.clientY, msg: m, isOwn: o })}
                              onReply={setReplyMsg}
                              onReact={handleReact}
                            />
                          ))}
                        </div>
                      ))}





                      

                      {/* Typing indicator */}
                      {typingUsers.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '2px 14px 8px' }}>
                          <div style={{ width: 32, flexShrink: 0 }} />
                          <div>
                            <div className="tc-typing-bubble">
                              <div className="tc-t-dot" /><div className="tc-t-dot" /><div className="tc-t-dot" />
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.28)', marginLeft: 4 }}>{typingUsers.join(', ')} typing…</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={endRef} style={{ height: 4 }} />
                    </div>
                  )}
                </div>






                

                {/* Scroll to bottom */}
                {!atBottom && (
                  <button className="tc-stb" onClick={() => { scrollDown(true); setUnread(0); }}>
                    <ChevronDown style={{ width: 13, height: 13 }} />
                    {unread > 0 && (
                      <span style={{ background: 'var(--tc-cyan)', color: '#000', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{unread} new</span>
                    )}
                  </button>
                )}





                
                {/* Input zone */}
                <div className="tc-input-zone">
                  {/* Reply bar */}
                  {replyMsg && (
                    <div className="tc-reply-bar">
                      <Reply style={{ width: 13, height: 13, color: 'rgba(0,245,255,.75)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,245,255,.85)', margin: '0 0 1px', fontFamily: "'Syne',sans-serif" }}>Replying to {replyMsg.sender?.name ?? 'Unknown'}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isImg(replyMsg.message) ? '📷 Photo' : replyMsg.message.replace(/↩REPLY:[^\n]*\n/, '').slice(0, 80)}
                        </p>
                      </div>
                      <button className="tc-ib" style={{ width: 24, height: 24 }} onClick={() => setReplyMsg(null)}>
                        <X style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  )}








                  
                  {/* Input bar */}
                  <div className="tc-bar">
                    <button className="tc-ib" style={{ width: 36, height: 36 }} onClick={() => fileRef.current?.click()} disabled={uploading} title="Attach image">
                      {uploading
                        ? <Loader2 style={{ width: 16, height: 16, color: '#00f5ff', animation: 'spin 1s linear infinite' }} />
                        : <Paperclip style={{ width: 16, height: 16 }} />
                      }
                    </button>
                    <button className="tc-ib" style={{ width: 36, height: 36 }} onClick={() => fileRef.current?.click()} disabled={uploading} title="Camera">
                      <Camera style={{ width: 16, height: 16 }} />
                    </button>

                    <textarea
                      ref={taRef}
                      className="tc-ta"
                      placeholder="Message THRYLOS Team…"
                      value={text}
                      rows={1}
                      onChange={e => { setText(e.target.value); autoGrow(); }}
                      onKeyDown={onKey}
                    />

                    <button className="tc-ib" style={{ width: 34, height: 34, alignSelf: 'flex-end' }} title="Emoji">
                      <Smile style={{ width: 16, height: 16 }} />
                    </button>

                    <button
                      className={`tc-send ${text.trim() ? 'tc-send-on' : 'tc-send-off'}`}
                      onClick={send}
                      disabled={!text.trim() || sending}
                    >
                      {sending
                        ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
                        : <Send style={{ width: 15, height: 15, marginLeft: 1 }} />
                      }
                    </button>
                  </div>

                  <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,.1)', marginTop: 5, textAlign: 'right', margin: '5px 2px 0' }}>
                    <kbd className="tc-kbd">Enter</kbd> send · <kbd className="tc-kbd">Shift+Enter</kbd> new line · right-click for options
                  </p>
                </div>

              </div>
            </div>


            

            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadImg} />
          </div>
        </ModuleLayout>
      </div>
    </>
  );
};


export default TeamChat;

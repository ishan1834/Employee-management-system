




import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Send, Users, X, Smile, Paperclip, MessageCircle,
  Sparkles, CheckCheck, Loader2, Camera, ArrowLeft,
  ImageIcon, MoreHorizontal, Phone, Video, Search,
  ChevronRight, Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { roleNames } from '@/types/auth';
import { castToAdminProfiles } from '@/utils/adminTypeCasting';

// ─── Injected Styles ──────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');

  .tc-root { font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; }

  /* ── Full-height layout fix ── */
  .tc-shell {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - 120px);
    min-height: 500px;
    background: #080810;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.06);
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08);
  }

  @media (max-width: 767px) {
    .tc-shell {
      height: calc(100dvh - 80px);
      border-radius: 20px;
    }
  }

  /* ── Chat background ── */
  .tc-bg {
    background:
      radial-gradient(ellipse 80% 40% at 15% 20%, rgba(99,102,241,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 85% 80%, rgba(139,92,246,0.06) 0%, transparent 60%),
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 32px,
        rgba(255,255,255,0.008) 32px,
        rgba(255,255,255,0.008) 33px
      ),
      #080810;
  }

  /* ── Custom scrollbar ── */
  .tc-scroll { overflow-y: auto; overflow-x: hidden; }
  .tc-scroll::-webkit-scrollbar { width: 2px; }
  .tc-scroll::-webkit-scrollbar-track { background: transparent; }
  .tc-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }

  /* ── Message animations ── */
  @keyframes tc-msgIn {
    from { opacity: 0; transform: translateY(12px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .tc-msg { animation: tc-msgIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }

  /* ── Bubble tails ── */
  .tc-tail-own::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: -6px;
    border-left: 7px solid transparent;
    border-top: 8px solid;
    border-top-color: inherit;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
  }
  .tc-tail-other::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -6px;
    border-right: 7px solid transparent;
    border-top: 8px solid rgba(255,255,255,0.07);
  }

  /* ── Online pulse ── */
  @keyframes tc-pulse {
    0%   { transform: scale(1); opacity: 0.9; }
    70%  { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  .tc-online-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #22c55e;
    animation: tc-pulse 2.4s cubic-bezier(0,0,0.2,1) infinite;
  }

  /* ── Input bar ── */
  .tc-input-bar {
    transition: box-shadow 0.2s ease;
  }
  .tc-input-bar:focus-within {
    box-shadow:
      0 0 0 1.5px rgba(99,102,241,0.45),
      0 4px 24px rgba(99,102,241,0.12),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }

  /* ── Icon button ── */
  .tc-icon-btn {
    display: flex; align-items: center; justify-content: center;
    border-radius: 12px;
    transition: background 0.15s, color 0.15s, transform 0.1s;
    color: rgba(255,255,255,0.35);
  }
  .tc-icon-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); }
  .tc-icon-btn:active { transform: scale(0.9); }

  /* ── Send button ── */
  .tc-send {
    width: 40px; height: 40px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.15s, box-shadow 0.15s;
    flex-shrink: 0;
  }
  .tc-send-active {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    box-shadow: 0 4px 16px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.3);
  }
  .tc-send-active:hover { transform: scale(1.06); box-shadow: 0 6px 24px rgba(99,102,241,0.55); }
  .tc-send-active:active { transform: scale(0.94); }
  .tc-send-inactive { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.2); cursor: default; }

  /* ── Typing indicator ── */
  @keyframes tc-dot {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
    30%           { transform: translateY(-5px); opacity: 1; }
  }
  .tc-dot-1 { animation: tc-dot 1.4s 0s   infinite; }
  .tc-dot-2 { animation: tc-dot 1.4s 0.18s infinite; }
  .tc-dot-3 { animation: tc-dot 1.4s 0.36s infinite; }

  /* ── Header blur ── */
  .tc-header {
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    background: rgba(8,8,16,0.85);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  /* ── Members panel ── */
  .tc-member-row {
    transition: background 0.15s;
    border-radius: 14px;
  }
  .tc-member-row:hover { background: rgba(255,255,255,0.04); }

  /* ── Date pill ── */
  .tc-date-pill {
    display: inline-flex; align-items: center;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(10px);
    padding: 3px 12px;
    border-radius: 99px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.28);
  }

  /* ── Skeleton shimmer ── */
  @keyframes tc-shimmer {
    from { background-position: -400px 0; }
    to   { background-position: 400px 0; }
  }
  .tc-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
    background-size: 800px 100%;
    animation: tc-shimmer 1.6s ease infinite;
    border-radius: 16px;
  }

  /* ── Reaction hover ── */
  .tc-bubble:hover .tc-react-btn { opacity: 1; transform: scale(1); }
  .tc-react-btn {
    opacity: 0; transform: scale(0.8);
    transition: opacity 0.15s, transform 0.15s;
  }

  /* ── Image message ── */
  .tc-img { cursor: zoom-in; transition: opacity 0.2s, transform 0.2s; }
  .tc-img:hover { opacity: 0.9; transform: scale(0.98); }

  /* ── Lightbox ── */
  @keyframes tc-lbIn {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  .tc-lb-img { animation: tc-lbIn 0.25s cubic-bezier(0.34,1.3,0.64,1) both; }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: { name: string; role: string; avatar?: string };
}

interface AdminProfile {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CFG: Record<string, { grad: string; light: string; dot: string; badge: string }> = {
  super_admin: { grad: 'from-rose-500 to-orange-400',   light: '#fb923c', dot: '#f43f5e', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/25' },
  admin:       { grad: 'from-violet-500 to-indigo-500', light: '#818cf8', dot: '#8b5cf6', badge: 'bg-violet-500/15 text-violet-300 border-violet-500/25' },
  tech:        { grad: 'from-blue-500 to-cyan-400',     light: '#38bdf8', dot: '#3b82f6', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  content:     { grad: 'from-emerald-500 to-teal-400',  light: '#34d399', dot: '#10b981', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  design:      { grad: 'from-pink-500 to-fuchsia-400',  light: '#f472b6', dot: '#ec4899', badge: 'bg-pink-500/15 text-pink-300 border-pink-500/25' },
  moderator:   { grad: 'from-amber-500 to-yellow-400',  light: '#fbbf24', dot: '#f59e0b', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
};
const roleCfg = (r: string) => ROLE_CFG[r] ?? { grad: 'from-gray-500 to-gray-600', light: '#9ca3af', dot: '#6b7280', badge: 'bg-gray-500/15 text-gray-300 border-gray-500/25' };
const initials = (n: string) => n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
const fmtTime  = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
const fmtDate  = (d: string) => {
  const dd = new Date(d), now = new Date(), yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (dd.toDateString() === now.toDateString())  return 'Today';
  if (dd.toDateString() === yest.toDateString()) return 'Yesterday';
  return dd.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};
const onlineStatus = (last: string | null, isMe: boolean): 'online'|'away'|'offline' => {
  if (isMe) return 'online';
  if (!last) return 'offline';
  const m = (Date.now() - new Date(last).getTime()) / 60000;
  return m < 10 ? 'online' : m < 60 ? 'away' : 'offline';
};
const STATUS_COLOR = { online: '#22c55e', away: '#f59e0b', offline: '#374151' };

// ─── Sub-components ───────────────────────────────────────────────────────────

const OnlineDot: React.FC<{ status: 'online'|'away'|'offline' }> = ({ status }) => (
  <span
    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080810]"
    style={{ background: STATUS_COLOR[status], position: 'absolute' }}
  >
    {status === 'online' && <span className="tc-online-ring" />}
  </span>
);

// ── Member Row ──
const MemberRow: React.FC<{ admin: AdminProfile; isMe: boolean }> = ({ admin, isMe }) => {
  const status = onlineStatus(admin.last_login, isMe);
  const cfg    = roleCfg(admin.role);
  return (
    <div className="tc-member-row flex items-center gap-3 px-3 py-2.5 cursor-pointer">
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10 ring-1 ring-white/10">
          <AvatarImage src={admin.avatar || undefined} className="object-cover" />
          <AvatarFallback className={`bg-gradient-to-br ${cfg.grad} text-white text-xs font-bold`}>
            {initials(admin.name)}
          </AvatarFallback>
        </Avatar>
        <OnlineDot status={status} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/90 truncate">
          {admin.name}{isMe && <span className="text-white/30 text-xs font-normal ml-1">(you)</span>}
        </p>
        <p className="text-xs truncate" style={{ color: status === 'online' ? '#4ade80' : 'rgba(255,255,255,0.25)' }}>
          {status === 'online' ? '● Online' : status === 'away' ? '○ Away' : 'Offline'}
        </p>
      </div>
      <span className={`shrink-0 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${cfg.badge}`}>
        {(roleNames[admin.role as keyof typeof roleNames] ?? admin.role).split(' ')[0]}
      </span>
    </div>
  );
};

// ── Members Panel ──
const MembersPanel: React.FC<{ admins: AdminProfile[]; meId: string; onlineCount: number }> = ({ admins, meId, onlineCount }) => (
  <div className="flex flex-col h-full bg-[#070710]">
    {/* Header */}
    <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.05]">
      <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center">
        <Users className="w-4 h-4 text-indigo-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">Members</p>
        <p className="text-xs" style={{ color: '#4ade80' }}>{onlineCount} online now</p>
      </div>
      <div className="ml-auto w-7 h-7 tc-icon-btn cursor-pointer">
        <Search className="w-3.5 h-3.5" />
      </div>
    </div>
    {/* List */}
    <div className="flex-1 tc-scroll p-2 space-y-0.5">
      {/* Online group */}
      <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/20">Online — {onlineCount}</p>
      {admins.filter(a => onlineStatus(a.last_login, a.id === meId) === 'online')
        .map(a => <MemberRow key={a.id} admin={a} isMe={a.id === meId} />)}
      {/* Offline group */}
      <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/20">
        Offline — {admins.length - onlineCount}
      </p>
      {admins.filter(a => onlineStatus(a.last_login, a.id === meId) !== 'online')
        .map(a => <MemberRow key={a.id} admin={a} isMe={a.id === meId} />)}
    </div>
  </div>
);

// ── Date Divider ──
const DateDiv: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center justify-center gap-3 my-5">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
    <span className="tc-date-pill">{label}</span>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/6 to-transparent" />
  </div>
);

// ── Message Bubble ──
const Bubble: React.FC<{
  msg: ChatMessage & { showAvatar: boolean; showName: boolean };
  isOwn: boolean;
  meProfile: any;
  onImg: (url: string) => void;
}> = ({ msg, isOwn, meProfile, onImg }) => {
  const cfg        = roleCfg(isOwn ? meProfile?.role : msg.sender?.role ?? '');
  const senderName = isOwn ? meProfile?.name ?? 'You' : msg.sender?.name ?? 'Unknown';
  const avatar     = isOwn ? meProfile?.avatar : msg.sender?.avatar;
  const isImg      = msg.message.startsWith('📷 Shared an image:');
  const imgUrl     = isImg ? msg.message.replace('📷 Shared an image: ', '') : null;

  return (
    <div className={`tc-msg flex items-end gap-2 px-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${msg.showAvatar ? 'mb-1' : 'mb-0.5'}`}>
      
      {/* Avatar slot — 32px fixed width always so messages stay aligned */}
      <div className="shrink-0 w-8">
        {msg.showAvatar ? (
          <Avatar className="h-8 w-8 ring-1 ring-white/10">
            <AvatarImage src={avatar || undefined} className="object-cover" />
            <AvatarFallback className={`bg-gradient-to-br ${cfg.grad} text-white text-[10px] font-bold`}>
              {initials(senderName)}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </div>

      {/* Bubble stack */}
      <div className={`flex flex-col max-w-[75%] sm:max-w-[62%] ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Sender label */}
        {msg.showName && !isOwn && (
          <div className="flex items-center gap-1.5 mb-1.5 ml-1">
            <span className="text-xs font-bold" style={{ color: cfg.light }}>{senderName}</span>
            <span className="text-[9px] uppercase tracking-wider text-white/25 font-semibold">
              {(roleNames[msg.sender?.role as keyof typeof roleNames] ?? msg.sender?.role ?? '').split(' ')[0]}
            </span>
          </div>
        )}

        {/* The bubble itself */}
        <div className="tc-bubble group relative">
          {isImg && imgUrl ? (
            /* ── Image message ── */
            <div className={`relative rounded-2xl overflow-hidden ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'} shadow-xl`}>
              <img
                src={imgUrl}
                alt="Shared"
                className="tc-img block max-w-[220px] sm:max-w-[280px] max-h-60 object-cover rounded-2xl"
                style={{ borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px' }}
                onClick={() => onImg(imgUrl)}
              />
              {/* Caption bar */}
              <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
                <span className="text-[10px] text-white/60 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Photo
                </span>
                <span className="text-[10px] text-white/50">{fmtTime(msg.created_at)}</span>
              </div>
            </div>
          ) : (
            /* ── Text message ── */
            <div
              className={`relative px-4 py-2.5 shadow-lg
                ${isOwn
                  ? 'tc-tail-own bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-br-sm'
                  : 'tc-tail-other bg-white/[0.07] border border-white/[0.09] text-white/90 rounded-2xl rounded-bl-sm backdrop-blur-sm'
                }
              `}
              style={{ borderTopColor: isOwn ? undefined : 'rgba(255,255,255,0.07)' }}
            >
              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words font-[450]">
                {msg.message}
              </p>
              {/* Timestamp pinned inside bubble bottom-right */}
              <div className={`flex items-center justify-end gap-1 mt-0.5 -mb-0.5`}>
                <span className={`text-[10px] ${isOwn ? 'text-indigo-200/60' : 'text-white/25'}`}>
                  {fmtTime(msg.created_at)}
                </span>
                {isOwn && <CheckCheck className="w-3 h-3 text-indigo-300/70" />}
              </div>
            </div>
          )}

          {/* Reaction pill — appears on hover */}
          <div className={`tc-react-btn absolute top-1/2 -translate-y-1/2 ${isOwn ? 'left-0 -translate-x-8' : 'right-0 translate-x-8'}`}>
            <button className="text-sm bg-[#1a1a2e] border border-white/10 rounded-full px-1.5 py-0.5 shadow-lg hover:scale-110 transition-transform">😊</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main TeamChat ─────────────────────────────────────────────────────────────
const TeamChat: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast }        = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [admins, setAdmins]     = useState<AdminProfile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending]   = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);

  const endRef    = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollDown = useCallback((smooth = true) => {
    endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // ── Data fetching ──
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, sender:admins!sender_id(name,role,avatar)')
      .order('created_at', { ascending: true })
      .limit(200);
    if (!error) setMessages((data || []) as ChatMessage[]);
    setLoading(false);
  }, []);

  const fetchAdmins = useCallback(async () => {
    const { data } = await supabase.from('admins').select('*').eq('is_active', true).order('name');
    if (data) setAdmins(castToAdminProfiles(data));
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchAdmins();
    if (adminProfile) {
      supabase.from('admins').update({ last_login: new Date().toISOString() }).eq('id', adminProfile.id);
    }
    const ch = supabase
      .channel('team-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, fetchMessages)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchMessages, fetchAdmins, adminProfile]);

  useEffect(() => { scrollDown(!loading); }, [messages, loading, scrollDown]);

  // ── Send text ──
  const send = useCallback(async () => {
    const t = text.trim();
    if (!t || !adminProfile || sending) return;
    setSending(true);
    setText('');
    try {
      const { error } = await supabase.from('chat_messages').insert({ sender_id: adminProfile.id, message: t } as any);
      if (error) throw error;
    } catch {
      toast({ title: 'Message failed to send', variant: 'destructive' });
      setText(t);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [text, adminProfile, sending, toast]);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── Image upload ──
  const uploadImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminProfile) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Select an image file', variant: 'destructive' }); return; }
    if (file.size > 5 * 1024 * 1024)    { toast({ title: 'Image must be under 5 MB', variant: 'destructive' }); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `chat_images/${adminProfile.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
      await supabase.from('chat_messages').insert({ sender_id: adminProfile.id, message: `📷 Shared an image: ${publicUrl}` } as any);
      await supabase.from('uploaded_files').insert({ name: file.name, file_path: path, file_size: file.size, mime_type: file.type, uploaded_by: adminProfile.id } as any);
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // ── Derived ──
  const onlineCount = useMemo(() =>
    admins.filter(a => onlineStatus(a.last_login, a.id === adminProfile?.id) === 'online').length,
    [admins, adminProfile]
  );

  const grouped = useMemo(() => {
    const out: { date: string; msgs: (ChatMessage & { showAvatar: boolean; showName: boolean })[] }[] = [];
    let lastDate = '';
    messages.forEach((m, i) => {
      const date      = fmtDate(m.created_at);
      const prev      = messages[i - 1];
      const next      = messages[i + 1];
      const samePrev  = prev?.sender_id === m.sender_id && fmtDate(prev.created_at) === date;
      const sameNext  = next?.sender_id === m.sender_id && fmtDate(next.created_at) === date;
      if (date !== lastDate) { out.push({ date, msgs: [] }); lastDate = date; }
      out[out.length - 1].msgs.push({ ...m, showAvatar: !sameNext, showName: !samePrev });
    });
    return out;
  }, [messages]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      <div className="tc-root">
        <ModuleLayout title="Team Chat" description="Real-time communication">
          <div className="tc-shell">

            {/* ══ INNER FLEX ROW ════════════════════════════════════════════ */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

              {/* ── Desktop Members Sidebar ── */}
              <div className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/[0.05]">
                <MembersPanel admins={admins} meId={adminProfile?.id ?? ''} onlineCount={onlineCount} />
              </div>

              {/* ── Main Chat Area ── */}
              <div className="flex flex-col flex-1 min-w-0">

                {/* ── Header (sticky, blurred) ── */}
                <div className="tc-header shrink-0 flex items-center gap-3 px-4 py-3 z-10">
                  
                  {/* Mobile members button */}
                  <Sheet open={membersOpen} onOpenChange={setMembersOpen}>
                    <SheetTrigger asChild>
                      <button className="lg:hidden tc-icon-btn w-9 h-9 mr-0.5">
                        <Users className="w-4 h-4" />
                      </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 border-white/[0.06] bg-[#070710]">
                      <MembersPanel admins={admins} meId={adminProfile?.id ?? ''} onlineCount={onlineCount} />
                    </SheetContent>
                  </Sheet>

                  {/* Chat identity */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#080810] flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-white truncate leading-tight">THRYLOS Team</h2>
                    <p className="text-[11px] flex items-center gap-1.5 mt-px">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                      <span className="text-green-400/90 font-medium">{onlineCount} online</span>
                      <span className="text-white/20">·</span>
                      <span className="text-white/35">{admins.length} members</span>
                    </p>
                  </div>

                  {/* Header right actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge className="hidden sm:flex bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] px-2 py-0 font-semibold gap-1">
                      <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                      Live
                    </Badge>
                    <button className="tc-icon-btn w-8 h-8">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="tc-icon-btn w-8 h-8">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="tc-icon-btn w-8 h-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── Messages (SCROLLABLE, flex-1 so it fills remaining space) ── */}
                <div ref={scrollRef} className="tc-bg tc-scroll flex-1 px-0 py-2">
                  {loading ? (
                    <div className="space-y-5 px-4 pt-4">
                      {[80, 56, 120, 64, 96, 48].map((w, i) => (
                        <div key={i} className={`flex items-end gap-2 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                          <div className="w-8 h-8 rounded-full tc-skeleton shrink-0" />
                          <div className={`tc-skeleton h-10 rounded-2xl`} style={{ width: w + 80 }} />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                      <div className="w-18 h-18 w-[72px] h-[72px] rounded-3xl bg-gradient-to-br from-indigo-500/15 to-violet-600/15 border border-indigo-500/15 flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-indigo-400/70" />
                      </div>
                      <div>
                        <p className="text-white/70 font-bold text-base">Start the conversation</p>
                        <p className="text-white/25 text-sm mt-1 leading-relaxed">Say something to the team 👋</p>
                      </div>
                    </div>
                  ) : (
                    <div className="pb-2">
                      {grouped.map(({ date, msgs }) => (
                        <div key={date}>
                          <DateDiv label={date} />
                          {msgs.map(msg => (
                            <Bubble
                              key={msg.id}
                              msg={msg}
                              isOwn={msg.sender_id === adminProfile?.id}
                              meProfile={adminProfile}
                              onImg={setLightbox}
                            />
                          ))}
                        </div>
                      ))}
                      <div ref={endRef} className="h-2" />
                    </div>
                  )}
                </div>

                {/* ── Input Bar (FIXED to bottom of chat column, never scrolls) ── */}
                <div className="shrink-0 px-3 pb-3 pt-2 bg-[#080810] border-t border-white/[0.04]">
                  {/* Typing indicator (decorative) */}
                  <div className="flex items-center gap-1.5 px-1 mb-2 h-4">
                    {/* Hidden by default, show when someone is typing */}
                  </div>

                  <div className="tc-input-bar flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-2 py-1.5">
                    
                    {/* Attachment */}
                    <button
                      className="tc-icon-btn w-9 h-9 shrink-0"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      title="Attach image"
                    >
                      {uploading
                        ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        : <Paperclip className="w-4 h-4" />
                      }
                    </button>

                    {/* Camera */}
                    <button
                      className="tc-icon-btn w-9 h-9 shrink-0"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      title="Share photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    {/* Text input */}
                    <input
                      ref={inputRef}
                      className="flex-1 min-w-0 bg-transparent text-[13.5px] text-white/90 placeholder:text-white/20 outline-none px-1 py-1.5 font-[450]"
                      style={{ fontFamily: 'inherit' }}
                      placeholder="Message team…"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={onKey}
                      autoComplete="off"
                    />

                    {/* Emoji */}
                    <button className="tc-icon-btn w-8 h-8 shrink-0" title="Emoji">
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* Send */}
                    <button
                      className={`tc-send shrink-0 ${text.trim() ? 'tc-send-active' : 'tc-send-inactive'}`}
                      onClick={send}
                      disabled={!text.trim() || sending}
                    >
                      {sending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-[15px] h-[15px]" style={{ marginLeft: 1 }} />
                      }
                    </button>
                  </div>

                  {/* Hidden file input */}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadImg} />
                </div>

              </div>{/* end main chat col */}
            </div>{/* end inner flex row */}

          </div>{/* end tc-shell */}
        </ModuleLayout>
      </div>

      {/* ── Image Lightbox ── */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] p-0 bg-black/97 border-white/8 overflow-hidden rounded-3xl shadow-2xl">
          <DialogClose className="absolute right-4 top-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10 backdrop-blur-sm">
            <X className="w-4 h-4 text-white" />
          </DialogClose>
          {lightbox && (
            <img
              src={lightbox}
              alt="Full size"
              className="tc-lb-img w-full max-h-[92vh] object-contain rounded-3xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeamChat;






// ─── Constants ────────────────────────────────────────────────────────────────








const ROLE_GRADIENTS: Record<string, { bg: string; text: string; dot: string }> = {
  super_admin:   { bg: 'from-rose-500   to-orange-500',  text: 'text-rose-300',   dot: '#f43f5e' },
  admin:         { bg: 'from-violet-500 to-blue-500',    text: 'text-violet-300', dot: '#8b5cf6' },
  tech:          { bg: 'from-blue-500   to-cyan-500',    text: 'text-blue-300',   dot: '#3b82f6' },
  content:       { bg: 'from-emerald-500 to-teal-500',   text: 'text-emerald-300',dot: '#10b981' },
  design:        { bg: 'from-pink-500   to-fuchsia-500', text: 'text-pink-300',   dot: '#ec4899' },
  moderator:     { bg: 'from-amber-500  to-yellow-500',  text: 'text-amber-300',  dot: '#f59e0b' },
};

function getRoleStyle(role: string) {
  return ROLE_GRADIENTS[role] ?? { bg: 'from-gray-500 to-gray-600', text: 'text-gray-300', dot: '#6b7280' };
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}









function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}







function formatDate(date: string): string {
  const d    = new Date(date);
  const now  = new Date();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === now.toDateString())  return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}







function getOnlineStatus(lastLogin: string | null, isMe: boolean): 'online' | 'away' | 'offline' {
  if (isMe) return 'online';
  if (!lastLogin) return 'offline';
  const mins = (Date.now() - new Date(lastLogin).getTime()) / 60_000;
  if (mins < 10) return 'online';
  if (mins < 60) return 'away';
  return 'offline';
}

const STATUS_COLORS = { online: '#22c55e', away: '#f59e0b', offline: '#6b7280' };

// ─── Member Sidebar Row ───────────────────────────────────────────────────────

const MemberRow: React.FC<{ admin: AdminProfile; isMe: boolean }> = ({ admin, isMe }) => {
  const status = getOnlineStatus(admin.last_login, isMe);
  const style  = getRoleStyle(admin.role);

  return (
    <div className="member-row flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group">
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10 ring-2 ring-white/10 group-hover:ring-white/20 transition-all">
          <AvatarImage src={admin.avatar || undefined} className="object-cover" />
          <AvatarFallback className={`bg-gradient-to-br ${style.bg} text-white text-xs font-bold`}>
            {getInitials(admin.name)}
          </AvatarFallback>
        </Avatar>
        {/* Status dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0f]"
          style={{ background: STATUS_COLORS[status] }}
        >
          {status === 'online' && (
            <span
              className="online-ping absolute inset-0 rounded-full"
              style={{ background: STATUS_COLORS.online }}
            />
          )}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/90 truncate leading-tight">
          {isMe ? `${admin.name} (you)` : admin.name}
        </p>
        <p className={`text-xs truncate ${status === 'online' ? 'text-green-400' : 'text-white/30'}`}>
          {status === 'online' ? 'Online' : status === 'away' ? 'Away' : 'Offline'}
        </p>
      </div>
      <span className={`member-role-badge text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 ${style.text} shrink-0`}>
        {(roleNames[admin.role as keyof typeof roleNames] ?? admin.role).split(' ')[0]}
      </span>
    </div>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{
  msg: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  adminProfile: any;
  onImageClick: (url: string) => void;
}> = ({ msg, isOwn, showAvatar, showName, adminProfile, onImageClick }) => {
  const style     = getRoleStyle(isOwn ? adminProfile?.role : msg.sender?.role ?? '');
  const senderName = isOwn ? adminProfile?.name : msg.sender?.name ?? 'Unknown';
  const avatar     = isOwn ? adminProfile?.avatar : msg.sender?.avatar;
  const isImage    = msg.message.startsWith('📷 Shared an image:');
  const imgUrl     = isImage ? msg.message.replace('📷 Shared an image: ', '') : null;










  
  return (
    <div className={`msg-animate flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>







      
      {/* Avatar */}
      <div className="shrink-0 w-8">
        {showAvatar ? (
          <Avatar className="h-8 w-8 ring-1 ring-white/10">
            <AvatarImage src={avatar || undefined} className="object-cover" />
            <AvatarFallback className={`bg-gradient-to-br ${style.bg} text-white text-[10px] font-bold`}>
              {getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
        ) : null}
      </div>

      {/* Content */}
      <div className={`flex flex-col max-w-[72%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name + role */}
        {showName && !isOwn && (
          <div className="flex items-center gap-1.5 mb-1 ml-1">
            <span className="text-xs font-semibold" style={{ color: style.dot }}>
              {senderName}
            </span>
            <span className={`text-[9px] uppercase tracking-wider ${style.text} opacity-60`}>
              {(roleNames[msg.sender?.role as keyof typeof roleNames] ?? msg.sender?.role ?? '').split(' ')[0]}
            </span>
          </div>
        )}









        
        {/* Bubble */}
        <div className={`
          relative px-3.5 py-2.5 rounded-2xl shadow-md
          ${isOwn
            ? 'bubble-own bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-sm'
            : 'bubble-other bg-white/[0.07] border border-white/10 text-white/90 rounded-bl-sm backdrop-blur-sm'
          }
        `}>
          {isImage && imgUrl ? (
            <div className="space-y-1.5">
              <p className="text-xs opacity-60 mb-1">Photo</p>
              <img
                src={imgUrl}
                alt="Shared"
                className="max-w-[220px] sm:max-w-xs rounded-xl cursor-pointer hover:opacity-90 transition-opacity object-cover"
                onClick={() => onImageClick(imgUrl)}
              />
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
          )}
        </div>

        {/* Timestamp + read tick */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse mr-1' : 'ml-1'}`}>
          <span className="text-[10px] text-white/25">{formatTime(msg.created_at)}</span>
          {isOwn && <CheckCheck className="w-3 h-3 text-indigo-400" />}
        </div>
      </div>
    </div>
  );
};

// ─── Date Divider ─────────────────────────────────────────────────────────────

const DateDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 my-4 px-2">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/8" />
    <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/8">
      {label}
    </span>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/8" />
  </div>
);

// ─── Members Panel content ────────────────────────────────────────────────────

const MembersPanel: React.FC<{ admins: AdminProfile[]; currentId: string; onlineCount: number }> = ({
  admins, currentId, onlineCount,
}) => (
  <div className="flex flex-col h-full bg-[#0d0d14] border-r border-white/[0.06]">
    <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
      <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <Users className="w-4 h-4 text-indigo-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">Members</p>
        <p className="text-xs text-green-400">{onlineCount} online</p>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto chat-scroll p-2 space-y-0.5">
      {admins.map(admin => (
        <MemberRow key={admin.id} admin={admin} isMe={admin.id === currentId} />
      ))}
    </div>
  </div>
);










// ─── Main TeamChat ────────────────────────────────────────────────────────────

const TeamChat: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast }        = useToast();

  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [admins, setAdmins]       = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage]     = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending]     = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping]   = useState(false); // local fake typing indicator for polish

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const fileRef        = useRef<HTMLInputElement>(null);
  const typingTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom
  const scrollBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, sender:admins!sender_id(name, role, avatar)')
      .order('created_at', { ascending: true })
      .limit(150);
    if (!error) setMessages((data || []) as ChatMessage[]);
    setIsLoading(false);
  }, []);

  const fetchAdmins = useCallback(async () => {
    const { data } = await supabase
      .from('admins')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (data) setAdmins(castToAdminProfiles(data));
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchAdmins();

    // Update own last_login
    if (adminProfile) {
      supabase.from('admins').update({ last_login: new Date().toISOString() }).eq('id', adminProfile.id);
    }









    
    // Realtime
    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => fetchMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMessages, fetchAdmins, adminProfile]);

  useEffect(() => {
    scrollBottom(!isLoading);
  }, [messages, isLoading, scrollBottom]);

  // ── Send text ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const text = message.trim();
    if (!text || !adminProfile || sending) return;
    setSending(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({ sender_id: adminProfile.id, message: text } as any);
      if (error) throw error;
    } catch {
      toast({ title: 'Failed to send', variant: 'destructive' });
      setMessage(text); // restore
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [message, adminProfile, sending, toast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Fake typing indicator when the input has content
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };









  
  // ── Image upload ───────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminProfile) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image', variant: 'destructive' }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be under 5 MB', variant: 'destructive' }); return;
    }
    setUploading(true);
    try {
      const ext      = file.name.split('.').pop();
      const fileName = `chat_images/${adminProfile.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(fileName, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
      await supabase.from('chat_messages').insert({
        sender_id: adminProfile.id,
        message:   `📷 Shared an image: ${publicUrl}`,
      } as any);
      await supabase.from('uploaded_files').insert({
        name: file.name, file_path: fileName,
        file_size: file.size, mime_type: file.type, uploaded_by: adminProfile.id,
      } as any);
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const onlineCount = useMemo(() =>
    admins.filter(a => getOnlineStatus(a.last_login, a.id === adminProfile?.id) === 'online').length,
    [admins, adminProfile]
  );

  // Group messages by date AND detect consecutive same-sender runs
  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: (ChatMessage & { showAvatar: boolean; showName: boolean })[] }[] = [];
    let lastDate = '';
    messages.forEach((msg, i) => {
      const date     = formatDate(msg.created_at);
      const prevMsg  = messages[i - 1];
      const nextMsg  = messages[i + 1];
      const sameAsPrev = prevMsg?.sender_id === msg.sender_id && formatDate(prevMsg.created_at) === date;
      const sameAsNext = nextMsg?.sender_id === msg.sender_id && formatDate(nextMsg.created_at) === date;
      const showAvatar = !sameAsNext; // show avatar on last of a consecutive run
      const showName   = !sameAsPrev;

      if (date !== lastDate) {
        groups.push({ date, msgs: [] });
        lastDate = date;
      }
      groups[groups.length - 1].msgs.push({ ...msg, showAvatar, showName });
    });
    return groups;
  }, [messages]);









  
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{CHAT_STYLES}</style>
      <div className="chat-root">
        <ModuleLayout title="Team Chat" description="Real-time team communication">
          <div className="flex rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl"
               style={{ height: 'calc(100vh - 200px)', minHeight: 560 }}>

            {/* ── Desktop Sidebar ── */}
            <div className="hidden lg:flex flex-col w-64 shrink-0">
              <MembersPanel admins={admins} currentId={adminProfile?.id ?? ''} onlineCount={onlineCount} />
            </div>

            {/* ── Main Chat Column ── */}
            <div className="flex flex-col flex-1 min-w-0">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0d0d14] shrink-0">
                <div className="flex items-center gap-3">
                  {/* Mobile members sheet */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 text-white/50 hover:text-white">
                        <Users className="w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 border-white/[0.06] bg-[#0d0d14]">
                      <div className="h-full">
                        <MembersPanel admins={admins} currentId={adminProfile?.id ?? ''} onlineCount={onlineCount} />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Chat identity */}
                  <div className="relative">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white leading-tight">THRYLOS Team</h2>
                    <p className="text-[11px] text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      {onlineCount} online · {admins.length} members
                    </p>
                  </div>
                </div>

                {/* Header actions */}
                <div className="flex items-center gap-1">
                  <Badge className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-[10px] px-2 py-0.5 animate-pulse">
                    Live
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-bg flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-1">
                {isLoading ? (
                  // Skeleton
                  <div className="space-y-4 pt-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className={`flex gap-3 items-end animate-pulse ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                        <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
                        <div className={`rounded-2xl bg-white/5 ${i % 2 === 0 ? 'w-44 h-10' : 'w-32 h-8'}`} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center">
                      <MessageCircle className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-white/80 font-semibold">No messages yet</p>
                      <p className="text-white/30 text-sm mt-0.5">Be the first to say something! 👋</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {groupedMessages.map(({ date, msgs }) => (
                      <div key={date}>
                        <DateDivider label={date} />
                        <div className="space-y-1">
                          {msgs.map(msg => (
                            <MessageBubble
                              key={msg.id}
                              msg={msg}
                              isOwn={msg.sender_id === adminProfile?.id}
                              showAvatar={msg.showAvatar}
                              showName={msg.showName}
                              adminProfile={adminProfile}
                              onImageClick={setSelectedImage}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>








              

              {/* Input bar */}
              <div className="shrink-0 px-3 py-3 border-t border-white/[0.06] bg-[#0d0d14]">
                <div className="input-glow flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-2 py-1.5 transition-all">
                  {/* Attach */}
                  <button
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-all shrink-0"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading
                      ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      : <Paperclip className="w-4 h-4" />
                    }
                  </button>

                  {/* Camera */}
                  <button
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-all shrink-0"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  {/* Text input */}
                  <input
                    ref={inputRef}
                    className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-white/25 outline-none py-1.5 px-1"
                    placeholder="Message THRYLOS Team…"
                    value={message}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                  />

                  {/* Emoji placeholder */}
                  <button className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-all shrink-0">
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* Send */}
                  <button
                    className={`send-btn h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-all ${
                      message.trim()
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/30'
                        : 'bg-white/5 text-white/20 cursor-default'
                    }`}
                    onClick={sendMessage}
                    disabled={!message.trim() || sending}
                  >
                    {sending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                  </button>
                </div>

                {/* Hidden file input */}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>
          </div>
        </ModuleLayout>
      </div>









      
      {/* ── Image lightbox ── */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 bg-black/98 border-white/10 overflow-hidden rounded-2xl">
          <DialogClose className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
            <X className="h-4 w-4 text-white" />
          </DialogClose>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full view"
              className="w-full max-h-[90vh] object-contain rounded-2xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};






export default TeamChat;

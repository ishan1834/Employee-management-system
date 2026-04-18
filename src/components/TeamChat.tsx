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
  ChevronDown, Bell, BellOff, RefreshCw, Download,
  Pin, Hash,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { roleNames } from '@/types/auth';
import { castToAdminProfiles } from '@/utils/adminTypeCasting';

// ====================== TYPES ======================
type UserRole = string;

interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: { name: string; role: UserRole; avatar?: string };
}

interface AdminProfile {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  last_login: string | null;
}

// ====================== MAIN ======================
const TeamChat: React.FC = () => {
  const { adminProfile } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [replyMsg, setReplyMsg] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const taRef = useRef<HTMLTextAreaElement>(null);

  // ======================
  // AUTO FILL EDIT MODE
  // ======================
  useEffect(() => {
    if (editingMsg) {
      setText(editingMsg.message);
      taRef.current?.focus();
    }
  }, [editingMsg]);

  // ======================
  // SEND / EDIT MESSAGE
  // ======================
  const send = useCallback(async () => {
    const t = text.trim();
    if (!t || !adminProfile || sending) return;

    setSending(true);

    // ✏️ EDIT MODE
    if (editingMsg) {
      try {
        await supabase
          .from('chat_messages')
          .update({ message: t + ' (edited)' })
          .eq('id', editingMsg.id);

        setEditingMsg(null);
        setText('');
      } catch {
        toast({ title: 'Edit failed' });
      } finally {
        setSending(false);
      }
      return;
    }

    let finalMsg = t;

    if (replyMsg) {
      finalMsg = `↩REPLY:${replyMsg.id}|${replyMsg.sender?.name}|${replyMsg.message}\n${t}`;
      setReplyMsg(null);
    }

    try {
      await supabase.from('chat_messages').insert({
        sender_id: adminProfile.id,
        message: finalMsg,
      });
      setText('');
    } catch {
      toast({ title: 'Send failed' });
    } finally {
      setSending(false);
    }
  }, [text, adminProfile, sending, editingMsg, replyMsg]);

  // ======================
  // MESSAGE UI
  // ======================
  const Bubble = ({ msg }: { msg: ChatMessage }) => {
    const isOwn = msg.sender_id === adminProfile?.id;

    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>
          {msg.sender?.name}
        </div>

        <div
          style={{
            padding: 10,
            borderRadius: 12,
            background: isOwn ? '#111' : '#222',
          }}
        >
          {/* 🔥 Mention Highlight */}
          {msg.message.split(/(@\w+)/g).map((part, i) =>
            part.startsWith('@') ? (
              <span key={i} style={{ color: '#00f5ff' }}>
                {part}
              </span>
            ) : (
              part
            )
          )}
        </div>

        {/* 👀 Seen */}
        {isOwn && (
          <div style={{ fontSize: 10, color: '#00f5ff' }}>
            ✓✓ seen
          </div>
        )}
      </div>
    );
  };

  // ======================
  // UI
  // ======================
  return (
    <ModuleLayout title="Team Chat">

      {/* EDIT BAR */}
      {editingMsg && (
        <div style={{ background: '#111', padding: 6 }}>
          ✏️ Editing message
          <button onClick={() => setEditingMsg(null)}>Cancel</button>
        </div>
      )}

      {/* MESSAGES */}
      <div>
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
      </div>

      {/* TYPING */}
      {typingUsers.length > 0 && (
        <div style={{ fontSize: 12 }}>
          {typingUsers.join(', ')} typing...
        </div>
      )}

      {/* INPUT */}
      <div style={{ display: 'flex', gap: 6 }}>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);

            // typing effect
            setTypingUsers([adminProfile?.name || 'You']);
            setTimeout(() => setTypingUsers([]), 1500);
          }}
        />

        <button
          onClick={send}
          disabled={!text.trim() || sending}
        >
          Send
        </button>
      </div>

    </ModuleLayout>
  );
};

export default TeamChat;

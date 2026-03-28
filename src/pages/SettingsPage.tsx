




import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Volume2, Bell, Vibrate, Loader2, Camera,
  User, Palette, Shield, AlertTriangle, KeyRound,
  Trash2, Check, Save, Eye, EyeOff, X, Trophy,
  MessageSquare, Calendar, ClipboardList, Users,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationPref {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
type AccentColor = {
  name: string;
  value: string;
  tw: string;
};

export const ACCENT_COLORS: AccentColor[] = [
  { name: 'Indigo',  value: '#6366f1', tw: 'bg-indigo-500' },
  { name: 'Violet',  value: '#8b5cf6', tw: 'bg-violet-500' },
  { name: 'Rose',    value: '#f43f5e', tw: 'bg-rose-500' },
  { name: 'Orange',  value: '#f97316', tw: 'bg-orange-500' },
  { name: 'Emerald', value: '#10b981', tw: 'bg-emerald-500' },
  { name: 'Sky',     value: '#0ea5e9', tw: 'bg-sky-500' },
  { name: 'Pink',    value: '#ec4899', tw: 'bg-pink-500' },
  { name: 'Amber',   value: '#f59e0b', tw: 'bg-amber-500' },
];

const NOTIFICATION_PREFS: NotificationPref[] = [
  { key: 'notif_chat',        label: 'Team Chat',        description: 'New messages in team chat',         icon: <MessageSquare className="w-4 h-4" />, color: 'text-blue-400'   },
  { key: 'notif_events',      label: 'Team Events',      description: 'New or updated team events',        icon: <Calendar className="w-4 h-4" />,       color: 'text-purple-400' },
  { key: 'notif_tournaments', label: 'Tournaments',      description: 'Tournament updates and results',    icon: <Trophy className="w-4 h-4" />,          color: 'text-yellow-400' },
  { key: 'notif_attendance',  label: 'Attendance',       description: 'Attendance reviews and alerts',     icon: <ClipboardList className="w-4 h-4" />,   color: 'text-green-400'  },
  { key: 'notif_players',     label: 'Players',          description: 'New player registrations',          icon: <Users className="w-4 h-4" />,           color: 'text-orange-400' },
];

const MAX_AVATAR_MB = 2;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconBg?: string;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, iconBg = 'bg-white/10', children }) => (
  <Card className="bg-gray-900/60 border-white/10 backdrop-blur-sm">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-3 text-base text-white">
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          {subtitle && <p className="text-xs text-gray-500 font-normal mt-0.5">{subtitle}</p>}
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-5">{children}</CardContent>
  </Card>
);

// ─── Toggle row ───────────────────────────────────────────────────────────────

const ToggleRow: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}> = ({ icon, iconBg, label, description, checked, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <Label className="text-white/90 font-medium text-sm cursor-pointer">{label}</Label>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  const navigate       = useNavigate();
  const { adminProfile, refreshAdminProfile } = useAuth() as any;
  const { settings, isLoading, updateSettings, triggerHaptic } = useSoundSettings();

  // ── Avatar ──
  const [avatarPreview, setAvatarPreview] = useState<string>(adminProfile?.avatar || '');
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Accent colour ──
  const [accentColor, setAccentColor] = useState<string>(
    () => localStorage.getItem('thrylos:accent') || ACCENT_COLORS[0].value
  );

  // ── Notification prefs ──
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(
    () => NOTIFICATION_PREFS.reduce((acc, p) => {
      acc[p.key] = JSON.parse(localStorage.getItem(`thrylos:${p.key}`) || 'true');
      return acc;
    }, {} as Record<string, boolean>)
  );

  // ── Volume ──
  const [volume, setVolume] = useState<number>(() => {
    const v = localStorage.getItem('thrylos:volume');
    return v !== null ? parseFloat(v) : 0.7;
  });

  // ── Password change ──
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pwCurrent, setPwCurrent]   = useState('');
  const [pwNew, setPwNew]           = useState('');
  const [pwConfirm, setPwConfirm]   = useState('');
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew]   = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // ── Delete account ──
  const [showDeleteDialog, setShowDeleteDialog]   = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting]                   = useState(false);

  // ── Saving indicator ──
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const saving = (section: string, fn: () => Promise<void>) => async () => {
    setSavingSection(section);
    try { await fn(); } finally { setSavingSection(null); }
  };

  // ─── Avatar handlers ──────────────────────────────────────────────────────

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError('Only JPG, PNG, or WebP images allowed.'); return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setAvatarError(`Max file size is ${MAX_AVATAR_MB} MB.`); return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveAvatar = saving('avatar', async () => {
    if (!avatarFile || !adminProfile) return;
    setAvatarUploading(true);
    try {
      const ext      = avatarFile.name.split('.').pop();
      const path     = `avatars/${adminProfile.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('player-assets').upload(path, avatarFile, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('player-assets').getPublicUrl(path);
      const { error: dbErr } = await supabase.from('admins').update({ avatar: data.publicUrl }).eq('id', adminProfile.id);
      if (dbErr) throw dbErr;
      await refreshAdminProfile?.();
      setAvatarFile(null);
      toast({ title: 'Profile photo updated ✓' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setAvatarUploading(false);
    }
  });

  const removeAvatar = saving('avatar', async () => {
    if (!adminProfile) return;
    await supabase.from('admins').update({ avatar: null }).eq('id', adminProfile.id);
    setAvatarPreview('');
    setAvatarFile(null);
    await refreshAdminProfile?.();
    toast({ title: 'Profile photo removed' });
  });

  // ─── Sound toggle ──────────────────────────────────────────────────────────

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    await updateSettings({ [key]: value });
    if (key === 'hapticEnabled' && value) triggerHaptic();
    toast({
      title: 'Setting updated',
      description: `${key.replace(/([A-Z])/g, ' $1').replace('Enabled', '').trim()} ${value ? 'enabled' : 'disabled'}`,
    });
  };

  // ─── Volume ───────────────────────────────────────────────────────────────

  const handleVolume = (val: number[]) => {
    setVolume(val[0]);
    localStorage.setItem('thrylos:volume', String(val[0]));
  };

  // ─── Accent color ─────────────────────────────────────────────────────────

  const handleAccent = (color: string) => {
    setAccentColor(color);
    localStorage.setItem('thrylos:accent', color);
    document.documentElement.style.setProperty('--accent-color', color);
    toast({ title: 'Accent colour updated' });
  };

  // ─── Notification prefs ───────────────────────────────────────────────────

  const handleNotif = (key: string, value: boolean) => {
    setNotifPrefs(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(`thrylos:${key}`, JSON.stringify(value));
    toast({ title: value ? 'Notifications on' : 'Notifications off', description: NOTIFICATION_PREFS.find(p => p.key === key)?.label });
  };

  // ─── Password change ──────────────────────────────────────────────────────

  const handlePasswordChange = async () => {
    if (!pwNew || pwNew !== pwConfirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' }); return;
    }
    if (pwNew.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' }); return;
    }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwNew });
      if (error) throw error;
      toast({ title: 'Password changed successfully ✓' });
      setShowPasswordDialog(false);
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (err: any) {
      toast({ title: 'Failed to change password', description: err.message, variant: 'destructive' });
    } finally {
      setChangingPw(false);
    }
  };

  // ─── Delete account ───────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await supabase.from('admins').update({ is_active: false }).eq('id', adminProfile.id);
      await supabase.auth.signOut();
      toast({ title: 'Account deactivated. Goodbye.' });
      navigate('/login');
    } catch (err: any) {
      toast({ title: 'Failed to delete account', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Back */}
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 text-gray-400 hover:text-white -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="max-w-2xl mx-auto space-y-5">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your profile and preferences</p>
          </div>

          {/* ── 1. Profile / Avatar ── */}
          <Section
            icon={<User className="w-4 h-4 text-blue-400" />}
            title="Profile"
            subtitle="Your personal information and photo"
            iconBg="bg-blue-500/15"
          >
            {/* Avatar row */}
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <Avatar className="h-20 w-20 ring-2 ring-white/10">
                  <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xl font-bold">
                    {getInitials(adminProfile?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-500 border-2 border-black flex items-center justify-center hover:bg-indigo-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="space-y-2">
                  <div>
                    <p className="text-white font-semibold">{adminProfile?.name}</p>
                    <p className="text-gray-500 text-sm">{adminProfile?.email}</p>
                    <Badge variant="outline" className="mt-1 text-xs border-white/10 text-gray-400 capitalize">
                      {adminProfile?.role?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm" variant="outline"
                      className="h-7 text-xs border-white/15"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                    >
                      <Camera className="w-3 h-3 mr-1" />
                      {avatarFile ? 'Change' : 'Upload photo'}
                    </Button>
                    {avatarFile && (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500"
                        onClick={saveAvatar}
                        disabled={avatarUploading || savingSection === 'avatar'}
                      >
                        {(avatarUploading || savingSection === 'avatar')
                          ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          : <Save className="w-3 h-3 mr-1" />
                        }
                        Save photo
                      </Button>
                    )}
                    {avatarPreview && !avatarFile && (
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 text-xs text-red-400 hover:text-red-300"
                        onClick={removeAvatar}
                      >
                        <X className="w-3 h-3 mr-1" /> Remove
                      </Button>
                    )}
                  </div>
                  {avatarError && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {avatarError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={handleAvatarChange}
            />

            <Separator className="bg-white/5" />

            {/* Read-only info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Full Name',  value: adminProfile?.name  },
                { label: 'Email',      value: adminProfile?.email },
                { label: 'Role',       value: adminProfile?.role?.replace(/_/g, ' ') },
                { label: 'Member Since', value: adminProfile?.created_at
                    ? new Date(adminProfile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                    : '—' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                  <p className="text-sm text-white/90 font-medium capitalize">{item.value || '—'}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 2. Accent Color ── */}
          <Section
            icon={<Palette className="w-4 h-4 text-pink-400" />}
            title="Appearance"
            subtitle="Accent colour applied across the dashboard"
            iconBg="bg-pink-500/15"
          >
            <div>
              <p className="text-sm text-gray-400 mb-3">Accent Colour</p>
              <div className="flex flex-wrap gap-3">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.value}
                    title={c.name}
                    onClick={() => handleAccent(c.value)}
                    className={`w-8 h-8 rounded-full transition-all ${c.tw} ${
                      accentColor === c.value
                        ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white scale-110'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {accentColor === c.value && (
                      <Check className="w-4 h-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Selected: <span className="text-gray-400">{ACCENT_COLORS.find(c => c.value === accentColor)?.name}</span>
              </p>
            </div>
          </Section>

          {/* ── 3. Sound & Haptics ── */}
          <Section
            icon={<Volume2 className="w-4 h-4 text-blue-400" />}
            title="Sound & Haptics"
            subtitle="Control audio and vibration feedback"
            iconBg="bg-blue-500/15"
          >
            <ToggleRow
              icon={<Volume2 className="w-4 h-4 text-blue-400" />}
              iconBg="bg-blue-500/15"
              label="Button Click Sounds"
              description="Play sound when tapping buttons"
              checked={settings.soundEnabled}
              onChange={v => handleToggle('soundEnabled', v)}
            />

            {/* Volume slider — only active when sound is enabled */}
            <div className={`pl-12 transition-opacity ${settings.soundEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">Volume</p>
                <span className="text-xs font-mono text-gray-400">{Math.round(volume * 100)}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={handleVolume}
                min={0} max={1} step={0.05}
                className="w-full"
              />
            </div>

            <Separator className="bg-white/5" />

            <ToggleRow
              icon={<Bell className="w-4 h-4 text-purple-400" />}
              iconBg="bg-purple-500/15"
              label="Notification Sounds"
              description="Play sound for in-app notifications"
              checked={settings.notificationSoundEnabled}
              onChange={v => handleToggle('notificationSoundEnabled', v)}
            />

            <Separator className="bg-white/5" />

            <ToggleRow
              icon={<Vibrate className="w-4 h-4 text-green-400" />}
              iconBg="bg-green-500/15"
              label="Haptic Feedback"
              description="Vibrate on button taps (mobile only)"
              checked={settings.hapticEnabled}
              onChange={v => handleToggle('hapticEnabled', v)}
            />
          </Section>

          {/* ── 4. Notification Preferences ── */}
          <Section
            icon={<Bell className="w-4 h-4 text-violet-400" />}
            title="Notification Preferences"
            subtitle="Choose which events you want to be notified about"
            iconBg="bg-violet-500/15"
          >
            {NOTIFICATION_PREFS.map((pref, i) => (
              <React.Fragment key={pref.key}>
                <ToggleRow
                  icon={<span className={pref.color}>{pref.icon}</span>}
                  iconBg="bg-white/5"
                  label={pref.label}
                  description={pref.description}
                  checked={notifPrefs[pref.key] ?? true}
                  onChange={v => handleNotif(pref.key, v)}
                />
                {i < NOTIFICATION_PREFS.length - 1 && <Separator className="bg-white/5" />}
              </React.Fragment>
            ))}
          </Section>

          {/* ── 5. Danger Zone ── */}
          <Section
            icon={<Shield className="w-4 h-4 text-red-400" />}
            title="Security & Danger Zone"
            subtitle="Sensitive actions that affect your account"
            iconBg="bg-red-500/15"
          >
            {/* Change password */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">Change Password</p>
                  <p className="text-xs text-gray-500">Update your login password</p>
                </div>
              </div>
              <Button
                size="sm" variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 shrink-0"
                onClick={() => setShowPasswordDialog(true)}
              >
                Change
              </Button>
            </div>

            <Separator className="bg-white/5" />

            {/* Delete account */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-400">Deactivate Account</p>
                  <p className="text-xs text-gray-500">Permanently disable your admin access</p>
                </div>
              </div>
              <Button
                size="sm" variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 shrink-0"
                onClick={() => setShowDeleteDialog(true)}
              >
                Deactivate
              </Button>
            </div>
          </Section>
        </div>
      </div>

      {/* ── Change Password Dialog ── */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-orange-400" /> Change Password
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose a strong password of at least 8 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* New password */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">New Password</Label>
              <div className="relative">
                <Input
                  type={showPwNew ? 'text' : 'password'}
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="bg-gray-800 border-gray-700 text-white pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  onClick={() => setShowPwNew(v => !v)}
                >
                  {showPwNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">Confirm New Password</Label>
              <Input
                type={showPwCurrent ? 'text' : 'password'}
                value={pwConfirm}
                onChange={e => setPwConfirm(e.target.value)}
                placeholder="Re-enter new password"
                className={`bg-gray-800 border-gray-700 text-white ${
                  pwConfirm && pwNew !== pwConfirm ? 'border-red-500/60' : ''
                }`}
              />
              {pwConfirm && pwNew !== pwConfirm && (
                <p className="text-xs text-red-400">Passwords don't match</p>
              )}
            </div>

            {/* Password strength indicator */}
            {pwNew.length > 0 && (
              <div>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        pwNew.length >= level * 3
                          ? level <= 1 ? 'bg-red-500'
                            : level <= 2 ? 'bg-orange-500'
                            : level <= 3 ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {pwNew.length < 4 ? 'Too short' : pwNew.length < 8 ? 'Weak' : pwNew.length < 12 ? 'Good' : 'Strong'}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={changingPw || !pwNew || pwNew !== pwConfirm || pwNew.length < 8}
              className="bg-orange-500 hover:bg-orange-400 text-white min-w-[110px]"
            >
              {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete / Deactivate Dialog ── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Deactivate Account
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This will permanently disable your admin access. Type{' '}
              <span className="font-mono text-red-400 font-semibold">DELETE</span>{' '}
              to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="bg-gray-800 border-gray-700 text-white font-mono"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || deleting}
              className="bg-red-600 hover:bg-red-700 min-w-[110px]"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-1.5" />Deactivate</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;

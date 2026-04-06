



import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database';
import { castToAdminProfile } from '@/utils/adminTypeCasting';
import { toast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminProfile = Database['public']['Tables']['admins']['Row'];
type AdminRole = AdminProfile['role'];

interface LocationData {
  ip: string;
  city: string;
  region: string;
  country: string;
  isp: string;
  timezone: string;
}

/** Granular loading states so consumers can show fine-grained UI */
export type AuthLoadingState =
  | 'idle'           // nothing happening
  | 'initializing'   // first session check on mount
  | 'logging-in'     // login() / loginWithOTP() in flight
  | 'logging-out'    // logout() in flight
  | 'refreshing';    // refreshAdminProfile() in flight

export interface LastLoginInfo {
  timestamp: string;        // ISO string
  ip: string;
  location: string;         // "City, Region, Country"
  method: 'password' | 'otp';
}

/** Role hierarchy — higher index = more permissions */
const ROLE_HIERARCHY: AdminRole[] = [
  'moderator',
  'content',
  'tech',
  'design',
  'admin',
  'super_admin',
];

/**
 * Maps role → set of feature keys that role can access.
 * Extend this as your app grows.
 */
const ROLE_PERMISSIONS: Record<AdminRole, Set<string>> = {
  moderator:   new Set(['dashboard', 'players:read']),
  content:     new Set(['dashboard', 'players:read', 'work-logs:write', 'tournaments:read']),
  design:      new Set(['dashboard', 'players:read', 'work-logs:write', 'tournaments:read']),
  tech:        new Set(['dashboard', 'players:read', 'players:write', 'work-logs:write', 'tournaments:read', 'tournaments:write', 'analytics']),
  admin:       new Set(['dashboard', 'players:read', 'players:write', 'work-logs:write', 'tournaments:read', 'tournaments:write', 'analytics', 'admins:read']),
  super_admin: new Set(['*']),  // wildcard — all features
};

export interface AuthContextType {
  // ── Core auth state ──
  user: User | null;
  adminProfile: AdminProfile | null;
  session: Session | null;

  // ── Loading state ──
  loadingState: AuthLoadingState;
  /** True during any async auth operation — convenience alias */
  isLoading: boolean;
  /** True until the initial session check is complete */
  isInitialized: boolean;

  // ── Last login ──
  lastLogin: LastLoginInfo | null;

  // ── Actions ──
  login: (email: string, password: string) => Promise<void>;
  loginWithOTP: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-fetch the admin profile from Supabase without a full sign-out/in cycle */
  refreshAdminProfile: () => Promise<void>;

  // ── Permission helpers ──
  /** Check if the current admin has a specific role */
  hasRole: (role: AdminRole | AdminRole[]) => boolean;
  /** Check if the current admin's role is at least `minRole` in the hierarchy */
  hasMinRole: (minRole: AdminRole) => boolean;
  /** Check if the current admin can access a named feature */
  canAccess: (feature: string) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UNKNOWN_LOCATION: LocationData = {
  ip: 'Unknown', city: 'Unknown', region: 'Unknown',
  country: 'Unknown', isp: 'Unknown', timezone: 'Unknown',
};

async function fetchLocationData(): Promise<LocationData> {
  // Try Supabase edge function first
  try {
    const response = await supabase.functions.invoke('get-location');
    if (response.data && !response.error) {
      return { ...UNKNOWN_LOCATION, ...response.data };
    }
  } catch { /* fall through */ }

  // Fallback: public IP + whois
  try {
    const ipRes  = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipRes.json();
    if (!ip) return UNKNOWN_LOCATION;
    const whois  = await (await fetch(`https://ipwho.is/${ip}`)).json();
    return {
      ip,
      city:     whois?.city                  || UNKNOWN_LOCATION.city,
      region:   whois?.region                || UNKNOWN_LOCATION.region,
      country:  whois?.country               || UNKNOWN_LOCATION.country,
      isp:      whois?.connection?.isp       || UNKNOWN_LOCATION.isp,
      timezone: whois?.timezone?.id          || UNKNOWN_LOCATION.timezone,
    };
  } catch {
    return UNKNOWN_LOCATION;
  }
}

async function logLoginActivity(
  adminId: string,
  email: string,
  location: LocationData,
  method: 'password' | 'otp',
) {
  try {
    const actionLabel = method === 'otp' ? 'Logged in via OTP' : 'Logged in via password';
    await Promise.all([
      supabase.from('admin_activity_logs').insert({
        admin_id: adminId,
        action:   actionLabel,
        details:  { ...location, timestamp: new Date().toISOString() },
      } as any),
      supabase.from('audit_logs').insert({
        admin_id: adminId,
        action:   method === 'otp' ? 'LOGIN_OTP' : 'LOGIN_PASSWORD',
        details:  {
          email,
          ip:       location.ip,
          location: `${location.city}, ${location.region}, ${location.country}`,
          isp:      location.isp,
          timezone: location.timezone,
          method,
        },
      }),
    ]);
  } catch (error) {
    console.error('[AuthContext] Error logging login activity:', error);
  }
}

/** Resolve last_login info stored in the admins row or activity logs */
function buildLastLoginInfo(
  profile: AdminProfile,
  location: LocationData,
  method: 'password' | 'otp',
): LastLoginInfo {
  return {
    timestamp: new Date().toISOString(),
    ip:        location.ip,
    location:  `${location.city}, ${location.region}, ${location.country}`,
    method,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]                 = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [session, setSession]           = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingState, setLoadingState] = useState<AuthLoadingState>('initializing');
  const [lastLogin, setLastLogin]       = useState<LastLoginInfo | null>(() => {
    // Persist last login across page refreshes
    try {
      const raw = localStorage.getItem('thrylos:lastLogin');
      return raw ? (JSON.parse(raw) as LastLoginInfo) : null;
    } catch {
      return null;
    }
  });

  const persistLastLogin = useCallback((info: LastLoginInfo) => {
    setLastLogin(info);
    try { localStorage.setItem('thrylos:lastLogin', JSON.stringify(info)); } catch { /* quota */ }
  }, []);

  // ─── Fetch admin profile ──────────────────────────────────────────────────

  const fetchAdminProfile = useCallback(async (
    userEmail: string,
    userId: string,
  ): Promise<AdminProfile | null> => {
    try {
      // Primary lookup: user_id
      let { data: profile, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fallback: email
      if (error || !profile) {
        const { data: emailProfile, error: emailError } = await supabase
          .from('admins')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (!emailError && emailProfile) {
          profile = emailProfile;
          // Back-fill user_id for future lookups
          await supabase.from('admins').update({ user_id: userId }).eq('email', userEmail);
        }
      }

      if (!profile) {
        setAdminProfile(null);
        return null;
      }

      // Guard: block inactive / suspended / on-leave accounts
      if (!profile.is_active || profile.status === 'suspended' || profile.status === 'on_leave') {
        const msg =
          !profile.is_active        ? 'Your account has been disabled.'
          : profile.status === 'suspended' ? 'Your account has been suspended.'
          : 'You are currently on leave.';
        toast({
          title:       'Access Denied',
          description: `${msg} Please contact the super admin.`,
          variant:     'destructive',
        });
        await supabase.auth.signOut();
        setUser(null);
        setAdminProfile(null);
        setSession(null);
        return null;
      }

      const cast = castToAdminProfile(profile);
      setAdminProfile(cast);
      return cast;
    } catch (error) {
      console.error('[AuthContext] Error fetching admin profile:', error);
      setAdminProfile(null);
      return null;
    }
  }, []);

  // ─── refreshAdminProfile (public API) ────────────────────────────────────

  const refreshAdminProfile = useCallback(async () => {
    if (!user?.email || !user?.id) return;
    setLoadingState('refreshing');
    try {
      await fetchAdminProfile(user.email, user.id);
    } finally {
      setLoadingState('idle');
    }
  }, [user, fetchAdminProfile]);

  // ─── Auth state listener ──────────────────────────────────────────────────

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initialize = async () => {
      setLoadingState('initializing');

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (newSession?.user?.email) {
            // Defer so onAuthStateChange doesn't block
            setTimeout(() => {
              fetchAdminProfile(newSession.user.email!, newSession.user.id);
            }, 0);
          } else {
            setAdminProfile(null);
          }
        }
      );

      // Hydrate from existing session
      const { data: { session: existing } } = await supabase.auth.getSession();
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user?.email) {
        await fetchAdminProfile(existing.user.email, existing.user.id);
      }

      setIsInitialized(true);
      setLoadingState('idle');

      cleanup = () => subscription.unsubscribe();
    };

    initialize();
    return () => { cleanup?.(); };
  }, [fetchAdminProfile]);

  // ─── login ────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoadingState('logging-in');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data.user?.id;
      let adminId: string | undefined;

      const { data: byUserId } = await supabase
        .from('admins').select('id').eq('user_id', userId).limit(1);
      adminId = byUserId?.[0]?.id;

      if (!adminId) {
        const { data: byEmail } = await supabase
          .from('admins').select('id').eq('email', email).limit(1);
        adminId = byEmail?.[0]?.id;
      }

      if (adminId) {
        const [location] = await Promise.all([
          fetchLocationData(),
          supabase.from('admins')
            .update({ last_login: new Date().toISOString() })
            .eq('id', adminId),
        ]);
        await logLoginActivity(adminId, email, location, 'password');
        persistLastLogin(buildLastLoginInfo(adminProfile!, location, 'password'));
      }
    } finally {
      setLoadingState('idle');
    }
  }, [adminProfile, persistLastLogin]);



  

  // ─── loginWithOTP ─────────────────────────────────────────────────────────

  const loginWithOTP = useCallback(async (email: string, otp: string): Promise<void> => {
    setLoadingState('logging-in');
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', { body: { email, otp } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error('OTP verification failed');

      if (data.token_hash && data.type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type:       data.type,
        });
        if (verifyError) throw verifyError;
      } else if (data.actionLink) {
        const url        = new URL(data.actionLink);
        const token_hash =
          url.searchParams.get('token_hash') ||
          url.hash.split('token_hash=')[1]?.split('&')[0];

        if (token_hash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'magiclink' as any,
          });
          if (verifyError) throw verifyError;
        } else {
          window.location.href = data.actionLink;
          return;
        }
      }

      if (data.adminId) {
        const location = await fetchLocationData();
        await logLoginActivity(data.adminId, email, location, 'otp');
        await supabase.from('admins')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.adminId);
        persistLastLogin({
          timestamp: new Date().toISOString(),
          ip:        location.ip,
          location:  `${location.city}, ${location.region}, ${location.country}`,
          method:    'otp',
        });
      }
    } finally {
      setLoadingState('idle');
    }
  }, [persistLastLogin]);

  // ─── logout ───────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    setLoadingState('logging-out');
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAdminProfile(null);
      setSession(null);
      // Keep lastLogin — it's useful to show "last signed in as X" on the login page
    } finally {
      setLoadingState('idle');
    }
  }, []);



  

  // ─── Permission helpers ───────────────────────────────────────────────────



  

  const hasRole = useCallback((role: AdminRole | AdminRole[]): boolean => {
    if (!adminProfile) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(adminProfile.role as AdminRole);
  }, [adminProfile]);

  const hasMinRole = useCallback((minRole: AdminRole): boolean => {
    if (!adminProfile) return false;
    const myIdx  = ROLE_HIERARCHY.indexOf(adminProfile.role as AdminRole);
    const minIdx = ROLE_HIERARCHY.indexOf(minRole);
    if (myIdx === -1 || minIdx === -1) return false;
    return myIdx >= minIdx;
  }, [adminProfile]);

  const canAccess = useCallback((feature: string): boolean => {
    if (!adminProfile) return false;
    const role        = adminProfile.role as AdminRole;
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    // Wildcard check (super_admin)
    if (permissions.has('*')) return true;
    return permissions.has(feature);
  }, [adminProfile]);



  

  // ─── Memoised context value ───────────────────────────────────────────────



  

  const value = useMemo<AuthContextType>(() => ({
    user,
    adminProfile,
    session,
    loadingState,
    isLoading:       loadingState !== 'idle',
    isInitialized,
    lastLogin,
    login,
    loginWithOTP,
    logout,
    refreshAdminProfile,
    hasRole,
    hasMinRole,
    canAccess,
  }), [
    user, adminProfile, session,
    loadingState, isInitialized, lastLogin,
    login, loginWithOTP, logout, refreshAdminProfile,
    hasRole, hasMinRole, canAccess,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};





// ─── Hooks ────────────────────────────────────────────────────────────────────





export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

/** Convenience: only subscribe to loading/init state */
export const useAuthLoading = () => {
  const { loadingState, isLoading, isInitialized } = useAuth();
  return { loadingState, isLoading, isInitialized };
};

/** Convenience: only subscribe to permission helpers */
export const usePermissions = () => {
  const { hasRole, hasMinRole, canAccess, adminProfile } = useAuth();
  return { hasRole, hasMinRole, canAccess, role: adminProfile?.role };
};

/** Convenience: only subscribe to last login info */
export const useLastLogin = () => {
  const { lastLogin } = useAuth();
  return lastLogin;
};

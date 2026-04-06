import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database';
import { castToAdminProfile } from '@/utils/adminTypeCasting';
import { toast } from '@/hooks/use-toast';
type AdminProfile = Database['public']['Tables']['admins']['Row'];
type AdminRole = AdminProfile['role'];
const UNKNOWN_LOCATION = { ip:'Unknown', city:'Unknown' };
const fetchAdminProfile = useCallback(async (email: string, id: string) => {
  const { data } = await supabase.from('admins').select('*').eq('email', email).single();
  setAdminProfile(data);
}, []);

async function fetchLocationData() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    return await res.json();
  } catch {
    return UNKNOWN_LOCATION;
  }
}

export type AuthLoadingState =
  | 'idle'
  | 'initializing'
  | 'logging-in'
  | 'logging-out'
  | 'refreshing';
const ROLE_HIERARCHY: AdminRole[] = [
  'moderator','content','tech','design','admin','super_admin'
];
export interface AuthContextType {
  user: User | null;
  adminProfile: AdminProfile | null;
  session: Session | null;

  loadingState: AuthLoadingState;
  isLoading: boolean;
  isInitialized: boolean;

  lastLogin: LastLoginInfo | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const ROLE_PERMISSIONS: Record<AdminRole, Set<string>> = {
  moderator: new Set(['dashboard']),
  super_admin: new Set(['*']),
};

export interface LastLoginInfo {
  timestamp: string;
  ip: string;
  location: string;
  method: 'password' | 'otp';
}

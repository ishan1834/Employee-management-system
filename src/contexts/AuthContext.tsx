import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database';
import { castToAdminProfile } from '@/utils/adminTypeCasting';
import { toast } from '@/hooks/use-toast';
type AdminProfile = Database['public']['Tables']['admins']['Row'];
type AdminRole = AdminProfile['role'];

export type AuthLoadingState =
  | 'idle'
  | 'initializing'
  | 'logging-in'
  | 'logging-out'
  | 'refreshing';
const ROLE_HIERARCHY: AdminRole[] = [
  'moderator','content','tech','design','admin','super_admin'
];

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

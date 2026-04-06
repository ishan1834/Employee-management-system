import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database';
import { castToAdminProfile } from '@/utils/adminTypeCasting';
import { toast } from '@/hooks/use-toast';

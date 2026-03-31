import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, RefreshCw, Play, Settings, Download, 
  Eye, TrendingUp, AlertTriangle, FileText, Clock, Shield 
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateForDB } from '@/lib/utils';

// ─── Refined Sub-Components ──────────────────────────────────────────────────

const StatCard = ({ title, value, icon, trend, color = "text-white" }: any) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden"
  >
    <div className="flex justify-between items-start relative z-10">
      <div className="p-2 bg-white/5 rounded-lg text-zinc-400">{icon}</div>
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{trend}</span>
    </div>
    <div className="relative z-10">
      <h3 className={`text-2xl font-bold tracking-tight ${color}`}>{value}</h3>
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-tighter">{title}</p>
    </div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-3xl" />
  </motion.div>
);

// ─── Main Logic ──────────────────────────────────────────────────────────────

const SuperAdminReviewPanel: React.FC = () => {
  // Core Data State (Combined for stability)
  const [data, setData] = useState({
    reviews: [] as any[],
    admins: [] as any[],
    attendance: [] as any[],
    workLogs: [] as any[],
    holidays: [] as string[],
    settings: { threshold: 20, suspension: 7 }
  });

  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // ─── Logic: Memoized Analytics (The "Brain") ───
  const processedStats = useMemo(() => {
    if (!data.admins.length) return [];
    
    // Calculate current month's working days
    const now = new Date();
    const holidaySet = new Set(data.holidays);
    let workingDays = 0;
    for (let i = 1; i <= now.getDate(); i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      if (d.getDay() !== 0 && d.getDay() !== 6 && !holidaySet.has(formatDateForDB(d))) workingDays++;
    }

    return data.admins
      .filter(a => a.role !== 'super_admin')
      .map(admin => {
        const att = data.attendance.filter(r => r.admin_id === admin.id);
        const p = att.filter(r => r.status === 'present').length;
        const l = att.filter(r => r.status === 'late').length;
        const score = p + (l * 0.5);
        const pct = workingDays > 0 ? Math.round((score / workingDays) * 100) : 0;
        
        return { ...admin, score, percentage

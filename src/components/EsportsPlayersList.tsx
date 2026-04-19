import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';
import {
  Edit, Trash2, Search, Download, Filter, X,
  ArrowUpDown, ArrowUp, ArrowDown, Loader2,
  Mail, Phone, Trophy, Gamepad2, Users, CheckCircle2, Clock, CreditCard
} from 'lucide-react';

// ─── Constants & Types ───────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 50;
const PAYMENT_FILTERS = ['All', 'Paid', 'Pending'] as const;
type PaymentFilter = typeof PAYMENT_FILTERS[number];
type SortField = 'player_name' | 'tournament_name' | 'entry_fees' | 'created_at' | 'game_type' | 'rank';
type SortDir = 'asc' | 'desc';

interface Player {
  id: string;
  player_name: string;
  game_uid: string;
  email: string;
  phone?: string;
  tournament_name: string;
  entry_fees: number;
  payment_received: boolean;
  team_name?: string;
  game_type?: string;
  rank?: string;
  avatar_url?: string;
  created_at: string;
}

// ─── Refined Sub-Components ──────────────────────────────────────────────────

const SortableHead = ({ field, label, sortField, sortDir, onSort }: any) => (
  <TableHead 
    className="cursor-pointer select-none hover:text-white transition-colors"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      {label}
      {sortField === field ? (
        sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-30" />
      )}
    </div>
  </TableHead>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const EsportsPlayersList: React.FC<{ onEditPlayer: (p: Player) => void; refreshTrigger: number }> = ({ 
  onEditPlayer, 
  refreshTrigger 
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('All');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; name?: string; bulk?: boolean } | null>(null);

  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  // ─── Logic: Data Fetching ───
  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { count } = await supabase.from('esports_players').select('*', { count: 'exact', head: true });
      setTotalCount(count || 0);

      const { data, error } = await supabase
        .from('esports_players')
        .select('*')
        .order(sortField, { ascending: sortDir === 'asc' })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      setPlayers(data || []);
    } catch (err: any) {
      toast({ title: "Fetch Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, sortField, sortDir, refreshTrigger, toast]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  // ─── Logic: Bulk Actions ───
  const handleBulkPaymentUpdate = async (status: boolean) => {
    const ids = Array.from(selectedIds);
    try {
      const { error } = await supabase
        .from('esports_players')
        .update({ payment_received: status })
        .in('id', ids);

      if (error) throw error;
      
      toast({ title: `Updated ${ids.length} players`, description: `Payment marked as ${status ? 'Received' : 'Pending'}` });
      setSelectedIds(new Set());
      fetchPlayers();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesSearch = !searchTerm || 
        [p.player_name, p.email, p.game_uid, p.team_name].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPayment = paymentFilter === 'All' || 
        (paymentFilter === 'Paid' ? p.payment_received : !p.payment_received);
      return matchesSearch && matchesPayment;
    });
  }, [players, searchTerm, paymentFilter]);

  const toggleAll = () => {
    if (selectedIds.size === filteredPlayers.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredPlayers.map(p => p.id)));
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Toolbar for Selection */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="bg-blue-600 p-2 px-4 rounded-lg flex items-center justify-between text-white shadow-lg"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold">{selectedIds.size} Players Selected</span>
              <Separator orientation="vertical" className="h-4 bg-white/20" />
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleBulkPaymentUpdate(true)}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Paid
                </Button>
                <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleBulkPaymentUpdate(false)}>
                  <Clock className="w-3 h-3 mr-1" /> Mark Pending
                </Button>
              </div>
            </div>
            <Button size="

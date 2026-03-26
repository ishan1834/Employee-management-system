import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Edit, Trash2, Search, Plus, Users, IndianRupee, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ModuleLayout from '@/components/ModuleLayout';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';

const EsportsPlayersListPage: React.FC = () => {
  const navigate = useNavigate();

  const [players, setPlayers] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, paid: 0, totalFees: 0 });

  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
    useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);
    return () => clearInterval(interval);
  }, [currentPage]);

  useEffect(() => {
    filterPlayers();
  }, [players, searchTerm]);

  const fetchPlayers = async () => {
    setIsLoading(true);
    try {
      const { data: allData, error: statsError } = await supabase
        .from('esports_players')
        .select('payment_received, entry_fees');

      if (!statsError && allData) {
        setTotalCount(allData.length);
        setStats({
          total: allData.length,
          paid: allData.filter(p => p.payment_received).length,
          totalFees: allData.reduce((sum, p) => sum + (p.entry_fees || 0), 0)
        });
      }

      const { data, error } = await supabase
        .from('esports_players')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;

      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to fetch players data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
    const filterPlayers = () => {
    if (!searchTerm) {
      setFilteredPlayers(players);
      return;
    }

    const filtered = players.filter(player =>
      player.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.tournament_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.game_uid?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredPlayers(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;

    const playerToDelete = players.find(p => p.id === id);

    try {
      const { error } = await supabase
        .from('esports_players')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logActivity(ActivityActions.DELETE_ESPORTS_PLAYER, { 
        player_name: playerToDelete?.player_name,
        tournament: playerToDelete?.tournament_name
      });

      toast({
        title: "Success",
        description: "Player deleted successfully!",
      });

      fetchPlayers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete player",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (playerId: string) => {
    navigate(`/dashboard/esports/add-player?edit=${playerId}`);
  };
  return (
    <ModuleLayout title="Esports Players">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Users className="w-6 h-6 text-blue-500" />
            <div>
              <p>Total Players</p>
              <p>{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <p>Paid Players</p>
              <p>{stats.paid}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <IndianRupee className="w-6 h-6 text-orange-500" />
            <div>
              <p>Total Fees</p>
              <p>₹{stats.totalFees}</p>
            </div>
          </CardContent>
        </Card>

      </div>

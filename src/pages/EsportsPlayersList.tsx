import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Edit, Trash2, Search, Plus, Gamepad2, Users, IndianRupee, CheckCircle } from 'lucide-react';
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

      // Log the activity
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
    <ModuleLayout
      title="Esports Players"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Players</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Players</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-2xl font-bold">₹{stats.totalFees.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl">Players List</CardTitle>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full md:w-64 bg-background/50"
                />
              </div>
              <Button onClick={() => navigate('/dashboard/esports/add-player')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="font-semibold">Player Name</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Tournament</TableHead>
                      <TableHead className="font-semibold">Game UID</TableHead>
                      <TableHead className="font-semibold">Entry Fees</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.map((player) => (
                      <TableRow key={player.id} className="border-border/50">
                        <TableCell className="font-medium">{player.player_name}</TableCell>
                        <TableCell className="text-muted-foreground">{player.email}</TableCell>
                        <TableCell>{player.tournament_name}</TableCell>
                        <TableCell className="font-mono text-sm">{player.game_uid}</TableCell>
                        <TableCell>₹{player.entry_fees?.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            player.payment_received 
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                          }`}>
                            {player.payment_received ? 'Paid' : 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(player.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(player.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredPlayers.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'No players found matching your search.' : 'No players found. Add your first player!'}
                </div>
              )}

              {totalPages > 1 && (
                <div className="p-4 border-t border-border/50">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Page {currentPage} of {totalPages} • {totalCount} total players
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </ModuleLayout>
  );
};

export default EsportsPlayersListPage;

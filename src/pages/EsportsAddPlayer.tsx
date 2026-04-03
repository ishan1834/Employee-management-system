import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ModuleLayout from '@/components/ModuleLayout';
import { ArrowLeft, Gamepad2, Save, X } from 'lucide-react';

const EsportsAddPlayer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
  playerName: '',
  gameUid: '',
  email: '',
  tournamentName: '',
  entryFees: 0,
  paymentReceived: false,
});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch player data if editing
  useEffect(() => {
  if (!editId) return;

  fetchPlayerData(editId);
}, [editId]);

  const fetchPlayerData = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('esports_players')
        .select('*')
        .eq('id', editId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          player_name: data.player_name || '',
          game_uid: data.game_uid || '',
          email: data.email || '',
          tournament_name: data.tournament_name || '',
          entry_fees: data.entry_fees?.toString() || '',
          payment_received: data.payment_received || false
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch player data",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const playerData = {
        ...formData,
        entry_fees: parseFloat(formData.entry_fees) || 0
      };

      if (editId) {
        const { error } = await supabase
          .from('esports_players')
          .update(playerData)
          .eq('id', editId);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Player updated successfully!",
        });
      } else {
        const { error } = await supabase
          .from('esports_players')
          .insert([playerData]);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Player added successfully!",
        });
      }

      navigate('/dashboard/esports/players');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save player data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModuleLayout
      title={editId ? "Edit Player" : "Add New Player"}
    >
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/esports/players')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Players List
        </Button>

        <Card className="border border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-primary" />
              </div>
              {editId ? 'Edit Player Details' : 'Add New Esports Player'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isFetching ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="player_name">Player Name *</Label>
                    <Input
                      id="player_name"
                      value={formData.player_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, player_name: e.target.value }))}
                      required
                      placeholder="Enter player name"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="game_uid">Game UID *</Label>
                    <Input
                      id="game_uid"
                      value={formData.game_uid}
                      onChange={(e) => setFormData(prev => ({ ...prev, game_uid: e.target.value }))}
                      required
                      placeholder="Enter game UID"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="Enter email address"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tournament_name">Tournament Name *</Label>
                    <Input
                      id="tournament_name"
                      value={formData.tournament_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, tournament_name: e.target.value }))}
                      required
                      placeholder="Enter tournament name"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entry_fees">Entry Fees (₹) *</Label>
                    <Input
                      id="entry_fees"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.entry_fees}
                      onChange={(e) => setFormData(prev => ({ ...prev, entry_fees: e.target.value }))}
                      required
                      placeholder="0.00"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-6">
                    <Switch
                      id="payment_received"
                      checked={formData.payment_received}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, payment_received: checked }))}
                    />
                    <Label htmlFor="payment_received" className="cursor-pointer">
                      Payment Received
                    </Label>
                    {formData.payment_received && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                        Paid
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border/50">
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="flex-1 md:flex-none"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Saving..." : (editId ? "Update Player" : "Add Player")}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/dashboard/esports/players')}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
};

export default EsportsAddPlayer;

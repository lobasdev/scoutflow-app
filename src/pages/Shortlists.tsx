import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Download, Users, User, LogOut, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { exportShortlistToCSV } from "@/utils/shortlistCsvExporter";
import { formatEstimatedValue } from "@/utils/valueFormatter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

interface Shortlist {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Player {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  nationality: string | null;
  photo_url: string | null;
  date_of_birth: string | null;
  estimated_value_numeric: number | null;
  recommendation: string | null;
  foot: string | null;
  height: number | null;
  weight: number | null;
  appearances: number | null;
  goals: number | null;
  assists: number | null;
}

interface ShortlistPlayer extends Player {
  added_at: string;
}

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const Shortlists = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [selectedShortlist, setSelectedShortlist] = useState<Shortlist | null>(null);
  const [shortlistPlayers, setShortlistPlayers] = useState<ShortlistPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shortlistToDelete, setShortlistToDelete] = useState<Shortlist | null>(null);
  const [newShortlist, setNewShortlist] = useState({ name: "", description: "" });
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
  const [playerShortlists, setPlayerShortlists] = useState<Set<string>>(new Set());

  // Fetch player counts for ALL shortlists
  const { data: shortlistCounts = {} } = useQuery({
    queryKey: ["shortlist-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_shortlists")
        .select("shortlist_id");
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        counts[item.shortlist_id] = (counts[item.shortlist_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchShortlists();
  }, [user, navigate]);

  const fetchShortlists = async () => {
    try {
      const { data, error } = await supabase
        .from("shortlists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShortlists(data || []);
      
      if (data && data.length > 0 && !selectedShortlist) {
        setSelectedShortlist(data[0]);
      }
    } catch (error: any) {
      toast.error("Failed to fetch shortlists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedShortlist) {
      fetchShortlistPlayers(selectedShortlist.id);
    }
  }, [selectedShortlist]);

  const fetchShortlistPlayers = async (shortlistId: string) => {
    try {
      const { data, error } = await supabase
        .from("player_shortlists")
        .select(`
          added_at,
          players (
            id,
            name,
            position,
            team,
            nationality,
            photo_url,
            date_of_birth,
            estimated_value_numeric,
            recommendation,
            foot,
            height,
            weight,
            appearances,
            goals,
            assists
          )
        `)
        .eq("shortlist_id", shortlistId)
        .order("added_at", { ascending: false });

      if (error) throw error;
      
      const players = data.map((item: any) => ({
        ...item.players,
        added_at: item.added_at
      }));
      
      setShortlistPlayers(players || []);
      
      // Update playerShortlists set
      const playerIds = new Set(players.map((p: any) => p.id));
      setPlayerShortlists(playerIds);
    } catch (error: any) {
      toast.error("Failed to fetch shortlist players");
    }
  };

  const fetchAvailablePlayers = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("name");

      if (error) throw error;
      setAvailablePlayers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch available players");
    }
  };

  const handleOpenAddPlayerDialog = () => {
    fetchAvailablePlayers();
    setAddPlayerDialogOpen(true);
  };

  const handleTogglePlayer = async (playerId: string) => {
    if (!selectedShortlist) return;
    
    const isInShortlist = playerShortlists.has(playerId);

    try {
      if (isInShortlist) {
        const { error } = await supabase
          .from("player_shortlists")
          .delete()
          .eq("player_id", playerId)
          .eq("shortlist_id", selectedShortlist.id);

        if (error) throw error;
        toast.success("Player removed from shortlist");
      } else {
        const { error } = await supabase
          .from("player_shortlists")
          .insert({
            player_id: playerId,
            shortlist_id: selectedShortlist.id,
          });

        if (error) throw error;
        toast.success("Player added to shortlist");
      }

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["player-shortlists"] });
      queryClient.invalidateQueries({ queryKey: ["shortlist-counts"] });
      
      // Refresh the shortlist
      fetchShortlistPlayers(selectedShortlist.id);
    } catch (error: any) {
      toast.error("Failed to update shortlist");
    }
  };

  const handleCreateShortlist = async () => {
    if (!newShortlist.name.trim()) {
      toast.error("Shortlist name is required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("shortlists")
        .insert({
          name: newShortlist.name,
          description: newShortlist.description || null,
          scout_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setShortlists([data, ...shortlists]);
      setSelectedShortlist(data);
      setNewShortlist({ name: "", description: "" });
      setCreateDialogOpen(false);
      toast.success("Shortlist created successfully");
    } catch (error: any) {
      toast.error("Failed to create shortlist");
    }
  };

  const handleUpdateShortlist = async () => {
    if (!selectedShortlist || !newShortlist.name.trim()) {
      toast.error("Shortlist name is required");
      return;
    }

    try {
      const { error } = await supabase
        .from("shortlists")
        .update({
          name: newShortlist.name,
          description: newShortlist.description || null
        })
        .eq("id", selectedShortlist.id);

      if (error) throw error;

      const updatedShortlist = {
        ...selectedShortlist,
        name: newShortlist.name,
        description: newShortlist.description || null
      };

      setShortlists(shortlists.map(s => s.id === selectedShortlist.id ? updatedShortlist : s));
      setSelectedShortlist(updatedShortlist);
      setEditDialogOpen(false);
      toast.success("Shortlist updated successfully");
    } catch (error: any) {
      toast.error("Failed to update shortlist");
    }
  };

  const handleDeleteShortlist = async () => {
    if (!shortlistToDelete) return;

    try {
      const { error } = await supabase
        .from("shortlists")
        .delete()
        .eq("id", shortlistToDelete.id);

      if (error) throw error;

      const updatedShortlists = shortlists.filter(s => s.id !== shortlistToDelete.id);
      setShortlists(updatedShortlists);
      
      if (selectedShortlist?.id === shortlistToDelete.id) {
        setSelectedShortlist(updatedShortlists[0] || null);
      }

      setDeleteDialogOpen(false);
      setShortlistToDelete(null);
      toast.success("Shortlist deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete shortlist");
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!selectedShortlist) return;

    try {
      const { error } = await supabase
        .from("player_shortlists")
        .delete()
        .eq("shortlist_id", selectedShortlist.id)
        .eq("player_id", playerId);

      if (error) throw error;

      setShortlistPlayers(shortlistPlayers.filter(p => p.id !== playerId));
      toast.success("Player removed from shortlist");
    } catch (error: any) {
      toast.error("Failed to remove player");
    }
  };

  const handleExportCSV = () => {
    if (!selectedShortlist || shortlistPlayers.length === 0) {
      toast.error("No players to export");
      return;
    }

    exportShortlistToCSV(selectedShortlist.name, shortlistPlayers);
    toast.success("CSV exported successfully");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">ScoutFlow</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Shortlists</h2>
        </div>

        {/* Shortlist selector and actions */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  New Shortlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Shortlist</DialogTitle>
                  <DialogDescription>
                    Create a new shortlist to organize players
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newShortlist.name}
                      onChange={(e) => setNewShortlist({ ...newShortlist, name: e.target.value })}
                      placeholder="e.g., Top Prospects, Summer Targets"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newShortlist.description}
                      onChange={(e) => setNewShortlist({ ...newShortlist, description: e.target.value })}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateShortlist}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {selectedShortlist && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenAddPlayerDialog}
                  title="Add players to shortlist"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setNewShortlist({
                      name: selectedShortlist.name,
                      description: selectedShortlist.description || ""
                    });
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExportCSV}
                  disabled={shortlistPlayers.length === 0}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Shortlist tabs */}
          {shortlists.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {shortlists.map((shortlist) => (
                <Button
                  key={shortlist.id}
                  variant={selectedShortlist?.id === shortlist.id ? "default" : "outline"}
                  className="whitespace-nowrap"
                  onClick={() => setSelectedShortlist(shortlist)}
                >
                  {shortlist.name}
                  <Badge variant="secondary" className="ml-2">
                    {shortlistCounts[shortlist.id] || 0}
                  </Badge>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {shortlists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No Shortlists Yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first shortlist to organize players
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Shortlist
              </Button>
            </CardContent>
          </Card>
        ) : selectedShortlist ? (
          <div>
            {selectedShortlist.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {selectedShortlist.description}
              </p>
            )}

            {shortlistPlayers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No Players in this Shortlist</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add players from their profile page
                  </p>
                  <Button onClick={() => navigate("/")}>
                    Browse Players
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {shortlistPlayers.map((player) => (
                  <Card key={player.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="cursor-pointer" onClick={() => navigate(`/player/${player.id}`)}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {player.photo_url ? (
                            <img
                              src={player.photo_url}
                              alt={player.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-primary">
                              <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{player.name}</CardTitle>
                            <div className="flex gap-2 mt-1">
                              {player.position && (
                                <Badge variant="secondary">{player.position}</Badge>
                              )}
                              {player.date_of_birth && (
                                <Badge variant="outline">{calculateAge(player.date_of_birth)}y</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="cursor-pointer" onClick={() => navigate(`/player/${player.id}`)}>
                      <div className="space-y-2 text-sm">
                        {player.team && <p><span className="font-semibold">Team:</span> {player.team}</p>}
                        {player.nationality && <p><span className="font-semibold">Nationality:</span> {player.nationality}</p>}
                        {player.estimated_value_numeric && (
                          <p>
                            <span className="font-semibold">Value:</span>{" "}
                            <Badge variant="secondary">
                              {formatEstimatedValue(player.estimated_value_numeric)}
                            </Badge>
                          </p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlayer(player.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Delete shortlist button */}
            <div className="mt-6 flex justify-center">
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  setShortlistToDelete(selectedShortlist);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Shortlist
              </Button>
            </div>
          </div>
        ) : null}
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shortlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={newShortlist.name}
                onChange={(e) => setNewShortlist({ ...newShortlist, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newShortlist.description}
                onChange={(e) => setNewShortlist({ ...newShortlist, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateShortlist}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shortlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{shortlistToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShortlistToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShortlist} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Player Dialog */}
      <Dialog open={addPlayerDialogOpen} onOpenChange={setAddPlayerDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Players to Shortlist</DialogTitle>
            <DialogDescription>
              Select players to add to "{selectedShortlist?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto max-h-96">
            {availablePlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No players available</p>
            ) : (
              availablePlayers.map((player) => (
                <div key={player.id} className="flex items-center space-x-3 p-3 hover:bg-accent rounded-lg">
                  <Checkbox
                    id={`player-${player.id}`}
                    checked={playerShortlists.has(player.id)}
                    onCheckedChange={() => handleTogglePlayer(player.id)}
                  />
                  <label
                    htmlFor={`player-${player.id}`}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{player.name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {player.position && <span>{player.position}</span>}
                        {player.estimated_value_numeric && (
                          <span>• {formatEstimatedValue(player.estimated_value_numeric)}</span>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPlayerDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Shortlists;

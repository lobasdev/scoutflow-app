import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Trash2, ArrowRight, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InboxPlayer {
  id: string;
  name: string;
  position: string | null;
  shirt_number: string | null;
  team: string | null;
  nationality: string | null;
  notes: string | null;
  created_at: string;
}

const Inbox = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    shirt_number: "",
    team: "",
    nationality: "",
    notes: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: inboxPlayers = [], isLoading } = useQuery({
    queryKey: ["inbox-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbox_players")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const filteredPlayers = inboxPlayers.filter(player => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      player.name.toLowerCase().includes(query) ||
      (player.team && player.team.toLowerCase().includes(query)) ||
      (player.position && player.position.toLowerCase().includes(query))
    );
  });

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("inbox_players")
        .insert({
          scout_id: user?.id,
          ...formData,
        });

      if (error) throw error;
      
      toast.success("Player added to inbox");
      setAddDialogOpen(false);
      setFormData({
        name: "",
        position: "",
        shirt_number: "",
        team: "",
        nationality: "",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["inbox-players"] });
    } catch (error: any) {
      toast.error("Failed to add player");
    }
  };

  const handleConvertToFullProfile = async (inboxPlayer: InboxPlayer) => {
    try {
      // Create full player profile
      const { data: newPlayer, error: insertError } = await supabase
        .from("players")
        .insert({
          scout_id: user?.id,
          name: inboxPlayer.name,
          position: inboxPlayer.position,
          shirt_number: inboxPlayer.shirt_number,
          team: inboxPlayer.team,
          nationality: inboxPlayer.nationality,
          scout_notes: inboxPlayer.notes,
          tags: ["Inbox"],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Delete from inbox
      const { error: deleteError } = await supabase
        .from("inbox_players")
        .delete()
        .eq("id", inboxPlayer.id);

      if (deleteError) throw deleteError;

      toast.success("Converted to full profile");
      queryClient.invalidateQueries({ queryKey: ["inbox-players"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      
      // Navigate to the new player's edit page
      navigate(`/player/${newPlayer.id}/edit`);
    } catch (error: any) {
      toast.error("Failed to convert player");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("inbox_players")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Player removed from inbox");
      queryClient.invalidateQueries({ queryKey: ["inbox-players"] });
    } catch (error: any) {
      toast.error("Failed to delete player");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold ml-2">Inbox</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSearch(!showSearch)}
              >
                {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </Button>
              <Button 
                onClick={() => setAddDialogOpen(true)}
                size="default"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Quick Add</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <p className="text-muted-foreground mb-4">
            Quickly capture player info during scouting sessions. Convert to full profiles when ready.
          </p>
          
          {showSearch && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Input
                placeholder="Search by name, team, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading inbox...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {inboxPlayers.length === 0 
                ? "No players in inbox yet. Use quick add to capture players during scouting."
                : "No players match your search."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPlayers.map((player) => (
              <Card key={player.id} className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{player.name}</span>
                    <Badge variant="outline" className="text-xs">Inbox</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {player.position && (
                      <div>
                        <span className="text-muted-foreground">Position:</span>
                        <p className="font-medium">{player.position}</p>
                      </div>
                    )}
                    {player.shirt_number && (
                      <div>
                        <span className="text-muted-foreground">Number:</span>
                        <p className="font-medium">#{player.shirt_number}</p>
                      </div>
                    )}
                    {player.team && (
                      <div>
                        <span className="text-muted-foreground">Team:</span>
                        <p className="font-medium">{player.team}</p>
                      </div>
                    )}
                    {player.nationality && (
                      <div>
                        <span className="text-muted-foreground">Nationality:</span>
                        <p className="font-medium">{player.nationality}</p>
                      </div>
                    )}
                  </div>
                  
                  {player.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground line-clamp-2">{player.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => handleConvertToFullProfile(player)}
                      className="flex-1"
                      size="sm"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Convert to Full Profile
                    </Button>
                    <Button 
                      onClick={() => handleDelete(player.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add Player Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Add Player</DialogTitle>
            <DialogDescription>
              Capture essential player info quickly. You can convert to a full profile later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., ST, CM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shirt_number">Shirt #</Label>
                <Input
                  id="shirt_number"
                  value={formData.shirt_number}
                  onChange={(e) => setFormData({ ...formData, shirt_number: e.target.value })}
                  placeholder="e.g., 9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Input
                id="team"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Quick Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Add to Inbox</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inbox;

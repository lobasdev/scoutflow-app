import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Edit, Plus, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Match {
  id: string;
  name: string;
  date: string;
  location: string | null;
  home_team: string;
  away_team: string;
  notes: string | null;
  tournament_id: string | null;
}

interface MatchPlayer {
  id: string;
  team: "home" | "away";
  name: string;
  position: string | null;
  shirt_number: string | null;
  observation_id: string | null;
}

interface ObservationData {
  rating: number;
  notes: string;
  tags: string;
}

const playerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  position: z.string().max(50).optional(),
  shirtNumber: z.string().max(10).optional(),
  team: z.enum(["home", "away"]),
});

const MatchDetails = () => {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [homePlayers, setHomePlayers] = useState<MatchPlayer[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<MatchPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [observationDialogOpen, setObservationDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<MatchPlayer | null>(null);
  const [sortBy, setSortBy] = useState("shirt_number");
  const [playerForm, setPlayerForm] = useState({
    name: "",
    position: "",
    shirtNumber: "",
    team: "home" as "home" | "away",
  });
  const [observationForm, setObservationForm] = useState<ObservationData>({
    rating: 5,
    notes: "",
    tags: "",
  });

  useEffect(() => {
    fetchMatchData();
  }, [matchId, sortBy]);

  const fetchMatchData = async () => {
    try {
      const [matchRes, playersRes] = await Promise.all([
        supabase.from("matches").select("*").eq("id", matchId).single(),
        supabase.from("match_players").select("*").eq("match_id", matchId),
      ]);

      if (matchRes.error) throw matchRes.error;
      if (playersRes.error) throw playersRes.error;

      setMatch(matchRes.data);

      let sortedPlayers = playersRes.data || [];
      switch (sortBy) {
        case "shirt_number":
          sortedPlayers.sort((a, b) => {
            const numA = parseInt(a.shirt_number || "999");
            const numB = parseInt(b.shirt_number || "999");
            return numA - numB;
          });
          break;
        case "name":
          sortedPlayers.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }

      setHomePlayers(sortedPlayers.filter((p) => p.team === "home") as MatchPlayer[]);
      setAwayPlayers(sortedPlayers.filter((p) => p.team === "away") as MatchPlayer[]);
    } catch (error: any) {
      toast.error("Failed to fetch match data");
      navigate("/matches");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    try {
      const validated = playerSchema.parse(playerForm);

      const { error } = await supabase.from("match_players").insert([
        {
          match_id: matchId,
          name: validated.name,
          position: validated.position || null,
          shirt_number: validated.shirtNumber || null,
          team: validated.team,
        },
      ]);

      if (error) throw error;

      toast.success("Player added successfully");
      setPlayerDialogOpen(false);
      setPlayerForm({ name: "", position: "", shirtNumber: "", team: "home" });
      fetchMatchData();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to add player");
      }
    }
  };

  const handleSaveObservation = async () => {
    if (!selectedPlayer) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create observation
      const { data: observation, error: obsError } = await supabase
        .from("observations")
        .insert([
          {
            player_id: null, // Quick observation not linked to full player yet
            match_id: matchId,
            date: match?.date,
            location: match?.name,
            notes: `${observationForm.notes}\n\nTags: ${observationForm.tags}\nRating: ${observationForm.rating}/10`,
          },
        ])
        .select()
        .single();

      if (obsError) throw obsError;

      // Link observation to match player
      const { error: updateError } = await supabase
        .from("match_players")
        .update({ observation_id: observation.id })
        .eq("id", selectedPlayer.id);

      if (updateError) throw updateError;

      toast.success("Observation saved successfully");
      setObservationDialogOpen(false);
      setObservationForm({ rating: 5, notes: "", tags: "" });
      setSelectedPlayer(null);
      fetchMatchData();
    } catch (error: any) {
      toast.error("Failed to save observation");
    }
  };

  const handleConvertToPlayer = async () => {
    if (!selectedPlayer) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create full player profile
      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert([
          {
            scout_id: user.id,
            name: selectedPlayer.name,
            position: selectedPlayer.position,
            shirt_number: selectedPlayer.shirt_number,
            scout_notes: observationForm.notes,
            tags: observationForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
          },
        ])
        .select()
        .single();

      if (playerError) throw playerError;

      // Create observation linked to player
      const { data: observation, error: obsError } = await supabase
        .from("observations")
        .insert([
          {
            player_id: player.id,
            match_id: matchId,
            date: match?.date,
            location: match?.name,
            notes: observationForm.notes,
          },
        ])
        .select()
        .single();

      if (obsError) throw obsError;

      // Update match player with observation
      await supabase
        .from("match_players")
        .update({ observation_id: observation.id })
        .eq("id", selectedPlayer.id);

      toast.success("Player profile created successfully");
      navigate(`/player/${player.id}`);
    } catch (error: any) {
      toast.error("Failed to create player profile");
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from("match_players")
        .delete()
        .eq("id", playerId);

      if (error) throw error;
      toast.success("Player removed from match");
      fetchMatchData();
    } catch (error) {
      toast.error("Failed to remove player");
    }
  };

  const renderPlayerCard = (player: MatchPlayer) => (
    <Card
      key={player.id}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => {
        setSelectedPlayer(player);
        setObservationDialogOpen(true);
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {player.shirt_number ? (
                <span className="font-bold text-primary">{player.shirt_number}</span>
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{player.name}</h3>
              {player.position && (
                <p className="text-sm text-muted-foreground">{player.position}</p>
              )}
              {player.observation_id && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✓ Observed
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePlayer(player.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate("/matches")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="ml-2">
              <h1 className="text-xl font-bold">{match.name}</h1>
              <p className="text-sm opacity-90">
                {match.home_team} vs {match.away_team}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/matches/${matchId}/edit`)}>
            <Edit className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-32 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Match Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Date:</span>{" "}
              {new Date(match.date).toLocaleDateString()}
            </p>
            {match.location && (
              <p>
                <span className="font-semibold">Location:</span> {match.location}
              </p>
            )}
            {match.notes && (
              <p className="text-muted-foreground whitespace-pre-wrap">{match.notes}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Players</h2>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shirt_number">By Number</SelectItem>
                <SelectItem value="name">By Name</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setPlayerDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Player
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 text-primary">{match.home_team}</h3>
            {homePlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No players added yet
              </p>
            ) : (
              <div className="space-y-2">{homePlayers.map(renderPlayerCard)}</div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-secondary">{match.away_team}</h3>
            {awayPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No players added yet
              </p>
            ) : (
              <div className="space-y-2">{awayPlayers.map(renderPlayerCard)}</div>
            )}
          </div>
        </div>
      </main>

      {/* Add Player Dialog */}
      <Dialog open={playerDialogOpen} onOpenChange={setPlayerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Player to Match</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Name *</Label>
              <Input
                id="playerName"
                value={playerForm.name}
                onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                placeholder="Player name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team *</Label>
              <Select
                value={playerForm.team}
                onValueChange={(value: "home" | "away") =>
                  setPlayerForm({ ...playerForm, team: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">{match.home_team}</SelectItem>
                  <SelectItem value="away">{match.away_team}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={playerForm.position}
                  onChange={(e) =>
                    setPlayerForm({ ...playerForm, position: e.target.value })
                  }
                  placeholder="e.g., FW"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shirtNumber">Number</Label>
                <Input
                  id="shirtNumber"
                  value={playerForm.shirtNumber}
                  onChange={(e) =>
                    setPlayerForm({ ...playerForm, shirtNumber: e.target.value })
                  }
                  placeholder="e.g., 10"
                />
              </div>
            </div>
            <Button onClick={handleAddPlayer} className="w-full">
              Add Player
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Observation Dialog */}
      <Dialog open={observationDialogOpen} onOpenChange={setObservationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Observation - {selectedPlayer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating: {observationForm.rating}/10</Label>
              <Slider
                value={[observationForm.rating]}
                onValueChange={([value]) =>
                  setObservationForm({ ...observationForm, rating: value })
                }
                min={1}
                max={10}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={observationForm.notes}
                onChange={(e) =>
                  setObservationForm({ ...observationForm, notes: e.target.value })
                }
                placeholder="Quick observations..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={observationForm.tags}
                onChange={(e) =>
                  setObservationForm({ ...observationForm, tags: e.target.value })
                }
                placeholder="e.g., pace, dribbling, weak finishing"
              />
            </div>
            <div className="space-y-2">
              <Button onClick={handleSaveObservation} className="w-full">
                Save Observation
              </Button>
              <Button onClick={handleConvertToPlayer} variant="secondary" className="w-full">
                Create Full Player Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchDetails;
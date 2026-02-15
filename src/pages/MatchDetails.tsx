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
import { Edit, Plus, Trash2, Video, Star, FileDown, Zap, Trophy } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import PageHeader from "@/components/PageHeader";
import { VoiceNotesSection } from "@/components/voice-notes/VoiceNotesSection";
import { generateMatchReportPDF } from "@/utils/pdfService";
import { useQuery } from "@tanstack/react-query";
import QuickRateMode from "@/components/match/QuickRateMode";

interface Match {
  id: string;
  name: string;
  date: string;
  location: string | null;
  home_team: string;
  away_team: string;
  notes: string | null;
  tournament_id: string | null;
  weather: string | null;
  kickoff_time: string | null;
  match_video_link: string | null;
}

interface MatchPlayer {
  id: string;
  team: "home" | "away";
  name: string;
  position: string | null;
  shirt_number: string | null;
  observation_id: string | null;
  is_starter: boolean;
  rating: number | null;
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
  const [sortBy, setSortBy] = useState("position");
  const [playerForm, setPlayerForm] = useState({
    name: "",
    position: "",
    shirtNumber: "",
    team: "home" as "home" | "away",
    isStarter: true,
  });
  const [shirtNumberError, setShirtNumberError] = useState<string>("");
  const [observationForm, setObservationForm] = useState<ObservationData>({
    rating: 5,
    notes: "",
    tags: "",
  });
  const [quickModeOpen, setQuickModeOpen] = useState(false);

  useEffect(() => {
    fetchMatchData();
  }, [matchId, sortBy]);

  // Fetch tournament info if match is linked
  const { data: tournament } = useQuery({
    queryKey: ["match-tournament", match?.tournament_id],
    queryFn: async () => {
      if (!match?.tournament_id) return null;
      const { data, error } = await supabase
        .from("tournaments")
        .select("id, name")
        .eq("id", match.tournament_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!match?.tournament_id,
  });

  const fetchMatchData = async () => {
    try {
      const [matchRes, playersRes] = await Promise.all([
        supabase.from("matches").select("*").eq("id", matchId).single(),
        supabase.from("match_players").select("*").eq("match_id", matchId),
      ]);

      if (matchRes.error) throw matchRes.error;
      if (playersRes.error) throw playersRes.error;

      // Fetch ratings for players with observations
      const playerIds = playersRes.data.filter(p => p.observation_id).map(p => p.observation_id);
      let ratingsMap: Record<string, number> = {};
      
      if (playerIds.length > 0) {
        const { data: observations } = await supabase
          .from("observations")
          .select("id, notes")
          .in("id", playerIds);
        
        // Extract ratings from observation notes (format: "Rating: X/10")
        observations?.forEach(obs => {
          const ratingMatch = obs.notes?.match(/Rating:\s*(\d+(?:\.\d+)?)\s*\/\s*10/);
          if (ratingMatch) {
            ratingsMap[obs.id] = parseFloat(ratingMatch[1]);
          }
        });
      }

      // Add ratings to players
      const playersWithRatings = playersRes.data.map(player => ({
        ...player,
        rating: player.observation_id && ratingsMap[player.observation_id] 
          ? ratingsMap[player.observation_id] 
          : null
      }));

      setMatch(matchRes.data);

      // Position order: GK -> Defenders -> Midfielders -> Forwards
      const positionOrder: Record<string, number> = {
        'GK': 1,
        'CB': 2, 'LB': 3, 'RB': 4, 'LWB': 5, 'RWB': 6,
        'CDM': 7, 'CM': 8, 'CAM': 9,
        'LW': 10, 'RW': 11, 'CF': 12, 'ST': 13
      };

      const getPositionOrder = (position: string | null): number => {
        if (!position) return 999;
        return positionOrder[position.toUpperCase()] || 999;
      };

      // Separate starters and subs FIRST, then sort within each group
      const allPlayers = playersWithRatings || [];
      const homeTeam = allPlayers.filter((p) => p.team === "home");
      const awayTeam = allPlayers.filter((p) => p.team === "away");

      const sortPlayers = (players: any[]) => {
        const starters = players.filter(p => p.is_starter);
        const subs = players.filter(p => !p.is_starter);
        
        const sortFn = (a: any, b: any) => {
          switch (sortBy) {
            case "position":
              const orderA = getPositionOrder(a.position);
              const orderB = getPositionOrder(b.position);
              if (orderA !== orderB) return orderA - orderB;
              const numA = parseInt(a.shirt_number || "999");
              const numB = parseInt(b.shirt_number || "999");
              return numA - numB;
            case "shirt_number":
              return parseInt(a.shirt_number || "999") - parseInt(b.shirt_number || "999");
            case "name":
              return a.name.localeCompare(b.name);
            default:
              return 0;
          }
        };

        return [...starters.sort(sortFn), ...subs.sort(sortFn)];
      };

      setHomePlayers(sortPlayers(homeTeam) as MatchPlayer[]);
      setAwayPlayers(sortPlayers(awayTeam) as MatchPlayer[]);
    } catch (error: any) {
      toast.error("Failed to fetch match data");
      navigate("/matches");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    try {
      setShirtNumberError("");
      
      // Validate shirt number
      if (playerForm.shirtNumber) {
        const num = parseInt(playerForm.shirtNumber);
        if (isNaN(num) || num < 1 || num > 99) {
          setShirtNumberError("Shirt number must be between 1 and 99");
          return;
        }
        
        // Check uniqueness within team
        const teamPlayers = playerForm.team === "home" ? homePlayers : awayPlayers;
        const duplicate = teamPlayers.find(p => p.shirt_number === playerForm.shirtNumber);
        if (duplicate) {
          setShirtNumberError(`Number ${playerForm.shirtNumber} is already used by ${duplicate.name}`);
          return;
        }
      }

      // Check Starting XI limit
      if (playerForm.isStarter) {
        const teamPlayers = playerForm.team === "home" ? homePlayers : awayPlayers;
        const startersCount = teamPlayers.filter(p => p.is_starter).length;
        if (startersCount >= 11) {
          toast.error("Starting XI is full (11 players maximum)");
          return;
        }
      }

      const validated = playerSchema.parse(playerForm);

      const { error } = await supabase.from("match_players").insert([
        {
          match_id: matchId,
          name: validated.name,
          position: validated.position || null,
          shirt_number: validated.shirtNumber || null,
          team: validated.team,
          is_starter: playerForm.isStarter,
        },
      ]);

      if (error) throw error;

      toast.success("Player added successfully");
      setPlayerDialogOpen(false);
      setPlayerForm({ name: "", position: "", shirtNumber: "", team: "home", isStarter: true });
      setShirtNumberError("");
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

      // Create observation with null player_id for quick observations
      const { data: observation, error: obsError } = await supabase
        .from("observations")
        .insert([
          {
            player_id: null,
            match_id: matchId,
            date: match?.date || new Date().toISOString().split("T")[0],
            location: match?.name || null,
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
      console.error("Observation save error:", error);
      toast.error(error.message || "Failed to save observation");
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
            date: match?.date || new Date().toISOString().split("T")[0],
            location: match?.name || null,
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

  const renderPlayerRow = (player: MatchPlayer) => {
    const isStarter = player.is_starter;
    return (
      <div
        key={player.id}
        className={`flex items-center gap-2 py-2 px-3 rounded hover:bg-accent/50 transition-colors cursor-pointer border-l-2 ${
          isStarter ? "border-l-primary" : "border-l-muted"
        }`}
        onClick={() => {
          setSelectedPlayer(player);
          setObservationDialogOpen(true);
        }}
      >
        <div className="w-8 text-center font-mono text-sm font-semibold text-muted-foreground">
          {player.shirt_number || "-"}
        </div>
        <div className="w-12 text-xs font-medium text-muted-foreground">
          {player.position || ""}
        </div>
        <div className="flex-1 font-medium text-sm">{player.name}</div>
        {player.observation_id && player.rating && (
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${
            player.rating >= 8 ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
            player.rating >= 6 ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' :
            'bg-red-500/20 text-red-700 dark:text-red-300'
          }`}>
            {player.rating.toFixed(1)}
          </div>
        )}
        {player.observation_id && !player.rating && (
          <Star className="h-4 w-4 text-primary fill-primary" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            handleDeletePlayer(player.id);
          }}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    );
  };

  const renderTeamColumn = (teamName: string, players: MatchPlayer[], teamType: "home" | "away") => {
    const starters = players.filter(p => p.is_starter);
    const subs = players.filter(p => !p.is_starter);

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className={teamType === "home" ? "text-primary" : "text-secondary"}>
            {teamName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {players.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No players added yet
            </p>
          ) : (
            <>
              {starters.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Starting XI
                  </h4>
                  <div className="space-y-1">
                    {starters.map((player) => renderPlayerRow(player))}
                  </div>
                </div>
              )}
              {subs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Substitutes
                  </h4>
                  <div className="space-y-1">
                    {subs.map((player) => renderPlayerRow(player))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader 
        title={match.name}
        subtitle={`${match.home_team} vs ${match.away_team}`}
        actions={
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setQuickModeOpen(true)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
              title="Quick Rate Mode"
            >
              <Zap className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={async () => {
                try {
                  toast.loading("Generating PDF...", { id: "pdf-gen" });
                  const matchWithTournament = {
                    ...match,
                    tournament_name: tournament?.name || null,
                  };
                  await generateMatchReportPDF(matchWithTournament, homePlayers, awayPlayers);
                  toast.success("PDF generated successfully", { id: "pdf-gen" });
                } catch (error) {
                  toast.error("Failed to generate PDF", { id: "pdf-gen" });
                }
              }}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <FileDown className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/matches/${matchId}/edit`)} className="text-primary-foreground hover:bg-primary-foreground/10">
              <Edit className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      <main className="container mx-auto px-4 py-6 pb-24 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Match Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs">Date</p>
                <p className="font-medium">{new Date(match.date).toLocaleDateString()}</p>
              </div>
              {match.kickoff_time && (
                <div>
                  <p className="text-muted-foreground text-xs">Kickoff</p>
                  <p className="font-medium">{match.kickoff_time}</p>
                </div>
              )}
              {match.location && (
                <div>
                  <p className="text-muted-foreground text-xs">Location</p>
                  <p className="font-medium">{match.location}</p>
                </div>
              )}
              {match.weather && (
                <div>
                  <p className="text-muted-foreground text-xs">Weather</p>
                  <p className="font-medium">{match.weather}</p>
                </div>
              )}
              {tournament && (
                <div>
                  <p className="text-muted-foreground text-xs">Tournament</p>
                  <button 
                    onClick={() => navigate(`/tournaments/${tournament.id}`)}
                    className="font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Trophy className="h-3 w-3" />
                    {tournament.name}
                  </button>
                </div>
              )}
            </div>
            {match.notes && (
              <div className="pt-2">
                <p className="text-muted-foreground text-xs">Notes</p>
                <p className="whitespace-pre-wrap">{match.notes}</p>
              </div>
            )}
            {match.match_video_link && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(match.match_video_link!, "_blank")}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Watch Match Recording
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice Notes Section */}
        <Card>
          <CardContent className="pt-6">
            <VoiceNotesSection matchId={matchId} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Match Sheet</h2>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="position">By Position</SelectItem>
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

        <div className="grid md:grid-cols-2 gap-4">
          {renderTeamColumn(match.home_team, homePlayers, "home")}
          {renderTeamColumn(match.away_team, awayPlayers, "away")}
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
            <div className="space-y-2">
              <Label>Player Type</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={playerForm.isStarter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlayerForm({ ...playerForm, isStarter: true })}
                >
                  Starting XI
                </Button>
                <Button
                  type="button"
                  variant={!playerForm.isStarter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlayerForm({ ...playerForm, isStarter: false })}
                >
                  Substitute
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={playerForm.position}
                onValueChange={(value) =>
                  setPlayerForm({ ...playerForm, position: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GK">GK - Goalkeeper</SelectItem>
                  <SelectItem value="CB">CB - Center Back</SelectItem>
                  <SelectItem value="LB">LB - Left Back</SelectItem>
                  <SelectItem value="RB">RB - Right Back</SelectItem>
                  <SelectItem value="LWB">LWB - Left Wing Back</SelectItem>
                  <SelectItem value="RWB">RWB - Right Wing Back</SelectItem>
                  <SelectItem value="CDM">CDM - Defensive Mid</SelectItem>
                  <SelectItem value="CM">CM - Central Mid</SelectItem>
                  <SelectItem value="CAM">CAM - Attacking Mid</SelectItem>
                  <SelectItem value="LW">LW - Left Wing</SelectItem>
                  <SelectItem value="RW">RW - Right Wing</SelectItem>
                  <SelectItem value="CF">CF - Center Forward</SelectItem>
                  <SelectItem value="ST">ST - Striker</SelectItem>
                </SelectContent>
              </Select>
            </div>
              <div className="space-y-2">
                <Label htmlFor="shirtNumber">Number (1-99)</Label>
                <Input
                  id="shirtNumber"
                  type="number"
                  min="1"
                  max="99"
                  value={playerForm.shirtNumber}
                  onChange={(e) => {
                    setPlayerForm({ ...playerForm, shirtNumber: e.target.value });
                    setShirtNumberError("");
                  }}
                  placeholder="e.g., 10"
                />
                {shirtNumberError && (
                  <p className="text-sm text-destructive">{shirtNumberError}</p>
                )}
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

      {/* Quick Rate Mode */}
      {quickModeOpen && (
        <QuickRateMode
          matchId={matchId!}
          matchDate={match.date}
          matchName={match.name}
          players={[...homePlayers, ...awayPlayers]}
          onClose={() => setQuickModeOpen(false)}
          onSave={fetchMatchData}
        />
      )}
    </div>
  );
};

export default MatchDetails;

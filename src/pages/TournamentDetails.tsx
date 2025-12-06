import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Users,
  Calendar,
  MapPin,
  FileDown,
  Trophy,
  Star,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tournament {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
}

interface TournamentPlayer {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  nationality: string | null;
  shirt_number: string | null;
  rating: number | null;
  observation_count: number | null;
  average_rating: number | null;
  notes: string | null;
}

interface TournamentMatch {
  id: string;
  name: string;
  home_team: string | null;
  away_team: string | null;
  match_date: string;
  notes: string | null;
}

interface LinkedMatch {
  id: string;
  name: string;
  home_team: string;
  away_team: string;
  date: string;
}

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [sortBy, setSortBy] = useState<string>("observation_count_desc");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: tournament, isLoading: tournamentLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ["tournament-players", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_players")
        .select("*")
        .eq("tournament_id", id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!id,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["tournament-matches", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", id)
        .order("match_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!id,
  });

  // Also fetch linked matches from the main matches table
  const { data: linkedMatches = [], isLoading: linkedMatchesLoading } = useQuery({
    queryKey: ["tournament-linked-matches", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, name, home_team, away_team, date")
        .eq("tournament_id", id)
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!id,
  });

  const sortedPlayers = [...players].sort((a, b) => {
    switch (sortBy) {
      case "observation_count_desc":
        return (b.observation_count || 0) - (a.observation_count || 0);
      case "observation_count_asc":
        return (a.observation_count || 0) - (b.observation_count || 0);
      case "average_rating_desc":
        return (b.average_rating || 0) - (a.average_rating || 0);
      case "average_rating_asc":
        return (a.average_rating || 0) - (b.average_rating || 0);
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  const handleExportPDF = async () => {
    if (!tournament) return;
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: {
          type: "tournament",
          tournamentId: id,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Tournament report generated");
      }
    } catch (error: any) {
      toast.error("Failed to generate report");
    }
  };

  if (tournamentLoading || !tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading tournament...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader 
        title={tournament.name}
        actions={
          <Button variant="ghost" size="icon" onClick={handleExportPDF} className="text-primary-foreground hover:bg-primary-foreground/10">
            <FileDown className="h-5 w-5" />
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-6 pb-24">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tournament Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tournament.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{tournament.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(tournament.start_date), "MMM d")} -{" "}
                {format(new Date(tournament.end_date), "MMM d, yyyy")}
              </span>
            </div>
            {tournament.notes && (
              <p className="text-sm text-muted-foreground italic">{tournament.notes}</p>
            )}
          </CardContent>
        </Card>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Matches</h2>
            <Button
              onClick={() => navigate(`/tournaments/${id}/matches/new`)}
              size="sm"
              className="rounded-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Match
            </Button>
          </div>

          {matchesLoading || linkedMatchesLoading ? (
            <p className="text-muted-foreground text-sm">Loading matches...</p>
          ) : matches.length === 0 && linkedMatches.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground">No matches yet. Add your first match!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {/* Show linked matches from main matches table */}
              {linkedMatches.map((match) => (
                <Card
                  key={match.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/matches/${match.id}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{match.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {match.home_team} vs {match.away_team}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(match.date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* Show tournament-specific matches */}
              {matches.map((match) => (
                <Card
                  key={match.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/tournaments/${id}/matches/${match.id}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{match.name}</h3>
                        {(match.home_team || match.away_team) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {match.home_team} vs {match.away_team}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(match.match_date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Players Tracked</h2>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="observation_count_desc">Most Observations</SelectItem>
                  <SelectItem value="observation_count_asc">Least Observations</SelectItem>
                  <SelectItem value="average_rating_desc">Highest Rating</SelectItem>
                  <SelectItem value="average_rating_asc">Lowest Rating</SelectItem>
                  <SelectItem value="name_asc">Name A-Z</SelectItem>
                  <SelectItem value="name_desc">Name Z-A</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => navigate(`/tournaments/${id}/players/new`)}
                size="sm"
                className="rounded-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>
          </div>

          {playersLoading ? (
            <p className="text-muted-foreground text-sm">Loading players...</p>
          ) : sortedPlayers.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground">No players tracked yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedPlayers.map((player) => (
                <Card key={player.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{player.name}</CardTitle>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {player.position && (
                        <Badge variant="secondary" className="text-xs">
                          {player.position}
                        </Badge>
                      )}
                      {player.shirt_number && (
                        <Badge variant="outline" className="text-xs">
                          #{player.shirt_number}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {player.team && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{player.team}</span>
                      </div>
                    )}
                    <div className="flex gap-4 text-sm">
                      {player.observation_count !== null && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{player.observation_count}</span>
                          <span className="text-muted-foreground">obs</span>
                        </div>
                      )}
                      {player.average_rating !== null && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">
                            {player.average_rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    {player.notes && (
                      <p className="text-sm text-muted-foreground italic line-clamp-2">
                        {player.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TournamentDetails;

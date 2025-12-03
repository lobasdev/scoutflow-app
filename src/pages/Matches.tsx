import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Match {
  id: string;
  name: string;
  date: string;
  location: string | null;
  home_team: string;
  away_team: string;
  tournament_id: string | null;
  created_at: string;
}

interface Tournament {
  id: string;
  name: string;
}

const Matches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date_desc");

  useEffect(() => {
    fetchData();
  }, [sortBy]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [matchesRes, tournamentsRes] = await Promise.all([
        supabase.from("matches").select("*").eq("scout_id", user.id),
        supabase.from("tournaments").select("id, name").eq("scout_id", user.id),
      ]);

      if (matchesRes.error) throw matchesRes.error;

      let sortedMatches = matchesRes.data || [];
      switch (sortBy) {
        case "date_asc":
          sortedMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          break;
        case "date_desc":
          sortedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          break;
        case "name_asc":
          sortedMatches.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "name_desc":
          sortedMatches.sort((a, b) => b.name.localeCompare(a.name));
          break;
      }

      setMatches(sortedMatches);
      setTournaments(tournamentsRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  const getTournamentName = (tournamentId: string | null) => {
    if (!tournamentId) return null;
    const tournament = tournaments.find(t => t.id === tournamentId);
    return tournament?.name;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Matches" />

      <main className="container mx-auto px-4 py-6 pb-32">
        <div className="flex gap-4 mb-6">
          <Button onClick={() => navigate("/matches/new")} className="flex-1" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Match
          </Button>
        </div>

        <div className="mb-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Date (Newest First)</SelectItem>
              <SelectItem value="date_asc">Date (Oldest First)</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading matches...</p>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No matches yet</p>
              <Button onClick={() => navigate("/matches/new")}>Add Your First Match</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const tournamentName = getTournamentName(match.tournament_id);
              return (
                <Card
                  key={match.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/matches/${match.id}`)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">{match.name}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="font-semibold">
                        {match.home_team} vs {match.away_team}
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(match.date).toLocaleDateString()}
                      </div>
                      {match.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {match.location}
                        </div>
                      )}
                      {tournamentName && (
                        <p className="text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-2">
                          🏆 {tournamentName}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Matches;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, User, LogOut, Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { exportPlayersToCSV } from "@/utils/csvExporter";

import { formatEstimatedValue } from "@/utils/valueFormatter";

interface Player {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  recommendation: string | null;
  nationality: string | null;
  estimated_value: string | null;
  estimated_value_numeric: number | null;
  football_data_id: number | null;
  appearances: number | null;
  minutes_played: number | null;
  goals: number | null;
  assists: number | null;
  foot: string | null;
  profile_summary: string | null;
  height: number | null;
  weight: number | null;
  tags: string[] | null;
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

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [ageFilter, setAgeFilter] = useState<string>("");
  const [recommendationFilter, setRecommendationFilter] = useState<string>("");
  const [minValueFilter, setMinValueFilter] = useState<string>("");
  const [maxValueFilter, setMaxValueFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPlayers();
  }, [user, navigate]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch players");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredPlayers = players.filter(player => {
    if (positionFilter && player.position !== positionFilter) return false;
    if (ageFilter && player.date_of_birth) {
      const age = calculateAge(player.date_of_birth);
      if (ageFilter === "young" && age >= 23) return false;
      if (ageFilter === "prime" && (age < 23 || age > 30)) return false;
      if (ageFilter === "experienced" && age <= 30) return false;
    }
    if (recommendationFilter && player.recommendation !== recommendationFilter) return false;
    
    // Estimated value filtering
    if (minValueFilter || maxValueFilter) {
      const playerValue = player.estimated_value_numeric || 0;
      const minVal = minValueFilter ? parseFloat(minValueFilter) * 1000000 : 0;
      const maxVal = maxValueFilter ? parseFloat(maxValueFilter) * 1000000 : Infinity;
      if (playerValue < minVal || playerValue > maxVal) return false;
    }
    
    // Tag filtering
    if (tagFilter && (!player.tags || !player.tags.includes(tagFilter))) return false;
    
    return true;
  });

  const positions = Array.from(new Set(players.map(p => p.position).filter(Boolean)));
  const recommendations = Array.from(new Set(players.map(p => p.recommendation).filter(Boolean)));
  const allTags = Array.from(new Set(players.flatMap(p => p.tags || []).filter(Boolean)));

  const handleExportCSV = () => {
    if (filteredPlayers.length === 0) {
      toast.error("No players to export");
      return;
    }
    exportPlayersToCSV(filteredPlayers);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">My Players</h2>
            <Button 
              onClick={() => navigate("/player/new")} 
              size="default"
              className="rounded-full"
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Add Player</span>
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant="outline" 
              size="default"
              className="rounded-full flex-1 sm:flex-none"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Filters'}
            </Button>
            <Button 
              onClick={handleExportCSV} 
              variant="secondary" 
              size="default"
              className="rounded-full flex-1 sm:flex-none"
              disabled={filteredPlayers.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Position</label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Positions</option>
              {positions.map(pos => (
                <option key={pos} value={pos || ""}>{pos}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Age Group</label>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Ages</option>
              <option value="young">Young (&lt;23)</option>
              <option value="prime">Prime (23-30)</option>
              <option value="experienced">Experienced (&gt;30)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Recommendation</label>
            <select
              value={recommendationFilter}
              onChange={(e) => setRecommendationFilter(e.target.value)}
              className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Recommendations</option>
              {recommendations.map(rec => (
                <option key={rec} value={rec || ""}>{rec}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Min Value (€M)</label>
            <input
              type="number"
              value={minValueFilter}
              onChange={(e) => setMinValueFilter(e.target.value)}
              placeholder="0"
              step="0.1"
              className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Max Value (€M)</label>
            <input
              type="number"
              value={maxValueFilter}
              onChange={(e) => setMaxValueFilter(e.target.value)}
              placeholder="∞"
              step="0.1"
              className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tag</label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading players...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No players yet. Add your first player to start scouting!</p>
            <Button onClick={() => navigate("/player/new")}>
              <Plus className="h-5 w-5 mr-2" />
              Add Player
            </Button>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No players match your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlayers.map((player) => (
              <Card 
                key={player.id} 
                className="cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-border/50 hover:border-primary/50" 
                onClick={() => navigate(`/player/${player.id}`)}
              >
                {player.photo_url && (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={player.photo_url} 
                      alt={player.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent"></div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{player.name}</span>
                    {player.recommendation && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: 
                              player.recommendation === "Sign" ? "#10b981" :
                              player.recommendation === "Observe more" ? "#f59e0b" :
                              player.recommendation === "Not sign" ? "#ef4444" :
                              player.recommendation === "Invite for trial" ? "#3b82f6" :
                              "#8b5cf6"
                          }}
                          title={`Recommendation: ${player.recommendation}`}
                        />
                        <span className="text-xs text-muted-foreground">{player.recommendation}</span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {player.date_of_birth && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-medium">{calculateAge(player.date_of_birth)}</span>
                      </div>
                    )}
                    {player.position && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Position:</span>
                        <span className="font-medium">{player.position}</span>
                      </div>
                    )}
                    {player.team && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Team:</span>
                        <span className="font-medium">{player.team}</span>
                      </div>
                    )}
                     {player.estimated_value_numeric && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Value:</span>
                        <Badge variant="secondary" className="font-bold">
                          {formatEstimatedValue(player.estimated_value_numeric)}
                        </Badge>
                      </div>
                    )}
                    {player.tags && player.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {player.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {player.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{player.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

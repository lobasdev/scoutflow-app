import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Filter, ListPlus, Search, X, ArrowUpDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { exportPlayersToCSV } from "@/utils/csvExporter";
import { formatEstimatedValue } from "@/utils/valueFormatter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface Shortlist {
  id: string;
  name: string;
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
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [ageFilter, setAgeFilter] = useState<string>("");
  const [recommendationFilter, setRecommendationFilter] = useState<string>("");
  const [minValueFilter, setMinValueFilter] = useState<string>("");
  const [maxValueFilter, setMaxValueFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [shortlistDialogOpen, setShortlistDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [sortBy, setSortBy] = useState<string>("newest");
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Parse URL params for recommendation filter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const recFilter = searchParams.get("recommendation");
    if (recFilter) {
      // Map URL param to actual recommendation values
      const filterMap: Record<string, string> = {
        "sign": "Sign",
        "observe-more": "Observe more",
        "invite-for-trial": "Invite for trial",
        "not-sign": "Not sign",
      };
      setRecommendationFilter(filterMap[recFilter] || "");
      setShowFilters(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Reset scroll to top when returning to this page
  useEffect(() => {
    // Scroll to top whenever component mounts or location changes
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Also scroll the container if it exists
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const { data: players = [], isLoading: loading } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Real-time updates for players
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["players"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const { data: playerShortlists = {} } = useQuery({
    queryKey: ["player-shortlists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_shortlists")
        .select("player_id, shortlist_id");
      
      if (error) throw error;
      
      const associations: Record<string, Set<string>> = {};
      data?.forEach(item => {
        if (!associations[item.player_id]) {
          associations[item.player_id] = new Set();
        }
        associations[item.player_id].add(item.shortlist_id);
      });
      return associations;
    },
    enabled: !!user && players.length > 0,
  });

  const { data: shortlists = [] } = useQuery({
    queryKey: ["shortlists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shortlists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleToggleShortlist = async (shortlistId: string) => {
    if (!selectedPlayerId) return;
    
    const currentShortlists = playerShortlists[selectedPlayerId] || new Set();
    const isInShortlist = currentShortlists.has(shortlistId);

    try {
      if (isInShortlist) {
        const { error } = await supabase
          .from("player_shortlists")
          .delete()
          .eq("player_id", selectedPlayerId)
          .eq("shortlist_id", shortlistId);

        if (error) throw error;
        toast.success("Removed from shortlist");
      } else {
        const { error } = await supabase
          .from("player_shortlists")
          .insert({
            player_id: selectedPlayerId,
            shortlist_id: shortlistId,
          });

        if (error) throw error;
        toast.success("Added to shortlist");
      }

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["player-shortlists"] });
    } catch (error: any) {
      toast.error("Failed to update shortlist");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop === 0) {
      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStartY.current;
      
      if (distance > 0 && distance < 150) {
        setPullDistance(distance);
        if (distance > 80) {
          setIsPulling(true);
        }
      }
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (isPulling) {
      // Refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["players"] }),
        queryClient.invalidateQueries({ queryKey: ["player-shortlists"] }),
        queryClient.invalidateQueries({ queryKey: ["shortlists"] }),
        queryClient.invalidateQueries({ queryKey: ["shortlist-counts"] })
      ]);
      toast.success("Players refreshed");
    }
    setPullDistance(0);
    setIsPulling(false);
    touchStartY.current = 0;
  }, [isPulling, queryClient]);

  const filteredPlayers = players.filter(player => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        player.name.toLowerCase().includes(query) ||
        (player.team && player.team.toLowerCase().includes(query)) ||
        (player.position && player.position.toLowerCase().includes(query)) ||
        (player.nationality && player.nationality.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
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

  // Sort filtered players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "age-young":
        if (!a.date_of_birth) return 1;
        if (!b.date_of_birth) return -1;
        return calculateAge(b.date_of_birth) - calculateAge(a.date_of_birth);
      case "age-old":
        if (!a.date_of_birth) return 1;
        if (!b.date_of_birth) return -1;
        return calculateAge(a.date_of_birth) - calculateAge(b.date_of_birth);
      case "value-high":
        return (b.estimated_value_numeric || 0) - (a.estimated_value_numeric || 0);
      case "value-low":
        return (a.estimated_value_numeric || 0) - (b.estimated_value_numeric || 0);
      default:
        return 0;
    }
  });

  const positions = Array.from(new Set(players.map(p => p.position).filter(Boolean)));
  const recommendations = Array.from(new Set(players.map(p => p.recommendation).filter(Boolean)));
  const allTags = Array.from(new Set(players.flatMap(p => p.tags || []).filter(Boolean)));

  const handleExportCSV = () => {
    if (sortedPlayers.length === 0) {
      toast.error("No players to export");
      return;
    }
    exportPlayersToCSV(sortedPlayers);
    toast.success("CSV exported successfully");
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <PageHeader title="My Players" showBackButton={false} />

      <main 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to refresh indicator */}
        {pullDistance > 0 && (
          <div 
            className="flex items-center justify-center py-4 text-muted-foreground transition-transform"
            style={{ transform: `translateY(${Math.min(pullDistance, 80)}px)` }}
          >
            {isPulling ? "Release to refresh..." : "Pull to refresh..."}
          </div>
        )}
        
        <div className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">My Players</h2>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSearch(!showSearch)}
              >
                {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </Button>
              <Button 
                onClick={() => navigate("/player/new")} 
                size="default"
                className="rounded-full"
              >
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Add Player</span>
              </Button>
            </div>
          </div>
          
          {showSearch && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Input
                placeholder="Search by name, team, position, or nationality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          )}
          
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="default"
                  className="rounded-full flex-1 sm:flex-none"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name-asc")}>
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name-desc")}>
                  Name (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("age-young")}>
                  Age (Youngest)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("age-old")}>
                  Age (Oldest)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("value-high")}>
                  Value (Highest)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("value-low")}>
                  Value (Lowest)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              onClick={handleExportCSV} 
              variant="secondary" 
              size="default"
              className="rounded-full flex-1 sm:flex-none"
              disabled={sortedPlayers.length === 0}
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
        ) : sortedPlayers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No players match your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedPlayers.map((player) => (
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlayerId(player.id);
                          setShortlistDialogOpen(true);
                        }}
                      >
                        <ListPlus className="h-4 w-4" />
                      </Button>
                      {player.recommendation && (
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
                      )}
                    </div>
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
        </div>
      </main>

      <Dialog open={shortlistDialogOpen} onOpenChange={setShortlistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Shortlist</DialogTitle>
            <DialogDescription>
              Select shortlists to add this player to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {shortlists.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shortlists yet. Create one first!</p>
            ) : (
              shortlists.map((shortlist) => (
                <div key={shortlist.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                  <Checkbox
                    id={shortlist.id}
                    checked={selectedPlayerId ? (playerShortlists[selectedPlayerId]?.has(shortlist.id) || false) : false}
                    onCheckedChange={() => handleToggleShortlist(shortlist.id)}
                  />
                  <label
                    htmlFor={shortlist.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {shortlist.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;

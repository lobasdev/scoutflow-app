import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowRight, Plus, Users, TrendingUp, Clock, FileText } from "lucide-react";

const TeamsOverview = () => {
  const navigate = useNavigate();

  // Fetch teams count
  const { data: teamsCount = 0 } = useQuery({
    queryKey: ["teams-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("teams")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch linked players count (players with team_id)
  const { data: linkedPlayersCount = 0 } = useQuery({
    queryKey: ["linked-players-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("players")
        .select("id", { count: "exact", head: true })
        .not("team_id", "is", null);
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch recently updated teams (last 7 days)
  const { data: recentlyUpdatedCount = 0 } = useQuery({
    queryKey: ["recently-updated-teams"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count, error } = await supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .gte("updated_at", sevenDaysAgo.toISOString());
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch teams with recommendations
  const { data: teamsWithRecommendations = 0 } = useQuery({
    queryKey: ["teams-with-recommendations"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .not("recommendation", "is", null)
        .neq("recommendation", "");
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch latest team activity
  const { data: latestTeam } = useQuery({
    queryKey: ["latest-team"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (teamsCount === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Teams Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              No teams added yet
            </p>
            <Button size="sm" onClick={() => navigate("/teams/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Teams Activity
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            onClick={() => navigate("/teams")}
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Teams</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{teamsCount}</p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-lg p-3 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Linked Players</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{linkedPlayersCount}</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-lg p-3 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Updated (7d)</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{recentlyUpdatedCount}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-3 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">With Reports</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{teamsWithRecommendations}</p>
          </div>
        </div>

        {/* Latest Activity */}
        {latestTeam && (
          <div 
            onClick={() => navigate(`/teams/${latestTeam.id}`)}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Latest: {latestTeam.name}</p>
                <p className="text-xs text-muted-foreground">{getTimeAgo(latestTeam.updated_at)}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamsOverview;

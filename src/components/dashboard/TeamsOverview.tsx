import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowRight, Plus, Trophy } from "lucide-react";

const TeamsOverview = () => {
  const navigate = useNavigate();

  const { data: teams = [] } = useQuery({
    queryKey: ["teams-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, logo_url, league, wins, draws, losses, country")
        .order("updated_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

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

  if (teams.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Teams
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
            Teams
            <Badge variant="secondary" className="ml-2">
              {teamsCount}
            </Badge>
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
      <CardContent className="space-y-2">
        {teams.map((team) => (
          <div
            key={team.id}
            onClick={() => navigate(`/teams/${team.id}`)}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={team.logo_url || undefined} alt={team.name} />
                <AvatarFallback className="text-xs">
                  {team.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{team.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {team.league && (
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {team.league}
                    </span>
                  )}
                  {team.country && !team.league && <span>{team.country}</span>}
                </div>
              </div>
            </div>
            {(team.wins != null || team.draws != null || team.losses != null) && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-emerald-500">{team.wins || 0}W</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-amber-500">{team.draws || 0}D</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-red-500">{team.losses || 0}L</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TeamsOverview;

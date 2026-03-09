import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeam, useTeamPlan } from "@/hooks/useTeam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersRound, User, Calendar, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface TeamObservation {
  id: string;
  date: string;
  scout_id: string;
  created_at: string;
  team_player_id: string;
  notes: string | null;
}

const TeamActivityWidget = () => {
  const navigate = useNavigate();
  const isTeamPlan = useTeamPlan();
  const { team, members } = useTeam();

  // Fetch recent team observations
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["team-recent-activity", team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      
      // Get team player IDs first
      const { data: teamPlayers } = await supabase
        .from("team_players")
        .select("id, name")
        .eq("team_id", team.id);
      
      if (!teamPlayers?.length) return [];
      
      const { data, error } = await supabase
        .from("team_observations")
        .select("*")
        .in("team_player_id", teamPlayers.map(p => p.id))
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) return [];
      
      // Attach player names
      return data.map((obs: TeamObservation) => ({
        ...obs,
        playerName: teamPlayers.find(p => p.id === obs.team_player_id)?.name || "Player",
      }));
    },
    enabled: !!team?.id && isTeamPlan,
    staleTime: 1000 * 60 * 2,
  });

  // Fetch scout profiles
  const scoutIds = [...new Set(recentActivity.map((a: any) => a.scout_id))];
  const { data: scoutProfiles = [] } = useQuery({
    queryKey: ["activity-scouts", scoutIds],
    queryFn: async () => {
      if (scoutIds.length === 0) return [];
      const { data } = await supabase
        .from("scouts")
        .select("id, name")
        .in("id", scoutIds);
      return data || [];
    },
    enabled: scoutIds.length > 0,
  });

  if (!isTeamPlan || !team) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-emerald-500" />
          Team Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent team activity. Start by adding observations to shared players.
          </p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity: any) => {
              const scout = scoutProfiles.find((s: any) => s.id === activity.scout_id);
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/team/players/${activity.team_player_id}`)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{scout?.name || "Scout"}</span>
                      <span className="text-muted-foreground"> observed </span>
                      <span className="font-medium">{activity.playerName}</span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamActivityWidget;

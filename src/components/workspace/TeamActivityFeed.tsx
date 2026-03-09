import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Star, MessageSquare, UserPlus, ClipboardList } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "observation" | "rating" | "feedback" | "player_added" | "assignment";
  description: string;
  scout_name: string;
  created_at: string;
}

interface TeamActivityFeedProps {
  teamId: string;
  memberIds: string[];
  scoutProfiles: { id: string; name: string }[];
}

const iconMap = {
  observation: Eye,
  rating: Star,
  feedback: MessageSquare,
  player_added: UserPlus,
  assignment: ClipboardList,
};

const colorMap = {
  observation: "text-blue-500",
  rating: "text-amber-500",
  feedback: "text-purple-500",
  player_added: "text-green-500",
  assignment: "text-emerald-500",
};

const TeamActivityFeed = ({ teamId, memberIds, scoutProfiles }: TeamActivityFeedProps) => {
  const getScoutName = (id: string) => scoutProfiles.find(s => s.id === id)?.name || "Scout";

  // Fetch recent team observations
  const { data: recentObservations = [] } = useQuery({
    queryKey: ["team-activity-observations", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_observations")
        .select("id, scout_id, date, created_at, team_player_id, team_players(name)")
        .order("created_at", { ascending: false })
        .limit(10);
      return (data || []).map((o: any) => ({
        id: `obs-${o.id}`,
        type: "observation" as const,
        description: `Observed ${o.team_players?.name || "a player"}`,
        scout_name: getScoutName(o.scout_id),
        created_at: o.created_at,
      }));
    },
    enabled: !!teamId,
  });

  // Fetch recently added players
  const { data: recentPlayers = [] } = useQuery({
    queryKey: ["team-activity-players", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_players")
        .select("id, name, created_by, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data || []).map((p: any) => ({
        id: `player-${p.id}`,
        type: "player_added" as const,
        description: `Added ${p.name} to shared pool`,
        scout_name: getScoutName(p.created_by),
        created_at: p.created_at,
      }));
    },
    enabled: !!teamId,
  });

  // Fetch recent assignment updates
  const { data: recentAssignments = [] } = useQuery({
    queryKey: ["team-activity-assignments", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("scouting_assignments")
        .select("id, title, assigned_to, status, updated_at")
        .eq("team_id", teamId)
        .order("updated_at", { ascending: false })
        .limit(10);
      return (data || []).map((a: any) => ({
        id: `assign-${a.id}`,
        type: "assignment" as const,
        description: `${a.status === "submitted" ? "Submitted" : a.status === "reviewed" ? "Reviewed" : "Updated"}: ${a.title}`,
        scout_name: getScoutName(a.assigned_to),
        created_at: a.updated_at,
      }));
    },
    enabled: !!teamId,
  });

  // Merge and sort all activities
  const allActivity: ActivityItem[] = [
    ...recentObservations,
    ...recentPlayers,
    ...recentAssignments,
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15);

  if (allActivity.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No team activity yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {allActivity.map((item) => {
          const Icon = iconMap[item.type];
          return (
            <div key={item.id} className="flex items-start gap-3 py-2">
              <div className={`mt-0.5 ${colorMap[item.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{item.scout_name}</span>{" "}
                  <span className="text-muted-foreground">{item.description}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TeamActivityFeed;

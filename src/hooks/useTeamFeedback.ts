import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";

export function useUnreadFeedbackCount() {
  const { user } = useAuth();
  const { team } = useTeam();

  const { data: count = 0 } = useQuery({
    queryKey: ["unread-feedback-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("chief_scout_feedback" as any)
        .select("*", { count: "exact", head: true })
        .eq("target_scout_id", user.id)
        .eq("is_read", false);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user && !!team,
    refetchInterval: 30000, // Poll every 30s
  });

  return count;
}

export function useTeamActivityLog() {
  const { team } = useTeam();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["team-activity-log", team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      const { data, error } = await supabase
        .from("team_activity_log" as any)
        .select("*")
        .eq("team_id", team.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return [];
      return (data as any[]) || [];
    },
    enabled: !!team?.id,
  });

  return { activities, isLoading };
}

export async function logTeamActivity(
  teamId: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId?: string,
  entityName?: string,
  metadata?: Record<string, any>
) {
  await supabase.from("team_activity_log" as any).insert({
    team_id: teamId,
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    entity_name: entityName || null,
    metadata: metadata || {},
  } as any);
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

export type TeamRole = "chief_scout" | "scout";

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  status: string;
  joined_at: string;
  invited_by: string | null;
}

interface ScoutingTeam {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface UseTeamReturn {
  team: ScoutingTeam | null;
  membership: TeamMember | null;
  members: TeamMember[];
  role: TeamRole | null;
  isChiefScout: boolean;
  isLoading: boolean;
  refetch: () => void;
}

export function useTeam(): UseTeamReturn {
  const { user } = useAuth();

  const { data: membership, isLoading: memberLoading, refetch } = useQuery({
    queryKey: ["team-membership", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) { console.error("Error fetching team membership:", error); return null; }
      return data as TeamMember | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const teamId = membership?.team_id;

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["scouting-team", teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const { data, error } = await supabase
        .from("scouting_teams")
        .select("*")
        .eq("id", teamId)
        .maybeSingle();
      if (error) { console.error("Error fetching team:", error); return null; }
      return data as ScoutingTeam | null;
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId)
        .eq("status", "active");
      if (error) { console.error("Error fetching members:", error); return []; }
      return data as TeamMember[];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });

  const role = membership?.role as TeamRole | null;

  return {
    team,
    membership,
    members,
    role,
    isChiefScout: role === "chief_scout",
    isLoading: memberLoading || teamLoading || membersLoading,
    refetch,
  };
}

export function useTeamPlan(): boolean {
  const { subscription } = useSubscription();
  // plan_type is on the subscription row but not yet in the generated types
  // We cast to access it safely
  const sub = subscription as any;
  return sub?.plan_type === "team";
}

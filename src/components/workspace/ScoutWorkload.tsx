import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Crown, Shield } from "lucide-react";
import type { ScoutingAssignment } from "@/hooks/useAssignments";

interface ScoutProfile {
  id: string;
  name: string;
  email: string;
}

interface ScoutWorkloadProps {
  teamId: string;
  members: { user_id: string; role: string }[];
  scoutProfiles: ScoutProfile[];
  assignments: ScoutingAssignment[];
}

const ScoutWorkload = ({ teamId, members, scoutProfiles, assignments }: ScoutWorkloadProps) => {
  // Observation counts per scout
  const { data: observationCounts = {} } = useQuery({
    queryKey: ["scout-observation-counts", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_observations")
        .select("scout_id");
      
      const counts: Record<string, number> = {};
      (data || []).forEach((o: any) => {
        counts[o.scout_id] = (counts[o.scout_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!teamId,
  });

  const scoutStats = members.map((m) => {
    const profile = scoutProfiles.find(s => s.id === m.user_id);
    const memberAssignments = assignments.filter(a => a.assigned_to === m.user_id);
    const total = memberAssignments.length;
    const completed = memberAssignments.filter(a => a.status === "reviewed" || a.status === "submitted").length;
    const inProgress = memberAssignments.filter(a => a.status === "in_progress").length;
    const pending = memberAssignments.filter(a => a.status === "assigned").length;
    const observations = observationCounts[m.user_id] || 0;

    return {
      userId: m.user_id,
      name: profile?.name || "Scout",
      role: m.role,
      total,
      completed,
      inProgress,
      pending,
      observations,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Scout Workload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {scoutStats.map((scout) => (
          <div key={scout.userId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  {scout.role === "chief_scout" ? (
                    <Crown className="h-3 w-3 text-primary" />
                  ) : (
                    <Shield className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <span className="text-sm font-medium">{scout.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {scout.observations} obs
              </span>
            </div>

            {scout.total > 0 ? (
              <>
                <Progress value={scout.completionRate} className="h-2" />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{scout.pending > 0 ? `${scout.pending} pending` : ""}</span>
                  <span>{scout.inProgress > 0 ? `${scout.inProgress} active` : ""}</span>
                  <span>{scout.completed}/{scout.total} done</span>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground">No assignments</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ScoutWorkload;

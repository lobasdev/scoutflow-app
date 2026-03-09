import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { useAssignments } from "@/hooks/useAssignments";
import PageHeader from "@/components/PageHeader";
import CreateAssignmentDialog from "@/components/assignments/CreateAssignmentDialog";
import AssignmentCard from "@/components/assignments/AssignmentCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, Inbox } from "lucide-react";

const TeamAssignments = () => {
  const { user } = useAuth();
  const { team, members, isChiefScout, isLoading: teamLoading } = useTeam();
  const { assignments, myAssignments, isLoading, createAssignment, updateStatus, addFeedback, deleteAssignment } = useAssignments();
  const [createOpen, setCreateOpen] = useState(false);

  // Fetch scout profiles for display names
  const { data: scoutProfiles = [] } = useQuery({
    queryKey: ["assignment-scouts", members.map(m => m.user_id)],
    queryFn: async () => {
      if (members.length === 0) return [];
      const { data } = await supabase
        .from("scouts")
        .select("id, name, email")
        .in("id", members.map(m => m.user_id));
      return data || [];
    },
    enabled: members.length > 0,
  });

  // Fetch team players for linking (from players table with visibility='team')
  const { data: teamPlayers = [] } = useQuery({
    queryKey: ["assignment-team-players", team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      const { data } = await supabase
        .from("players")
        .select("id, name, position, team")
        .eq("visibility", "team")
        .eq("scouting_team_id", team.id)
        .order("name");
      return data || [];
    },
    enabled: !!team?.id,
  });

  const getScoutName = (userId: string) => scoutProfiles.find(s => s.id === userId)?.name || "Scout";
  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return undefined;
    return teamPlayers.find(p => p.id === playerId)?.name;
  };

  const memberOptions = members.map(m => ({
    user_id: m.user_id,
    name: scoutProfiles.find(s => s.id === m.user_id)?.name || "Scout",
    email: scoutProfiles.find(s => s.id === m.user_id)?.email || "",
  }));

  // Group assignments by status for the board view
  const statusOrder = ["assigned", "in_progress", "submitted", "reviewed"];
  const pendingCount = myAssignments.filter(a => a.status !== "reviewed").length;
  const submittedCount = assignments.filter(a => a.status === "submitted").length;

  if (teamLoading || !team) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Assignments" />
        <main className="px-4 py-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Assignments"
        actions={
          isChiefScout ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCreateOpen(true)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Plus className="h-5 w-5" />
            </Button>
          ) : undefined
        }
      />

      <main className="px-4 py-6 space-y-4">
        <Tabs defaultValue={isChiefScout ? "all" : "mine"}>
          <TabsList className="w-full">
            <TabsTrigger value="mine" className="flex-1 gap-1.5">
              <Inbox className="h-3.5 w-3.5" />
              My Tasks
              {pendingCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-[20px] text-[10px] px-1">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              All
              {isChiefScout && submittedCount > 0 && (
                <Badge variant="secondary" className="h-5 min-w-[20px] text-[10px] px-1 bg-purple-500/10 text-purple-700">
                  {submittedCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : myAssignments.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <Inbox className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">No assignments yet</p>
              </div>
            ) : (
              statusOrder.map(status => {
                const filtered = myAssignments.filter(a => a.status === status);
                if (filtered.length === 0) return null;
                return (
                  <div key={status} className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                      {status === "assigned" ? "📋 Assigned" : status === "in_progress" ? "🔄 In Progress" : status === "submitted" ? "📤 Submitted" : "✅ Reviewed"}
                    </h3>
                    {filtered.map(a => (
                      <AssignmentCard
                        key={a.id}
                        assignment={a}
                        scoutName={getScoutName(a.assigned_to)}
                        playerName={getPlayerName(a.team_player_id)}
                        isChiefScout={isChiefScout}
                        isMyAssignment={a.assigned_to === user?.id}
                        onUpdateStatus={(id, s) => updateStatus.mutate({ id, status: s })}
                        onAddFeedback={(id, fb, s) => addFeedback.mutate({ id, feedback: fb, status: s })}
                        onDelete={(id) => deleteAssignment.mutate(id)}
                      />
                    ))}
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <ClipboardList className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">No assignments created yet</p>
                {isChiefScout && (
                  <Button variant="outline" onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Assignment
                  </Button>
                )}
              </div>
            ) : (
              statusOrder.map(status => {
                const filtered = assignments.filter(a => a.status === status);
                if (filtered.length === 0) return null;
                return (
                  <div key={status} className="space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                      {status === "assigned" ? "📋 Assigned" : status === "in_progress" ? "🔄 In Progress" : status === "submitted" ? "📤 Submitted" : "✅ Reviewed"}
                      <span className="ml-1.5 text-muted-foreground/60">({filtered.length})</span>
                    </h3>
                    {filtered.map(a => (
                      <AssignmentCard
                        key={a.id}
                        assignment={a}
                        scoutName={getScoutName(a.assigned_to)}
                        playerName={getPlayerName(a.team_player_id)}
                        isChiefScout={isChiefScout}
                        isMyAssignment={a.assigned_to === user?.id}
                        onUpdateStatus={(id, s) => updateStatus.mutate({ id, status: s })}
                        onAddFeedback={(id, fb, s) => addFeedback.mutate({ id, feedback: fb, status: s })}
                        onDelete={(id) => deleteAssignment.mutate(id)}
                      />
                    ))}
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </main>

      <CreateAssignmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        members={memberOptions}
        players={teamPlayers}
        onSubmit={(data) => {
          createAssignment.mutate(data, { onSuccess: () => setCreateOpen(false) });
        }}
        isPending={createAssignment.isPending}
      />
    </div>
  );
};

export default TeamAssignments;

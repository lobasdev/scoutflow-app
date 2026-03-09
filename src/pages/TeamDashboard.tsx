import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam, useTeamPlan } from "@/hooks/useTeam";
import { useAssignments } from "@/hooks/useAssignments";
import PageHeader from "@/components/PageHeader";
import TeamActivityFeed from "@/components/workspace/TeamActivityFeed";
import ScoutWorkload from "@/components/workspace/ScoutWorkload";
import PlayerCoverage from "@/components/workspace/PlayerCoverage";
import AssignmentStats from "@/components/workspace/AssignmentStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Users, Crown, UserPlus, Trash2, Mail, Copy, Shield, ClipboardList, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const TeamDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isTeamPlan = useTeamPlan();
  const { team, membership, members, isChiefScout, isLoading, refetch } = useTeam();
  const { myAssignments, assignments } = useAssignments();

  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Fetch invites for chief scout
  const { data: invites = [] } = useQuery({
    queryKey: ["team-invites", team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      const { data, error } = await supabase
        .from("team_invites")
        .select("*")
        .eq("team_id", team.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data;
    },
    enabled: !!team?.id && isChiefScout,
  });

  // Fetch scout names for members
  const { data: scoutProfiles = [] } = useQuery({
    queryKey: ["team-scout-profiles", members.map(m => m.user_id)],
    queryFn: async () => {
      if (members.length === 0) return [];
      const { data } = await supabase
        .from("scouts")
        .select("id, name, email, avatar_url")
        .in("id", members.map(m => m.user_id));
      return data || [];
    },
    enabled: members.length > 0,
  });

  // Team player count
  const { data: playerCount = 0 } = useQuery({
    queryKey: ["team-player-count", team?.id],
    queryFn: async () => {
      if (!team?.id) return 0;
      const { count } = await supabase
        .from("team_players")
        .select("*", { count: "exact", head: true })
        .eq("team_id", team.id);
      return count || 0;
    },
    enabled: !!team?.id,
  });

  const handleCreateTeam = async () => {
    if (!user || !teamName.trim()) return;
    setCreating(true);
    try {
      // Create team
      const { data: newTeam, error: teamError } = await supabase
        .from("scouting_teams")
        .insert({ name: teamName.trim(), owner_id: user.id })
        .select()
        .single();
      if (teamError) throw teamError;

      // Add self as chief_scout member
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: newTeam.id,
          user_id: user.id,
          role: "chief_scout",
          status: "active",
        });
      if (memberError) throw memberError;

      queryClient.invalidateQueries({ queryKey: ["team-membership"] });
      queryClient.invalidateQueries({ queryKey: ["scouting-team"] });
      setCreateOpen(false);
      setTeamName("");
      toast.success("Team created!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!team || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { data, error } = await supabase
        .from("team_invites")
        .insert({
          team_id: team.id,
          email: inviteEmail.trim().toLowerCase(),
          role: "scout",
          invited_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Copy invite link
      const inviteUrl = `${window.location.origin}/team/invite/${data.token}`;
      await navigator.clipboard.writeText(inviteUrl);

      queryClient.invalidateQueries({ queryKey: ["team-invites"] });
      setInviteOpen(false);
      setInviteEmail("");
      toast.success("Invite created! Link copied to clipboard.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ status: "removed" })
        .eq("id", memberId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const copyInviteLink = async (token: string) => {
    const url = `${window.location.origin}/team/invite/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  };

  if (!isTeamPlan) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Team Workspace" />
        <main className="px-4 py-12">
          <div className="max-w-md mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Team Plan Required</h2>
            <p className="text-muted-foreground text-sm">
              Team Workspaces are part of the Team Plan. This feature is coming soon!
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Team Workspace" />
        <main className="px-4 py-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // No team yet — show create prompt
  if (!team) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Team Workspace" />
        <main className="px-4 py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Create Your Scouting Team</h2>
            <p className="text-muted-foreground text-sm">
              Set up a workspace to collaborate with other scouts. Invite members, share player profiles, and coordinate scouting tasks.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Create Team
            </Button>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Scouting Team</DialogTitle></DialogHeader>
              <Input
                placeholder="Team name (e.g. Manchester City Scouting)"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <DialogFooter>
                <Button onClick={handleCreateTeam} disabled={!teamName.trim() || creating}>
                  {creating ? "Creating..." : "Create Team"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    );
  }

  // Team exists — show dashboard
  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={team.name}
        actions={
          isChiefScout ? (
            <Button variant="ghost" size="icon" onClick={() => setInviteOpen(true)} className="text-primary-foreground hover:bg-primary-foreground/10">
              <UserPlus className="h-5 w-5" />
            </Button>
          ) : undefined
        }
      />

      <main className="px-4 py-6 space-y-6">
        {/* Assignment Stats (Chief Scout overview) */}
        {isChiefScout && assignments.length > 0 && (
          <AssignmentStats assignments={assignments} />
        )}

        {/* Stats */}
        {!isChiefScout && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{playerCount}</p>
                <p className="text-xs text-muted-foreground">Shared Players</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate("/team/players")}>
            <Users className="h-4 w-4" />
            Shared Players
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate("/team/assignments")}>
            <ClipboardList className="h-4 w-4" />
            Assignments
            {(() => {
              const pending = isChiefScout
                ? assignments.filter(a => a.status === "submitted").length
                : myAssignments.filter(a => a.status !== "reviewed").length;
              return pending > 0 ? (
                <Badge variant="destructive" className="h-5 min-w-[20px] text-[10px] px-1">{pending}</Badge>
              ) : null;
            })()}
          </Button>
        </div>

        {/* Assignment Summary */}
        {myAssignments.filter(a => a.status !== "reviewed").length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                My Active Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myAssignments
                .filter(a => a.status !== "reviewed")
                .slice(0, 3)
                .map(a => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate("/team/assignments")}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      {a.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Due {new Date(a.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {a.status === "assigned" ? "New" : a.status === "in_progress" ? "In Progress" : "Submitted"}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              {myAssignments.filter(a => a.status !== "reviewed").length > 3 && (
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate("/team/assignments")}>
                  View all assignments
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map((member) => {
              const profile = scoutProfiles.find(s => s.id === member.user_id);
              return (
                <div key={member.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {member.role === "chief_scout" ? (
                        <Crown className="h-4 w-4 text-primary" />
                      ) : (
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{profile?.name || "Scout"}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === "chief_scout" ? "default" : "secondary"} className="text-[10px]">
                      {member.role === "chief_scout" ? "Chief" : "Scout"}
                    </Badge>
                    {isChiefScout && member.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Pending Invites */}
        {isChiefScout && invites.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Pending Invites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invites.map((invite: any) => (
                <div key={invite.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyInviteLink(invite.token)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Scout</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Enter the email of the scout you want to invite. They'll receive a link to join your team.
          </p>
          <Input
            placeholder="scout@example.com"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}>
              {inviting ? "Inviting..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamDashboard;

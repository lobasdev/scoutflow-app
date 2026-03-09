import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { useAssignments } from "@/hooks/useAssignments";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, Table2, ChevronRight, MessageSquare, Users, ClipboardList } from "lucide-react";
import { calculateAge } from "@/utils/dateUtils";
import { formatEstimatedValue } from "@/utils/valueFormatter";

const PIPELINE_COLUMNS = [
  { key: "Observe more", label: "Observe More", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  { key: "Invite for trial", label: "Invite for Trial", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  { key: "Sign", label: "Sign", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  { key: "Not sign", label: "Pass", color: "bg-red-500/10 text-red-500 border-red-500/30" },
];

const ChiefScoutOversight = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { team, isChiefScout } = useTeam();
  const { assignments } = useAssignments();
  const [viewMode, setViewMode] = useState<"pipeline" | "table">("pipeline");

  // Fetch team players from players table
  const { data: teamPlayers = [], isLoading } = useQuery({
    queryKey: ["team-players-oversight", team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("visibility", "team")
        .eq("scouting_team_id", team.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!team?.id,
  });

  // Fetch scout profiles for display
  const { data: scoutProfiles = [] } = useQuery({
    queryKey: ["scout-profiles-oversight", team?.id],
    queryFn: async () => {
      const scoutIds = [...new Set(teamPlayers.map(p => p.scout_id))];
      if (scoutIds.length === 0) return [];
      const { data } = await supabase
        .from("scouts")
        .select("id, name, email")
        .in("id", scoutIds);
      return data || [];
    },
    enabled: teamPlayers.length > 0,
  });

  const getScoutName = (scoutId: string) => {
    const scout = scoutProfiles.find(s => s.id === scoutId);
    return scout?.name || "Scout";
  };

  const getAssignmentsForPlayer = (playerId: string) => {
    // Match by name since assignments may reference team_player_id
    return assignments.filter(a => a.team_player_id === playerId);
  };

  // Group players by recommendation for pipeline view
  const playersByRecommendation = PIPELINE_COLUMNS.map(col => ({
    ...col,
    players: teamPlayers.filter(p => p.recommendation === col.key),
  }));

  const unsetPlayers = teamPlayers.filter(p => !p.recommendation || !PIPELINE_COLUMNS.some(c => c.key === p.recommendation));

  if (!isChiefScout) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Oversight" />
        <main className="px-4 py-12 text-center">
          <p className="text-muted-foreground">This page is only available for Chief Scouts.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Player Oversight"
        actions={
          <div className="flex gap-1">
            <Button
              variant={viewMode === "pipeline" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("pipeline")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Table2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <main className="px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : teamPlayers.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No team players yet. Share players from the Players page to get started.</p>
            <Button variant="outline" onClick={() => navigate("/players")}>Go to Players</Button>
          </div>
        ) : viewMode === "pipeline" ? (
          /* Pipeline Board View */
          <div className="space-y-6">
            {/* Unset players */}
            {unsetPlayers.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>No Recommendation</span>
                    <Badge variant="secondary">{unsetPlayers.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unsetPlayers.map(player => (
                    <PipelinePlayerCard
                      key={player.id}
                      player={player}
                      scoutName={getScoutName(player.scout_id)}
                      onClick={() => navigate(`/player/${player.id}`)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {playersByRecommendation.map(col => (
              <Card key={col.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <Badge variant="outline" className={col.color}>{col.label}</Badge>
                    <Badge variant="secondary">{col.players.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {col.players.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No players</p>
                  ) : (
                    col.players.map(player => (
                      <PipelinePlayerCard
                        key={player.id}
                        player={player}
                        scoutName={getScoutName(player.scout_id)}
                        onClick={() => navigate(`/player/${player.id}`)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto -mx-4">
            <div className="min-w-[700px] px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamPlayers.map(player => {
                    const age = player.date_of_birth ? calculateAge(player.date_of_birth) : null;
                    const recConfig = getRecBadge(player.recommendation);
                    return (
                      <TableRow
                        key={player.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/player/${player.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {player.photo_url ? (
                              <img src={player.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>
                            )}
                            {player.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{player.position || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{player.team || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{age || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {player.estimated_value_numeric ? formatEstimatedValue(player.estimated_value_numeric) : "—"}
                        </TableCell>
                        <TableCell>
                          {recConfig ? (
                            <Badge variant="outline" className={recConfig.className}>{recConfig.label}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{getScoutName(player.scout_id)}</TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

function PipelinePlayerCard({ player, scoutName, onClick }: { player: any; scoutName: string; onClick: () => void }) {
  const age = player.date_of_birth ? calculateAge(player.date_of_birth) : null;
  return (
    <div
      className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        {player.photo_url ? (
          <img src={player.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
            {player.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{player.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {player.position && <span>{player.position}</span>}
            {age && <span>• {age} yrs</span>}
            {player.team && <span>• {player.team}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-muted-foreground">{scoutName}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function getRecBadge(recommendation: string | null) {
  switch (recommendation) {
    case "Sign":
      return { label: "Sign", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" };
    case "Observe more":
      return { label: "Observe", className: "bg-amber-500/10 text-amber-500 border-amber-500/30" };
    case "Invite for trial":
      return { label: "Trial", className: "bg-blue-500/10 text-blue-500 border-blue-500/30" };
    case "Not sign":
      return { label: "Pass", className: "bg-red-500/10 text-red-400 border-red-500/30" };
    default:
      return null;
  }
}

export default ChiefScoutOversight;

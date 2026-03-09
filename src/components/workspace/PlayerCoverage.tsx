import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Eye, AlertTriangle } from "lucide-react";

interface PlayerCoverageProps {
  teamId: string;
  scoutProfiles: { id: string; name: string }[];
}

const PlayerCoverage = ({ teamId, scoutProfiles }: PlayerCoverageProps) => {
  const getScoutName = (id: string) => scoutProfiles.find(s => s.id === id)?.name || "Scout";

  // Fetch all team players with observation counts
  const { data: playerCoverage = [], isLoading } = useQuery({
    queryKey: ["player-coverage", teamId],
    queryFn: async () => {
      // Get all team players
      const { data: players } = await supabase
        .from("team_players")
        .select("id, name, position, team")
        .eq("team_id", teamId)
        .order("name");

      if (!players || players.length === 0) return [];

      // Get observation counts per player
      const { data: observations } = await supabase
        .from("team_observations")
        .select("team_player_id, scout_id");

      const obsMap: Record<string, { count: number; scouts: Set<string> }> = {};
      (observations || []).forEach((o: any) => {
        if (!obsMap[o.team_player_id]) {
          obsMap[o.team_player_id] = { count: 0, scouts: new Set() };
        }
        obsMap[o.team_player_id].count++;
        obsMap[o.team_player_id].scouts.add(o.scout_id);
      });

      return players.map((p: any) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        team: p.team,
        observationCount: obsMap[p.id]?.count || 0,
        scoutCount: obsMap[p.id]?.scouts.size || 0,
        scouts: obsMap[p.id] ? Array.from(obsMap[p.id].scouts).map(getScoutName) : [],
      }));
    },
    enabled: !!teamId,
  });

  const uncovered = playerCoverage.filter(p => p.observationCount === 0);
  const singleCoverage = playerCoverage.filter(p => p.scoutCount === 1);
  const multiCoverage = playerCoverage.filter(p => p.scoutCount >= 2);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Player Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (playerCoverage.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Player Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No shared players yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Player Coverage</span>
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-[10px] font-normal bg-green-500/10 text-green-700 border-green-200">
              {multiCoverage.length} multi
            </Badge>
            <Badge variant="outline" className="text-[10px] font-normal bg-amber-500/10 text-amber-700 border-amber-200">
              {singleCoverage.length} single
            </Badge>
            {uncovered.length > 0 && (
              <Badge variant="outline" className="text-[10px] font-normal bg-red-500/10 text-red-700 border-red-200">
                {uncovered.length} none
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {/* Uncovered players first (priority) */}
        {uncovered.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-destructive flex items-center gap-1 uppercase tracking-wider">
              <AlertTriangle className="h-3 w-3" />
              No observations
            </p>
            {uncovered.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-destructive/5">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{p.name}</span>
                  {p.position && <span className="text-[10px] text-muted-foreground">{p.position}</span>}
                </div>
              </div>
            ))}
            {uncovered.length > 5 && (
              <p className="text-[11px] text-muted-foreground pl-2">+{uncovered.length - 5} more</p>
            )}
          </div>
        )}

        {/* Covered players */}
        {[...multiCoverage, ...singleCoverage].slice(0, 8).map(p => (
          <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm truncate">{p.name}</span>
              {p.position && <span className="text-[10px] text-muted-foreground">{p.position}</span>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {p.observationCount}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] ${p.scoutCount >= 2 ? "bg-green-500/10 text-green-700 border-green-200" : "bg-amber-500/10 text-amber-700 border-amber-200"}`}
              >
                {p.scoutCount} scout{p.scoutCount !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PlayerCoverage;

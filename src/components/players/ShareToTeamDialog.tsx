import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Check, Users } from "lucide-react";
import { toast } from "sonner";

interface ShareToTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected player to share (from PlayerDetails) */
  preSelectedPlayer?: {
    id: string;
    name: string;
    position: string | null;
    team: string | null;
    nationality: string | null;
    date_of_birth?: string | null;
    height?: number | null;
    weight?: number | null;
    foot?: string | null;
    photo_url?: string | null;
    estimated_value?: string | null;
    recommendation?: string | null;
    tags?: string[] | null;
    strengths?: string[] | null;
    weaknesses?: string[] | null;
    risks?: string[] | null;
    profile_summary?: string | null;
    scout_notes?: string | null;
  };
}

const ShareToTeamDialog = ({ open, onOpenChange, preSelectedPlayer }: ShareToTeamDialogProps) => {
  const { user } = useAuth();
  const { team } = useTeam();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sharing, setSharing] = useState<string | null>(null);

  // Fetch personal players (only when no preSelectedPlayer)
  const { data: myPlayers = [], isLoading } = useQuery({
    queryKey: ["my-players-for-share", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, position, team, nationality, date_of_birth, height, weight, foot, photo_url, estimated_value, recommendation, tags, strengths, weaknesses, risks, profile_summary, scout_notes")
        .eq("scout_id", user!.id)
        .eq("visibility", "private")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open && !preSelectedPlayer,
  });

  // Fetch existing team players to avoid duplicates
  const { data: existingTeamNames = [] } = useQuery({
    queryKey: ["existing-team-player-names", team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("players")
        .select("name")
        .eq("visibility", "team")
        .eq("scouting_team_id", team!.id);
      return data?.map(p => p.name.toLowerCase()) || [];
    },
    enabled: !!team?.id && open,
  });

  const handleShare = async (player: any) => {
    if (!user || !team) return;
    setSharing(player.id);
    try {
      const { error } = await supabase.from("players").insert({
        scout_id: user.id,
        visibility: "team",
        scouting_team_id: team.id,
        name: player.name,
        position: player.position,
        team: player.team,
        nationality: player.nationality,
        date_of_birth: player.date_of_birth || null,
        height: player.height || null,
        weight: player.weight || null,
        foot: player.foot || null,
        photo_url: player.photo_url || null,
        estimated_value: player.estimated_value || null,
        recommendation: player.recommendation || null,
        tags: player.tags || [],
        strengths: player.strengths || [],
        weaknesses: player.weaknesses || [],
        risks: player.risks || [],
        profile_summary: player.profile_summary || null,
        scout_notes: player.scout_notes || null,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success(`${player.name} shared with team`);
      if (preSelectedPlayer) {
        onOpenChange(false);
      }
    } catch {
      toast.error("Failed to share player");
    } finally {
      setSharing(null);
    }
  };

  // If pre-selected, show confirmation
  if (preSelectedPlayer) {
    const alreadyShared = existingTeamNames.includes(preSelectedPlayer.name.toLowerCase());
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share to Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add <strong>{preSelectedPlayer.name}</strong> to your team's shared player pool so all scouts can observe and report on them.
            </p>
            {alreadyShared ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <Check className="h-4 w-4 text-green-600" />
                A player with this name already exists in team players.
              </div>
            ) : null}
            <Button
              className="w-full"
              disabled={alreadyShared || sharing === preSelectedPlayer.id}
              onClick={() => handleShare(preSelectedPlayer)}
            >
              {sharing ? "Sharing..." : alreadyShared ? "Already Shared" : "Share to Team"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Search/browse mode
  const filtered = myPlayers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.position?.toLowerCase().includes(search.toLowerCase()) ||
    p.team?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from My Players</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              {search ? "No matching players" : "No personal players to share"}
            </p>
          ) : (
            filtered.map(player => {
              const alreadyShared = existingTeamNames.includes(player.name.toLowerCase());
              return (
                <Card key={player.id} className="overflow-hidden">
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{player.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {player.position && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{player.position}</Badge>}
                        {player.team && <span>{player.team}</span>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={alreadyShared ? "ghost" : "outline"}
                      disabled={alreadyShared || sharing === player.id}
                      onClick={() => handleShare(player)}
                      className="shrink-0"
                    >
                      {alreadyShared ? <Check className="h-4 w-4 text-green-600" /> : sharing === player.id ? "..." : <Users className="h-4 w-4" />}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareToTeamDialog;

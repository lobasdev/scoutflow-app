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
    visibility?: string;
  };
  /** Bulk share: array of player IDs */
  bulkPlayerIds?: string[];
}

const ShareToTeamDialog = ({ open, onOpenChange, preSelectedPlayer, bulkPlayerIds }: ShareToTeamDialogProps) => {
  const { user } = useAuth();
  const { team } = useTeam();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sharing, setSharing] = useState(false);

  // Fetch personal players (only when browsing mode)
  const { data: myPlayers = [], isLoading } = useQuery({
    queryKey: ["my-players-for-share", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, position, team, nationality, visibility")
        .eq("scout_id", user!.id)
        .eq("visibility", "private")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open && !preSelectedPlayer && !bulkPlayerIds,
  });

  const handleSharePlayer = async (playerId: string) => {
    if (!user || !team) return;
    const { error } = await supabase
      .from("players")
      .update({
        visibility: "team",
        scouting_team_id: team.id,
      })
      .eq("id", playerId)
      .eq("scout_id", user.id);
    if (error) throw error;
  };

  const handleShareSingle = async (player: { id: string; name: string; visibility?: string }) => {
    if (player.visibility === "team") {
      toast.info("Already shared with team");
      return;
    }
    setSharing(true);
    try {
      await handleSharePlayer(player.id);
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success(`${player.name} shared with team`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to share player");
    } finally {
      setSharing(false);
    }
  };

  const handleBulkShare = async () => {
    if (!bulkPlayerIds || !user || !team) return;
    setSharing(true);
    try {
      const { error } = await supabase
        .from("players")
        .update({
          visibility: "team",
          scouting_team_id: team.id,
        })
        .in("id", bulkPlayerIds)
        .eq("scout_id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success(`${bulkPlayerIds.length} players shared with team`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to share players");
    } finally {
      setSharing(false);
    }
  };

  // Bulk share confirmation
  if (bulkPlayerIds) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share to Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share <strong>{bulkPlayerIds.length}</strong> selected player{bulkPlayerIds.length !== 1 ? "s" : ""} with your team? All team members will be able to view and add observations.
            </p>
            <Button className="w-full" disabled={sharing} onClick={handleBulkShare}>
              {sharing ? "Sharing..." : `Share ${bulkPlayerIds.length} Players`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Single pre-selected player confirmation
  if (preSelectedPlayer) {
    const alreadyShared = preSelectedPlayer.visibility === "team";
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share to Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share <strong>{preSelectedPlayer.name}</strong> with your team? All team members will be able to view and add observations to this player.
            </p>
            {alreadyShared ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <Check className="h-4 w-4 text-green-600" />
                Already shared with team.
              </div>
            ) : null}
            <Button
              className="w-full"
              disabled={alreadyShared || sharing}
              onClick={() => handleShareSingle(preSelectedPlayer)}
            >
              {sharing ? "Sharing..." : alreadyShared ? "Already Shared" : "Share to Team"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Browse mode
  const filtered = myPlayers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.position?.toLowerCase().includes(search.toLowerCase()) ||
    p.team?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Players to Team</DialogTitle>
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
              {search ? "No matching players" : "No private players to share"}
            </p>
          ) : (
            filtered.map(player => (
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
                    variant="outline"
                    disabled={sharing}
                    onClick={() => handleShareSingle(player)}
                    className="shrink-0"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareToTeamDialog;

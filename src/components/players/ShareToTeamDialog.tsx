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
        .select("id, name, position, team, nationality")
        .eq("scout_id", user!.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open && !preSelectedPlayer,
  });

  // Fetch existing shared players to avoid duplicates
  const { data: existingShared = [] } = useQuery({
    queryKey: ["existing-shared-names", team?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_players")
        .select("name")
        .eq("team_id", team!.id);
      return data?.map(p => p.name.toLowerCase()) || [];
    },
    enabled: !!team?.id && open,
  });

  const handleShare = async (player: { id: string; name: string; position: string | null; team: string | null; nationality: string | null }) => {
    if (!user || !team) return;
    setSharing(player.id);
    try {
      const { error } = await supabase.from("team_players").insert({
        team_id: team.id,
        created_by: user.id,
        name: player.name,
        position: player.position,
        team: player.team,
        nationality: player.nationality,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["team-players"] });
      toast.success(`${player.name} added to shared players`);
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
    const alreadyShared = existingShared.includes(preSelectedPlayer.name.toLowerCase());
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
                A player with this name already exists in shared players.
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

  // Search/browse mode (from TeamPlayers page)
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
              const alreadyShared = existingShared.includes(player.name.toLowerCase());
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

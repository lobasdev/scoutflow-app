import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface LinkedPlayersSectionProps {
  teamId: string;
}

const LinkedPlayersSection = ({ teamId }: LinkedPlayersSectionProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Get players linked to this team
  const { data: players = [] } = useQuery({
    queryKey: ["team-players", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, position, photo_url, recommendation")
        .eq("team_id", teamId)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Get all players that are not linked to this team
  const { data: availablePlayers = [] } = useQuery({
    queryKey: ["available-players-for-team", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, position, photo_url, team")
        .or(`team_id.is.null,team_id.neq.${teamId}`)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const linkPlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase
        .from("players")
        .update({ team_id: teamId })
        .eq("id", playerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-players", teamId] });
      queryClient.invalidateQueries({ queryKey: ["available-players-for-team", teamId] });
      toast.success("Player linked to team");
    },
    onError: () => {
      toast.error("Failed to link player");
    },
  });

  const unlinkPlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase
        .from("players")
        .update({ team_id: null })
        .eq("id", playerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-players", teamId] });
      queryClient.invalidateQueries({ queryKey: ["available-players-for-team", teamId] });
      toast.success("Player unlinked from team");
    },
    onError: () => {
      toast.error("Failed to unlink player");
    },
  });

  const filteredPlayers = availablePlayers.filter(
    (player) =>
      player.name.toLowerCase().includes(search.toLowerCase()) ||
      player.position?.toLowerCase().includes(search.toLowerCase()) ||
      player.team?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Observed Players ({players.length})
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Link Player
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Link Player to Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search players..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {filteredPlayers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {search ? "No players found" : "No available players"}
                    </p>
                  ) : (
                    filteredPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          linkPlayerMutation.mutate(player.id);
                        }}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={player.photo_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {player.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{player.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[player.position, player.team].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No observed players linked to this team yet
          </p>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0"
                  onClick={() => navigate(`/players/${player.id}`)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={player.photo_url || undefined} />
                    <AvatarFallback>
                      {player.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{player.name}</p>
                    {player.position && (
                      <p className="text-xs text-muted-foreground">{player.position}</p>
                    )}
                  </div>
                  {player.recommendation && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {player.recommendation}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    unlinkPlayerMutation.mutate(player.id);
                  }}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkedPlayersSection;

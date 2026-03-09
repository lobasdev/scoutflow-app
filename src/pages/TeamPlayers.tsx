import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, User, MapPin, Flag, Download } from "lucide-react";
import { toast } from "sonner";
import ShareToTeamDialog from "@/components/players/ShareToTeamDialog";

interface TeamPlayer {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  nationality: string | null;
  photo_url: string | null;
  created_by: string;
  created_at: string;
}

const TeamPlayers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { team, isChiefScout } = useTeam();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState({ name: "", position: "", team: "", nationality: "" });

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["team-players", team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      const { data, error } = await supabase
        .from("team_players")
        .select("*")
        .eq("team_id", team.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TeamPlayer[];
    },
    enabled: !!team?.id,
  });

  const handleAddPlayer = async () => {
    if (!user || !team || !form.name.trim()) return;
    try {
      const { error } = await supabase.from("team_players").insert({
        team_id: team.id,
        created_by: user.id,
        name: form.name.trim(),
        position: form.position || null,
        team: form.team || null,
        nationality: form.nationality || null,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["team-players"] });
      setDialogOpen(false);
      setForm({ name: "", position: "", team: "", nationality: "" });
      toast.success("Player added to shared pool");
    } catch {
      toast.error("Failed to add player");
    }
  };

  if (!team) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Shared Players" />
        <main className="px-4 py-12 text-center">
          <p className="text-muted-foreground">No team found. Create a team first.</p>
          <Button className="mt-4" onClick={() => navigate("/team")}>Go to Team</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Shared Players"
        actions={
          <Button variant="ghost" size="icon" onClick={() => setDialogOpen(true)} className="text-primary-foreground hover:bg-primary-foreground/10">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <main className="px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <User className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No shared players yet. Add one to get started.</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Player
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <Card
                key={player.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/team/players/${player.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{player.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {player.position && <span>{player.position}</span>}
                      {player.team && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {player.team}
                        </span>
                      )}
                      {player.nationality && (
                        <span className="flex items-center gap-1">
                          <Flag className="h-3 w-3" />
                          {player.nationality}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Shared Player</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Player name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Position (e.g. ST, CB)" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            <Input placeholder="Team" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} />
            <Input placeholder="Nationality" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
          </div>
          <DialogFooter>
            <Button onClick={handleAddPlayer} disabled={!form.name.trim()}>Add Player</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamPlayers;

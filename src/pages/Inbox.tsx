import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, Trash2, Filter, ArrowUpDown, Inbox as InboxIcon } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InboxPlayer {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  nationality: string | null;
  shirt_number: string | null;
  notes: string | null;
  created_at: string;
}

const Inbox = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<string>("created_at_desc");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  const [playerToConvert, setPlayerToConvert] = useState<InboxPlayer | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: inboxPlayers = [], isLoading } = useQuery({
    queryKey: ["inbox-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inbox_players")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Real-time updates for inbox players
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('inbox-players-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inbox_players'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inbox-players"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const sortedPlayers = [...inboxPlayers].sort((a, b) => {
    switch (sortBy) {
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "created_at_asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "created_at_desc":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const filteredPlayers = sortedPlayers.filter((player) => {
    if (positionFilter && player.position !== positionFilter) return false;
    return true;
  });

  const positions = Array.from(new Set(inboxPlayers.map((p) => p.position).filter(Boolean)));

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("inbox_players").delete().eq("id", id);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["inbox-players"] });
      toast.success("Player removed from inbox");
    } catch (error) {
      toast.error("Failed to delete player");
    }
    setPlayerToDelete(null);
  };

  const handleConvert = async (player: InboxPlayer) => {
    try {
      // Create full player profile
      const { data, error } = await supabase
        .from("players")
        .insert({
          name: player.name,
          position: player.position,
          team: player.team,
          nationality: player.nationality,
          shirt_number: player.shirt_number,
          scout_notes: player.notes,
          tags: ["Inbox"],
          scout_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Delete from inbox
      await supabase.from("inbox_players").delete().eq("id", player.id);

      queryClient.invalidateQueries({ queryKey: ["inbox-players"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      
      toast.success("Player converted to full profile");
      navigate(`/player/${data.id}`);
    } catch (error) {
      toast.error("Failed to convert player");
    }
    setPlayerToConvert(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Player Inbox" />

      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground text-sm">
              Quick capture for players - convert to full profile later
            </p>
            <Button
              onClick={() => navigate("/inbox/new")}
              size="default"
              className="rounded-full"
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Add Quick</span>
            </Button>
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="default"
              className="rounded-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] rounded-full">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Newest First</SelectItem>
                <SelectItem value="created_at_asc">Oldest First</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showFilters && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-2">
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Positions</SelectItem>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos || ""}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading inbox...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 mx-auto text-muted-foreground mb-4 flex items-center justify-center">
              <InboxIcon className="h-16 w-16" />
            </div>
            <p className="text-muted-foreground mb-4">
              No players in inbox. Add players for quick capture!
            </p>
            <Button onClick={() => navigate("/inbox/new")}>
              <Plus className="h-5 w-5 mr-2" />
              Add Player
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPlayers.map((player) => (
              <Card key={player.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{player.name}</CardTitle>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {player.position && (
                          <Badge variant="secondary">{player.position}</Badge>
                        )}
                        {player.team && (
                          <Badge variant="outline">{player.team}</Badge>
                        )}
                        {player.shirt_number && (
                          <Badge variant="outline">#{player.shirt_number}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {player.nationality && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Nationality: {player.nationality}
                    </p>
                  )}
                  {player.notes && (
                    <p className="text-sm text-muted-foreground italic mb-4">
                      {player.notes}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setPlayerToConvert(player)}
                      className="flex-1"
                      size="sm"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Convert to Full Profile
                    </Button>
                    <Button
                      onClick={() => setPlayerToDelete(player.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!playerToDelete} onOpenChange={() => setPlayerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this player from inbox?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => playerToDelete && handleDelete(playerToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!playerToConvert} onOpenChange={() => setPlayerToConvert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Full Profile</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a full player profile and remove this entry from the inbox.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => playerToConvert && handleConvert(playerToConvert)}>
              Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inbox;

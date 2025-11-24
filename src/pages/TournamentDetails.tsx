import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, MapPin, Plus, Edit, Trash2, Download, Users } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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

interface Tournament {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
}

interface TournamentMatch {
  id: string;
  name: string;
  match_date: string;
  home_team: string | null;
  away_team: string | null;
  notes: string | null;
}

interface TournamentPlayer {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  shirt_number: string | null;
  rating: number | null;
  notes: string | null;
  observation_count: number;
  average_rating: number | null;
}

const TournamentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: tournament, isLoading: tournamentLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["tournament-matches", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", id)
        .order("match_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!id,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["tournament-players", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_players")
        .select("*")
        .eq("tournament_id", id)
        .order("average_rating", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!id,
  });

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Tournament deleted");
      navigate("/tournaments");
    } catch (error: any) {
      toast.error("Failed to delete tournament");
    }
  };

  if (tournamentLoading || !tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => navigate("/tournaments")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold ml-2 line-clamp-1">{tournament.name}</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(`/tournament/${id}/edit`)}
              >
                <Edit className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Tournament Info */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-3">
            {tournament.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{tournament.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(tournament.start_date), "MMM d")} - {format(new Date(tournament.end_date), "MMM d, yyyy")}
              </span>
            </div>
            {tournament.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">{tournament.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="matches" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="matches">Matches ({matches.length})</TabsTrigger>
            <TabsTrigger value="players">Players ({players.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => navigate(`/tournament/${id}/match/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Match
              </Button>
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">No matches added yet</p>
                <Button onClick={() => navigate(`/tournament/${id}/match/new`)}>
                  <Plus className="h-5 w-5 mr-2" />
                  Add First Match
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {matches.map((match) => (
                  <Card 
                    key={match.id}
                    className="cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => navigate(`/tournament/${id}/match/${match.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{match.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(match.match_date), "MMM d, yyyy")}</span>
                      </div>
                      {(match.home_team || match.away_team) && (
                        <p className="text-sm font-medium">
                          {match.home_team || "TBD"} vs {match.away_team || "TBD"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            {players.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No players added yet. Add matches and start scouting!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {players.map((player) => (
                  <Card key={player.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span>{player.name}</span>
                        {player.average_rating && (
                          <Badge variant="secondary">
                            {player.average_rating.toFixed(1)} ⭐
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {player.position && (
                          <div>
                            <span className="text-muted-foreground">Position:</span>
                            <p className="font-medium">{player.position}</p>
                          </div>
                        )}
                        {player.shirt_number && (
                          <div>
                            <span className="text-muted-foreground">Number:</span>
                            <p className="font-medium">#{player.shirt_number}</p>
                          </div>
                        )}
                        {player.team && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Team:</span>
                            <p className="font-medium">{player.team}</p>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {player.observation_count} observation{player.observation_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tournament, all matches, and player observations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TournamentDetails;

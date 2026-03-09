import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { User, Calendar, MapPin, MessageSquare, Plus, Crown, Send, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const TeamPlayerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { team, isChiefScout } = useTeam();

  const [obsDialogOpen, setObsDialogOpen] = useState(false);
  const [obsForm, setObsForm] = useState({ date: new Date().toISOString().split("T")[0], location: "", notes: "" });
  const [feedbackText, setFeedbackText] = useState("");

  // Fetch player
  const { data: player } = useQuery({
    queryKey: ["team-player", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_players").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch observations with scout names
  const { data: observations = [] } = useQuery({
    queryKey: ["team-observations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_observations")
        .select("*")
        .eq("team_player_id", id!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch scout profiles for observations
  const scoutIds = [...new Set(observations.map(o => o.scout_id))];
  const { data: scoutProfiles = [] } = useQuery({
    queryKey: ["obs-scouts", scoutIds],
    queryFn: async () => {
      if (scoutIds.length === 0) return [];
      const { data } = await supabase.from("scouts").select("id, name").in("id", scoutIds);
      return data || [];
    },
    enabled: scoutIds.length > 0,
  });

  // Fetch feedback
  const { data: allFeedback = [] } = useQuery({
    queryKey: ["observation-feedback", id],
    queryFn: async () => {
      const obsIds = observations.map(o => o.id);
      if (obsIds.length === 0) return [];
      const { data, error } = await supabase
        .from("observation_feedback")
        .select("*")
        .in("team_observation_id", obsIds)
        .order("created_at", { ascending: true });
      if (error) return [];
      return data;
    },
    enabled: observations.length > 0,
  });

  const handleAddObservation = async () => {
    if (!user || !id || !obsForm.notes.trim()) return;
    try {
      const { error } = await supabase.from("team_observations").insert({
        team_player_id: id,
        scout_id: user.id,
        date: obsForm.date,
        location: obsForm.location || null,
        notes: obsForm.notes,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["team-observations"] });
      setObsDialogOpen(false);
      setObsForm({ date: new Date().toISOString().split("T")[0], location: "", notes: "" });
      toast.success("Observation added");
    } catch {
      toast.error("Failed to add observation");
    }
  };

  const handleAddFeedback = async (observationId: string) => {
    if (!user || !feedbackText.trim()) return;
    try {
      const { error } = await supabase.from("observation_feedback").insert({
        team_observation_id: observationId,
        author_id: user.id,
        comment: feedbackText.trim(),
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["observation-feedback"] });
      setFeedbackText("");
      toast.success("Feedback added");
    } catch {
      toast.error("Failed to add feedback");
    }
  };

  if (!player) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title={player.name} />

      <main className="px-4 py-6 space-y-6">
        {/* Player Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{player.name}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {player.position && <span>{player.position}</span>}
                  {player.team && <span>{player.team}</span>}
                  {player.nationality && <span>{player.nationality}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observations */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Observations ({observations.length})</h3>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setObsDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        {observations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No observations yet. Be the first to add one!
            </CardContent>
          </Card>
        ) : (
          observations.map((obs) => {
            const scout = scoutProfiles.find(s => s.id === obs.scout_id);
            const feedback = allFeedback.filter(f => f.team_observation_id === obs.id);
            return (
              <Card key={obs.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <User className="h-2.5 w-2.5" />
                        {scout?.name || "Scout"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {format(new Date(obs.date), "MMM d, yyyy")}
                      </Badge>
                    </div>
                  </div>
                  {obs.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {obs.location}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{obs.notes}</p>

                  {/* Feedback thread */}
                  {feedback.length > 0 && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Feedback
                      </p>
                      {feedback.map((fb: any) => (
                        <div key={fb.id} className="pl-3 border-l-2 border-primary/30">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Crown className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-medium text-primary">Chief Scout</span>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(fb.created_at), "MMM d")}
                            </span>
                          </div>
                          <p className="text-xs">{fb.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add feedback (Chief Scout only) */}
                  {isChiefScout && (
                    <div className="border-t pt-3 flex gap-2">
                      <Input
                        placeholder="Add feedback..."
                        className="text-xs h-8"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAddFeedback(obs.id);
                          }
                        }}
                      />
                      <Button size="sm" className="h-8 px-3" onClick={() => handleAddFeedback(obs.id)} disabled={!feedbackText.trim()}>
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </main>

      {/* Add Observation Dialog */}
      <Dialog open={obsDialogOpen} onOpenChange={setObsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Observation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="date" value={obsForm.date} onChange={(e) => setObsForm({ ...obsForm, date: e.target.value })} />
            <Input placeholder="Location (optional)" value={obsForm.location} onChange={(e) => setObsForm({ ...obsForm, location: e.target.value })} />
            <Textarea placeholder="Your observation notes..." rows={5} value={obsForm.notes} onChange={(e) => setObsForm({ ...obsForm, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button onClick={handleAddObservation} disabled={!obsForm.notes.trim()}>Add Observation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamPlayerDetails;

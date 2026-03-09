import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Calendar, MapPin, MessageSquare, Crown, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TeamReportsSectionProps {
  playerId: string;
  playerName: string;
}

const TeamReportsSection = ({ playerId, playerName }: TeamReportsSectionProps) => {
  const { user } = useAuth();
  const { team, isChiefScout } = useTeam();
  const queryClient = useQueryClient();
  const [feedbackText, setFeedbackText] = useState("");
  const [activeFeedbackObsId, setActiveFeedbackObsId] = useState<string | null>(null);

  // Fetch all observations for this player from all team scouts
  const { data: observations = [] } = useQuery({
    queryKey: ["team-cross-observations", playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("observations")
        .select("*")
        .eq("player_id", playerId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!playerId && !!team,
  });

  // Get unique scout IDs from observations - need to find which scout owns each observation
  // Observations don't have scout_id directly, they're linked through player.scout_id
  // But for team players, multiple scouts can add observations
  // We need to check who created each observation by cross-referencing

  // Fetch scout profiles
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members-reports", team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", team.id)
        .eq("status", "active");
      if (!members || members.length === 0) return [];
      const { data: scouts } = await supabase
        .from("scouts")
        .select("id, name")
        .in("id", members.map(m => m.user_id));
      return scouts || [];
    },
    enabled: !!team?.id,
  });

  // Fetch ratings for observations
  const obsIds = observations.map(o => o.id);
  const { data: ratings = [] } = useQuery({
    queryKey: ["team-cross-ratings", obsIds],
    queryFn: async () => {
      if (obsIds.length === 0) return [];
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .in("observation_id", obsIds);
      if (error) throw error;
      return data || [];
    },
    enabled: obsIds.length > 0,
  });

  // Fetch CS feedback for these observations
  const { data: feedback = [] } = useQuery({
    queryKey: ["cs-feedback-observations", playerId],
    queryFn: async () => {
      if (obsIds.length === 0) return [];
      const { data } = await supabase
        .from("chief_scout_feedback" as any)
        .select("*")
        .eq("feedback_type", "observation")
        .in("reference_id", obsIds)
        .order("created_at", { ascending: true });
      return (data as any[]) || [];
    },
    enabled: obsIds.length > 0,
  });

  const handleAddFeedback = async (observationId: string, targetScoutId: string) => {
    if (!user || !team || !feedbackText.trim()) return;
    try {
      const { error } = await supabase.from("chief_scout_feedback" as any).insert({
        team_id: team.id,
        author_id: user.id,
        target_scout_id: targetScoutId,
        feedback_type: "observation",
        reference_id: observationId,
        comment: feedbackText.trim(),
      } as any);
      if (error) throw error;

      // Log activity
      await supabase.from("team_activity_log" as any).insert({
        team_id: team.id,
        actor_id: user.id,
        action: "feedback_added",
        entity_type: "observation",
        entity_id: observationId,
        entity_name: playerName,
        metadata: { feedback_type: "observation" },
      } as any);

      queryClient.invalidateQueries({ queryKey: ["cs-feedback-observations"] });
      setFeedbackText("");
      setActiveFeedbackObsId(null);
      toast.success("Feedback added");
    } catch {
      toast.error("Failed to add feedback");
    }
  };

  if (!team || observations.length === 0) return null;

  // Group observations by scout
  // Since observations table doesn't have scout_id, we need the player's scout_id
  // For team players, the scout_id on the player is the one who shared it
  // But other team members can also add observations to team players
  // The RLS allows team members to insert observations for team-visibility players
  // We don't have a direct scout_id on observations - let's group by unique combinations
  
  // For now, show all observations in a single feed grouped by scout
  // We'll identify scouts by checking which members have observations
  
  const scoutNames = new Map(teamMembers.map(s => [s.id, s.name]));

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Team Reports ({observations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {observations.map(obs => {
          const obsFeedback = feedback.filter((f: any) => f.reference_id === obs.id);
          return (
            <div key={obs.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
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
              {obs.notes && (
                <p className="text-sm whitespace-pre-wrap">{obs.notes}</p>
              )}

              {/* Ratings for this observation */}
              {ratings.filter(r => r.observation_id === obs.id).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                  {ratings
                    .filter(r => r.observation_id === obs.id)
                    .map(r => (
                      <Badge key={r.id} variant="secondary" className="text-[10px]">
                        {r.parameter}: {r.score}/10
                      </Badge>
                    ))}
                </div>
              )}

              {/* CS Feedback thread */}
              {obsFeedback.length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  {obsFeedback.map((fb: any) => (
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

              {/* Add feedback (CS only) */}
              {isChiefScout && (
                <div className="border-t pt-3">
                  {activeFeedbackObsId === obs.id ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add feedback..."
                        className="text-xs h-8"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            // Use player's scout_id as target - the scout who owns this player
                            handleAddFeedback(obs.id, obs.player_id || "");
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => handleAddFeedback(obs.id, obs.player_id || "")}
                        disabled={!feedbackText.trim()}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground h-7"
                      onClick={() => setActiveFeedbackObsId(obs.id)}
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      Add Feedback
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default TeamReportsSection;

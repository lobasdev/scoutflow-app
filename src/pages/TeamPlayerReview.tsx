import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { getSkillsForPosition } from "@/constants/skills";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Calendar, MapPin, Crown, Star, Save, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend
} from "recharts";

const SCOUT_COLORS = ["hsl(var(--primary))", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444"];

const TeamPlayerReview = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { team, isChiefScout } = useTeam();

  // Player
  const { data: player } = useQuery({
    queryKey: ["team-player", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_players").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Observations
  const { data: observations = [] } = useQuery({
    queryKey: ["team-observations", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_observations")
        .select("*")
        .eq("team_player_id", id!)
        .order("date", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  // Ratings per observation
  const obsIds = observations.map(o => o.id);
  const { data: allRatings = [] } = useQuery({
    queryKey: ["team-ratings-review", obsIds],
    queryFn: async () => {
      if (obsIds.length === 0) return [];
      const { data } = await supabase
        .from("team_ratings")
        .select("*")
        .in("team_observation_id", obsIds);
      return data || [];
    },
    enabled: obsIds.length > 0,
  });

  // Scout profiles
  const scoutIds = [...new Set(observations.map(o => o.scout_id))];
  const { data: scoutProfiles = [] } = useQuery({
    queryKey: ["review-scouts", scoutIds],
    queryFn: async () => {
      if (scoutIds.length === 0) return [];
      const { data } = await supabase.from("scouts").select("id, name, email").in("id", scoutIds);
      return data || [];
    },
    enabled: scoutIds.length > 0,
  });

  // Existing verdict
  const { data: existingVerdict } = useQuery({
    queryKey: ["team-verdict", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_player_verdicts")
        .select("*")
        .eq("team_player_id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  // Feedback
  const { data: allFeedback = [] } = useQuery({
    queryKey: ["review-feedback", obsIds],
    queryFn: async () => {
      if (obsIds.length === 0) return [];
      const { data } = await supabase
        .from("observation_feedback")
        .select("*")
        .in("team_observation_id", obsIds)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: obsIds.length > 0,
  });

  const skills = getSkillsForPosition(player?.position);
  const getScoutName = (sid: string) => scoutProfiles.find(s => s.id === sid)?.name || "Scout";

  // Group ratings by scout
  const scoutRatingsMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    observations.forEach((obs) => {
      const ratings = allRatings.filter(r => r.team_observation_id === obs.id);
      if (ratings.length > 0) {
        if (!map[obs.scout_id]) map[obs.scout_id] = {};
        // Average if multiple observations by same scout
        ratings.forEach(r => {
          if (!map[obs.scout_id][r.parameter]) {
            map[obs.scout_id][r.parameter] = r.score;
          } else {
            map[obs.scout_id][r.parameter] = Math.round((map[obs.scout_id][r.parameter] + r.score) / 2);
          }
        });
      }
    });
    return map;
  }, [observations, allRatings]);

  // Radar data
  const radarData = useMemo(() => {
    return skills.map(skill => {
      const entry: any = { subject: skill.label };
      scoutIds.forEach((sid, i) => {
        entry[getScoutName(sid)] = scoutRatingsMap[sid]?.[skill.key] || 0;
      });
      // Average
      const scores = scoutIds.map(sid => scoutRatingsMap[sid]?.[skill.key] || 0).filter(s => s > 0);
      entry["Average"] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return entry;
    });
  }, [skills, scoutIds, scoutRatingsMap]);

  // Verdict state
  const [recommendation, setRecommendation] = useState(existingVerdict?.recommendation || "");
  const [summary, setSummary] = useState(existingVerdict?.summary || "");
  const [consensusRatings, setConsensusRatings] = useState<Record<string, number>>(
    (existingVerdict?.consensus_ratings as Record<string, number>) || {}
  );

  // Update state when verdict loads
  const verdictLoaded = !!existingVerdict;
  useState(() => {
    if (existingVerdict) {
      setRecommendation(existingVerdict.recommendation || "");
      setSummary(existingVerdict.summary || "");
      setConsensusRatings((existingVerdict.consensus_ratings as Record<string, number>) || {});
    }
  });

  const saveVerdict = useMutation({
    mutationFn: async () => {
      if (!id || !user) throw new Error("Missing data");
      const verdictData = {
        team_player_id: id,
        author_id: user.id,
        recommendation,
        summary,
        consensus_ratings: consensusRatings,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("team_player_verdicts")
        .upsert(verdictData, { onConflict: "team_player_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-verdict"] });
      toast.success("Verdict saved");
    },
    onError: () => toast.error("Failed to save verdict"),
  });

  if (!player) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Player Review" />
        <main className="px-4 py-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
          </div>
        </main>
      </div>
    );
  }

  const scoutsWithRatings = scoutIds.filter(sid => Object.keys(scoutRatingsMap[sid] || {}).length > 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Player Review"
        actions={
          isChiefScout ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => saveVerdict.mutate()}
              disabled={saveVerdict.isPending}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Save className="h-5 w-5" />
            </Button>
          ) : undefined
        }
      />

      <main className="px-4 py-6 space-y-6">
        {/* Player Header */}
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
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {observations.length} observation{observations.length !== 1 ? "s" : ""} by {scoutIds.length} scout{scoutIds.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="comparison">
          <TabsList className="w-full">
            <TabsTrigger value="comparison" className="flex-1">Ratings</TabsTrigger>
            <TabsTrigger value="reports" className="flex-1">Reports</TabsTrigger>
            {isChiefScout && <TabsTrigger value="verdict" className="flex-1">Verdict</TabsTrigger>}
          </TabsList>

          {/* Ratings Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4 mt-4">
            {/* Overlay Radar Chart */}
            {scoutsWithRatings.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Rating Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                      {scoutsWithRatings.map((sid, i) => (
                        <Radar
                          key={sid}
                          name={getScoutName(sid)}
                          dataKey={getScoutName(sid)}
                          stroke={SCOUT_COLORS[i % SCOUT_COLORS.length]}
                          fill={SCOUT_COLORS[i % SCOUT_COLORS.length]}
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      ))}
                      <Radar
                        name="Average"
                        dataKey="Average"
                        stroke="hsl(var(--foreground))"
                        fill="hsl(var(--foreground))"
                        fillOpacity={0.05}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No ratings submitted yet. Scouts need to rate this player in their observations.
                </CardContent>
              </Card>
            )}

            {/* Per-skill breakdown */}
            {scoutsWithRatings.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Skill Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {skills.map(skill => {
                    const scores = scoutsWithRatings
                      .map(sid => ({ scout: getScoutName(sid), score: scoutRatingsMap[sid]?.[skill.key] || 0 }))
                      .filter(s => s.score > 0);
                    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1) : "—";
                    const spread = scores.length > 1
                      ? Math.max(...scores.map(s => s.score)) - Math.min(...scores.map(s => s.score))
                      : 0;

                    return (
                      <div key={skill.key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{skill.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{avg}</span>
                            {spread >= 3 && (
                              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-200">
                                ±{spread} spread
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {scores.map(({ scout, score }) => (
                            <Badge key={scout} variant="secondary" className="text-[10px] gap-0.5">
                              {scout}: {score}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reports Tab - side by side observations */}
          <TabsContent value="reports" className="space-y-4 mt-4">
            {observations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No observations submitted yet.
                </CardContent>
              </Card>
            ) : (
              scoutIds.map((sid, i) => {
                const scoutObs = observations.filter(o => o.scout_id === sid);
                const feedback = allFeedback.filter(f =>
                  scoutObs.some(o => o.id === f.team_observation_id)
                );
                return (
                  <Card key={sid}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: SCOUT_COLORS[i % SCOUT_COLORS.length] }}
                        />
                        {getScoutName(sid)}
                        <Badge variant="outline" className="text-[10px] ml-auto">
                          {scoutObs.length} report{scoutObs.length !== 1 ? "s" : ""}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {scoutObs.map(obs => (
                        <div key={obs.id} className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(obs.date), "MMM d, yyyy")}
                            {obs.location && (
                              <>
                                <MapPin className="h-3 w-3 ml-2" />
                                {obs.location}
                              </>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{obs.notes}</p>

                          {/* Inline feedback */}
                          {feedback.filter(f => f.team_observation_id === obs.id).map(fb => (
                            <div key={fb.id} className="pl-3 border-l-2 border-primary/30 mt-2">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Crown className="h-3 w-3 text-primary" />
                                <span className="text-[10px] font-medium text-primary">Chief Scout</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{fb.comment}</p>
                            </div>
                          ))}

                          {scoutObs.indexOf(obs) < scoutObs.length - 1 && (
                            <div className="border-t" />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Verdict Tab - Chief Scout only */}
          {isChiefScout && (
            <TabsContent value="verdict" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Crown className="h-4 w-4 text-primary" />
                    Chief Scout Verdict
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Recommendation</Label>
                    <Select value={recommendation} onValueChange={setRecommendation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recommendation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sign">✅ Sign</SelectItem>
                        <SelectItem value="observe_more">👀 Observe More</SelectItem>
                        <SelectItem value="invite_trial">🏟️ Invite for Trial</SelectItem>
                        <SelectItem value="not_sign">❌ Do Not Sign</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Summary / Notes</Label>
                    <Textarea
                      placeholder="Write your overall assessment based on all scout reports..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Consensus Ratings */}
                  <div>
                    <Label className="mb-3 block">Consensus Ratings</Label>
                    <div className="space-y-4">
                      {skills.map(skill => {
                        const scoutScores = scoutsWithRatings
                          .map(sid => scoutRatingsMap[sid]?.[skill.key] || 0)
                          .filter(s => s > 0);
                        const avg = scoutScores.length > 0
                          ? Math.round(scoutScores.reduce((a, b) => a + b, 0) / scoutScores.length)
                          : 5;
                        const current = consensusRatings[skill.key] || avg;

                        return (
                          <div key={skill.key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{skill.label}</span>
                              <div className="flex items-center gap-2">
                                {scoutScores.length > 0 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    scouts avg: {avg}
                                  </span>
                                )}
                                <Badge variant="outline" className="text-xs font-bold min-w-[28px] justify-center">
                                  {current}
                                </Badge>
                              </div>
                            </div>
                            <Slider
                              value={[current]}
                              onValueChange={([v]) => setConsensusRatings({ ...consensusRatings, [skill.key]: v })}
                              min={1}
                              max={10}
                              step={1}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    className="w-full gap-2"
                    onClick={() => saveVerdict.mutate()}
                    disabled={saveVerdict.isPending}
                  >
                    <Save className="h-4 w-4" />
                    {saveVerdict.isPending ? "Saving..." : existingVerdict ? "Update Verdict" : "Save Verdict"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Show verdict to scouts (read-only) */}
          {!isChiefScout && existingVerdict && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  Chief Scout Verdict
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingVerdict.recommendation && (
                  <Badge className="text-sm">
                    {existingVerdict.recommendation === "sign" ? "✅ Sign" :
                     existingVerdict.recommendation === "observe_more" ? "👀 Observe More" :
                     existingVerdict.recommendation === "invite_trial" ? "🏟️ Invite for Trial" :
                     "❌ Do Not Sign"}
                  </Badge>
                )}
                {existingVerdict.summary && (
                  <p className="text-sm whitespace-pre-wrap">{existingVerdict.summary}</p>
                )}
              </CardContent>
            </Card>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default TeamPlayerReview;

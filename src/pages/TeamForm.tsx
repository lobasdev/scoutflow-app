import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Plus, X } from "lucide-react";
import TeamLogoUpload from "@/components/teams/TeamLogoUpload";

const TeamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    country: "",
    league: "",
    stadium: "",
    founded_year: "",
    manager: "",
    logo_url: "",
    website: "",
    season: "",
    matches_played: "",
    wins: "",
    draws: "",
    losses: "",
    goals_for: "",
    goals_against: "",
    clean_sheets: "",
    game_model: "",
    coaching_style: "",
    pressing_style: "",
    build_up_play: "",
    defensive_approach: "",
    set_piece_quality: "",
    tactical_shape: "",
    attacking_patterns: "",
    defensive_patterns: "",
    transition_play: "",
    squad_overview: "",
    squad_age_profile: "",
    squad_depth_rating: "",
    key_findings: "",
    opposition_report: "",
    scout_notes: "",
    recommendation: "",
  });

  const [formations, setFormations] = useState<string[]>([]);
  const [keyPlayers, setKeyPlayers] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<string[]>([]);
  const [threats, setThreats] = useState<string[]>([]);
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [reportLinks, setReportLinks] = useState<string[]>([]);

  const [newFormation, setNewFormation] = useState("");
  const [newKeyPlayer, setNewKeyPlayer] = useState("");
  const [newStrength, setNewStrength] = useState("");
  const [newWeakness, setNewWeakness] = useState("");
  const [newOpportunity, setNewOpportunity] = useState("");
  const [newThreat, setNewThreat] = useState("");
  const [newVideoLink, setNewVideoLink] = useState("");
  const [newReportLink, setNewReportLink] = useState("");

  const { data: existingTeam } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingTeam) {
      setFormData({
        name: existingTeam.name || "",
        city: existingTeam.city || "",
        country: existingTeam.country || "",
        league: existingTeam.league || "",
        stadium: existingTeam.stadium || "",
        founded_year: existingTeam.founded_year?.toString() || "",
        manager: existingTeam.manager || "",
        logo_url: existingTeam.logo_url || "",
        website: existingTeam.website || "",
        season: existingTeam.season || "",
        matches_played: existingTeam.matches_played?.toString() || "",
        wins: existingTeam.wins?.toString() || "",
        draws: existingTeam.draws?.toString() || "",
        losses: existingTeam.losses?.toString() || "",
        goals_for: existingTeam.goals_for?.toString() || "",
        goals_against: existingTeam.goals_against?.toString() || "",
        clean_sheets: existingTeam.clean_sheets?.toString() || "",
        game_model: existingTeam.game_model || "",
        coaching_style: existingTeam.coaching_style || "",
        pressing_style: existingTeam.pressing_style || "",
        build_up_play: existingTeam.build_up_play || "",
        defensive_approach: existingTeam.defensive_approach || "",
        set_piece_quality: existingTeam.set_piece_quality || "",
        tactical_shape: existingTeam.tactical_shape || "",
        attacking_patterns: existingTeam.attacking_patterns || "",
        defensive_patterns: existingTeam.defensive_patterns || "",
        transition_play: existingTeam.transition_play || "",
        squad_overview: existingTeam.squad_overview || "",
        squad_age_profile: existingTeam.squad_age_profile || "",
        squad_depth_rating: existingTeam.squad_depth_rating?.toString() || "",
        key_findings: existingTeam.key_findings || "",
        opposition_report: existingTeam.opposition_report || "",
        scout_notes: existingTeam.scout_notes || "",
        recommendation: existingTeam.recommendation || "",
      });
      setFormations(existingTeam.formations || []);
      setKeyPlayers(existingTeam.key_players || []);
      setStrengths(existingTeam.strengths || []);
      setWeaknesses(existingTeam.weaknesses || []);
      setOpportunities(existingTeam.opportunities || []);
      setThreats(existingTeam.threats || []);
      setVideoLinks(existingTeam.video_links || []);
      setReportLinks(existingTeam.report_links || []);
    }
  }, [existingTeam]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const teamData = {
        scout_id: user!.id,
        name: formData.name,
        city: formData.city || null,
        country: formData.country || null,
        league: formData.league || null,
        stadium: formData.stadium || null,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        manager: formData.manager || null,
        logo_url: formData.logo_url || null,
        website: formData.website || null,
        season: formData.season || null,
        matches_played: formData.matches_played ? parseInt(formData.matches_played) : 0,
        wins: formData.wins ? parseInt(formData.wins) : 0,
        draws: formData.draws ? parseInt(formData.draws) : 0,
        losses: formData.losses ? parseInt(formData.losses) : 0,
        goals_for: formData.goals_for ? parseInt(formData.goals_for) : 0,
        goals_against: formData.goals_against ? parseInt(formData.goals_against) : 0,
        clean_sheets: formData.clean_sheets ? parseInt(formData.clean_sheets) : 0,
        formations: formations || [],
        game_model: formData.game_model || null,
        coaching_style: formData.coaching_style || null,
        pressing_style: formData.pressing_style || null,
        build_up_play: formData.build_up_play || null,
        defensive_approach: formData.defensive_approach || null,
        set_piece_quality: formData.set_piece_quality || null,
        tactical_shape: formData.tactical_shape || null,
        attacking_patterns: formData.attacking_patterns || null,
        defensive_patterns: formData.defensive_patterns || null,
        transition_play: formData.transition_play || null,
        key_players: keyPlayers || [],
        squad_overview: formData.squad_overview || null,
        squad_age_profile: formData.squad_age_profile || null,
        squad_depth_rating: formData.squad_depth_rating ? parseInt(formData.squad_depth_rating) : null,
        key_findings: formData.key_findings || null,
        opposition_report: formData.opposition_report || null,
        strengths: strengths || [],
        weaknesses: weaknesses || [],
        opportunities: opportunities || [],
        threats: threats || [],
        video_links: videoLinks || [],
        report_links: reportLinks || [],
        scout_notes: formData.scout_notes || null,
        recommendation: formData.recommendation || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("teams")
          .update(teamData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("teams").insert(teamData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", id] });
      toast.success(isEditing ? "Team updated" : "Team created");
      navigate("/teams");
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Failed to save team");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    saveMutation.mutate();
  };

  const addToArray = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    clearInput: () => void
  ) => {
    if (value.trim()) {
      setter((prev) => [...prev, value.trim()]);
      clearInput();
    }
  };

  const removeFromArray = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title={isEditing ? "Edit Team" : "Add Team"}
        actions={
          <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Manchester City"
              />
            </div>
            
            <TeamLogoUpload
              logoUrl={formData.logo_url || null}
              onLogoChange={(url) => setFormData({ ...formData, logo_url: url || "" })}
              teamId={id}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="league">League</Label>
                <Input
                  id="league"
                  value={formData.league}
                  onChange={(e) => setFormData({ ...formData, league: e.target.value })}
                  placeholder="e.g., Premier League"
                />
              </div>
              <div>
                <Label htmlFor="stadium">Stadium</Label>
                <Input
                  id="stadium"
                  value={formData.stadium}
                  onChange={(e) => setFormData({ ...formData, stadium: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="founded_year">Founded Year</Label>
                <Input
                  id="founded_year"
                  type="number"
                  value={formData.founded_year}
                  onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                  placeholder="e.g., 1894"
                />
              </div>
              <div>
                <Label htmlFor="manager">Manager</Label>
                <Input
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Season Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Season Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="season">Season</Label>
              <Input
                id="season"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder="e.g., 2024/25"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="wins">Wins</Label>
                <Input
                  id="wins"
                  type="number"
                  min="0"
                  value={formData.wins}
                  onChange={(e) => setFormData({ ...formData, wins: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="draws">Draws</Label>
                <Input
                  id="draws"
                  type="number"
                  min="0"
                  value={formData.draws}
                  onChange={(e) => setFormData({ ...formData, draws: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="losses">Losses</Label>
                <Input
                  id="losses"
                  type="number"
                  min="0"
                  value={formData.losses}
                  onChange={(e) => setFormData({ ...formData, losses: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="goals_for">Goals For</Label>
                <Input
                  id="goals_for"
                  type="number"
                  min="0"
                  value={formData.goals_for}
                  onChange={(e) => setFormData({ ...formData, goals_for: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="goals_against">Goals Against</Label>
                <Input
                  id="goals_against"
                  type="number"
                  min="0"
                  value={formData.goals_against}
                  onChange={(e) => setFormData({ ...formData, goals_against: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="clean_sheets">Clean Sheets</Label>
                <Input
                  id="clean_sheets"
                  type="number"
                  min="0"
                  value={formData.clean_sheets}
                  onChange={(e) => setFormData({ ...formData, clean_sheets: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Findings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Key Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="key_findings"
              value={formData.key_findings}
              onChange={(e) => setFormData({ ...formData, key_findings: e.target.value })}
              placeholder="Summary of key observations and findings about this team..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Formations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Formations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newFormation}
                onChange={(e) => setNewFormation(e.target.value)}
                placeholder="e.g., 4-3-3"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray(newFormation, setFormations, () => setNewFormation(""));
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                onClick={() => addToArray(newFormation, setFormations, () => setNewFormation(""))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formations.map((formation, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {formation}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeFromArray(idx, setFormations)}
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tactical Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tactical Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="tactical_shape">Tactical Shape</Label>
              <Input
                id="tactical_shape"
                value={formData.tactical_shape}
                onChange={(e) => setFormData({ ...formData, tactical_shape: e.target.value })}
                placeholder="e.g., Compact 4-4-2 block"
              />
            </div>
            <div>
              <Label htmlFor="game_model">Game Model</Label>
              <Textarea
                id="game_model"
                value={formData.game_model}
                onChange={(e) => setFormData({ ...formData, game_model: e.target.value })}
                placeholder="Describe the team's overall playing philosophy..."
              />
            </div>
            <div>
              <Label htmlFor="coaching_style">Coaching Style</Label>
              <Textarea
                id="coaching_style"
                value={formData.coaching_style}
                onChange={(e) => setFormData({ ...formData, coaching_style: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="pressing_style">Pressing Style</Label>
              <Input
                id="pressing_style"
                value={formData.pressing_style}
                onChange={(e) => setFormData({ ...formData, pressing_style: e.target.value })}
                placeholder="e.g., High press, Mid-block, Low block"
              />
            </div>
            <div>
              <Label htmlFor="build_up_play">Build-up Play</Label>
              <Textarea
                id="build_up_play"
                value={formData.build_up_play}
                onChange={(e) => setFormData({ ...formData, build_up_play: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="defensive_approach">Defensive Approach</Label>
              <Textarea
                id="defensive_approach"
                value={formData.defensive_approach}
                onChange={(e) => setFormData({ ...formData, defensive_approach: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="attacking_patterns">Attacking Patterns</Label>
              <Textarea
                id="attacking_patterns"
                value={formData.attacking_patterns}
                onChange={(e) => setFormData({ ...formData, attacking_patterns: e.target.value })}
                placeholder="Common attacking patterns and movements..."
              />
            </div>
            <div>
              <Label htmlFor="defensive_patterns">Defensive Patterns</Label>
              <Textarea
                id="defensive_patterns"
                value={formData.defensive_patterns}
                onChange={(e) => setFormData({ ...formData, defensive_patterns: e.target.value })}
                placeholder="Common defensive patterns and structures..."
              />
            </div>
            <div>
              <Label htmlFor="transition_play">Transition Play</Label>
              <Textarea
                id="transition_play"
                value={formData.transition_play}
                onChange={(e) => setFormData({ ...formData, transition_play: e.target.value })}
                placeholder="How the team behaves in transitions..."
              />
            </div>
            <div>
              <Label htmlFor="set_piece_quality">Set Piece Quality</Label>
              <Input
                id="set_piece_quality"
                value={formData.set_piece_quality}
                onChange={(e) => setFormData({ ...formData, set_piece_quality: e.target.value })}
                placeholder="e.g., Excellent, Good, Average, Poor"
              />
            </div>
          </CardContent>
        </Card>

        {/* Squad Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Squad Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Key Players</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newKeyPlayer}
                  onChange={(e) => setNewKeyPlayer(e.target.value)}
                  placeholder="Player name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArray(newKeyPlayer, setKeyPlayers, () => setNewKeyPlayer(""));
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => addToArray(newKeyPlayer, setKeyPlayers, () => setNewKeyPlayer(""))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {keyPlayers.map((player, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {player}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray(idx, setKeyPlayers)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="squad_overview">Squad Overview</Label>
              <Textarea
                id="squad_overview"
                value={formData.squad_overview}
                onChange={(e) => setFormData({ ...formData, squad_overview: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="squad_age_profile">Age Profile</Label>
              <Input
                id="squad_age_profile"
                value={formData.squad_age_profile}
                onChange={(e) => setFormData({ ...formData, squad_age_profile: e.target.value })}
                placeholder="e.g., Young, Experienced mix, Veteran"
              />
            </div>
            <div>
              <Label htmlFor="squad_depth_rating">Squad Depth Rating (1-10)</Label>
              <Input
                id="squad_depth_rating"
                type="number"
                min="1"
                max="10"
                value={formData.squad_depth_rating}
                onChange={(e) => setFormData({ ...formData, squad_depth_rating: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* SWOT Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Team Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strengths */}
            <div>
              <Label className="text-green-600">Strengths</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newStrength}
                  onChange={(e) => setNewStrength(e.target.value)}
                  placeholder="Add strength"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArray(newStrength, setStrengths, () => setNewStrength(""));
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addToArray(newStrength, setStrengths, () => setNewStrength(""))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {strengths.map((item, idx) => (
                  <Badge key={idx} className="gap-1 bg-green-500/20 text-green-700 border-green-500/30">
                    {item}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray(idx, setStrengths)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div>
              <Label className="text-red-600">Weaknesses</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newWeakness}
                  onChange={(e) => setNewWeakness(e.target.value)}
                  placeholder="Add weakness"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArray(newWeakness, setWeaknesses, () => setNewWeakness(""));
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addToArray(newWeakness, setWeaknesses, () => setNewWeakness(""))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {weaknesses.map((item, idx) => (
                  <Badge key={idx} className="gap-1 bg-red-500/20 text-red-700 border-red-500/30">
                    {item}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray(idx, setWeaknesses)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div>
              <Label className="text-blue-600">Opportunities</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newOpportunity}
                  onChange={(e) => setNewOpportunity(e.target.value)}
                  placeholder="Add opportunity"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArray(newOpportunity, setOpportunities, () => setNewOpportunity(""));
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addToArray(newOpportunity, setOpportunities, () => setNewOpportunity(""))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {opportunities.map((item, idx) => (
                  <Badge key={idx} className="gap-1 bg-blue-500/20 text-blue-700 border-blue-500/30">
                    {item}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray(idx, setOpportunities)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Threats */}
            <div>
              <Label className="text-orange-600">Threats</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newThreat}
                  onChange={(e) => setNewThreat(e.target.value)}
                  placeholder="Add threat"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArray(newThreat, setThreats, () => setNewThreat(""));
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addToArray(newThreat, setThreats, () => setNewThreat(""))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {threats.map((item, idx) => (
                  <Badge key={idx} className="gap-1 bg-orange-500/20 text-orange-700 border-orange-500/30">
                    {item}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray(idx, setThreats)} />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opposition Report */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Opposition Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="opposition_report"
              value={formData.opposition_report}
              onChange={(e) => setFormData({ ...formData, opposition_report: e.target.value })}
              placeholder="Detailed opposition analysis and match preparation notes..."
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Links & Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Video Links</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newVideoLink}
                  onChange={(e) => setNewVideoLink(e.target.value)}
                  placeholder="https://..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArray(newVideoLink, setVideoLinks, () => setNewVideoLink(""));
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addToArray(newVideoLink, setVideoLinks, () => setNewVideoLink(""))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 mt-2">
                {videoLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="truncate flex-1">{link}</span>
                    <X className="h-4 w-4 cursor-pointer text-muted-foreground" onClick={() => removeFromArray(idx, setVideoLinks)} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Report Links</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newReportLink}
                  onChange={(e) => setNewReportLink(e.target.value)}
                  placeholder="https://..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToArray(newReportLink, setReportLinks, () => setNewReportLink(""));
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addToArray(newReportLink, setReportLinks, () => setNewReportLink(""))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 mt-2">
                {reportLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="truncate flex-1">{link}</span>
                    <X className="h-4 w-4 cursor-pointer text-muted-foreground" onClick={() => removeFromArray(idx, setReportLinks)} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scout Notes & Recommendation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scout Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="scout_notes">Scout Notes</Label>
              <Textarea
                id="scout_notes"
                value={formData.scout_notes}
                onChange={(e) => setFormData({ ...formData, scout_notes: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="recommendation">Recommendation</Label>
              <Textarea
                id="recommendation"
                value={formData.recommendation}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isEditing ? "Update Team" : "Create Team"}
        </Button>
      </form>
    </div>
  );
};

export default TeamForm;

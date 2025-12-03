import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import PageHeader from "@/components/PageHeader";

const matchSchema = z.object({
  name: z.string().min(1, "Match name is required").max(200),
  date: z.string().min(1, "Date is required"),
  location: z.string().max(200).optional(),
  homeTeam: z.string().min(1, "Home team is required").max(100),
  awayTeam: z.string().min(1, "Away team is required").max(100),
  notes: z.string().max(2000).optional(),
  tournamentId: z.string().optional(),
  weather: z.string().max(100).optional(),
  kickoffTime: z.string().optional(),
  matchVideoLink: z.string().url().optional().or(z.literal("")),
});

interface Tournament {
  id: string;
  name: string;
}

const MatchForm = () => {
  const navigate = useNavigate();
  const { matchId, tournamentId } = useParams();
  const [loading, setLoading] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    location: "",
    homeTeam: "",
    awayTeam: "",
    notes: "",
    tournamentId: tournamentId || "",
    weather: "",
    kickoffTime: "",
    matchVideoLink: "",
  });

  useEffect(() => {
    fetchTournaments();
    if (matchId && matchId !== "new") {
      fetchMatch();
    }
  }, [matchId]);

  const fetchTournaments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("tournaments")
        .select("id, name")
        .eq("scout_id", user.id)
        .order("name");

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error("Failed to fetch tournaments:", error);
    }
  };

  const fetchMatch = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name,
        date: data.date,
        location: data.location || "",
        homeTeam: data.home_team,
        awayTeam: data.away_team,
        notes: data.notes || "",
        tournamentId: data.tournament_id || "",
        weather: data.weather || "",
        kickoffTime: data.kickoff_time || "",
        matchVideoLink: data.match_video_link || "",
      });
    } catch (error: any) {
      toast.error("Failed to fetch match");
      navigate("/matches");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = matchSchema.parse(formData);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const matchData = {
        scout_id: user.id,
        name: validated.name,
        date: validated.date,
        location: validated.location || null,
        home_team: validated.homeTeam,
        away_team: validated.awayTeam,
        notes: validated.notes || null,
        tournament_id: validated.tournamentId || null,
        weather: validated.weather || null,
        kickoff_time: validated.kickoffTime || null,
        match_video_link: validated.matchVideoLink || null,
      };

      if (matchId && matchId !== "new") {
        const { error } = await supabase
          .from("matches")
          .update(matchData)
          .eq("id", matchId);

        if (error) throw error;
        toast.success("Match updated successfully");
        navigate(`/matches/${matchId}`);
      } else {
        const { data, error } = await supabase
          .from("matches")
          .insert([matchData])
          .select()
          .single();

        if (error) throw error;
        toast.success("Match created successfully");
        navigate(`/matches/${data.id}`);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save match");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title={matchId === "new" ? "New Match" : "Edit Match"} />

      <main className="container mx-auto px-4 py-6 pb-32">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Match Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premier League - Round 10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeTeam">Home Team *</Label>
                <Input
                  id="homeTeam"
                  value={formData.homeTeam}
                  onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                  placeholder="Home team name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="awayTeam">Away Team *</Label>
                <Input
                  id="awayTeam"
                  value={formData.awayTeam}
                  onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                  placeholder="Away team name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Stadium or venue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournament">Tournament (Optional)</Label>
                <Select
                  value={formData.tournamentId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, tournamentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tournament..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weather">Weather (Optional)</Label>
                <Input
                  id="weather"
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  placeholder="e.g., Sunny, 20°C"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kickoffTime">Kickoff Time (Optional)</Label>
                <Input
                  id="kickoffTime"
                  type="time"
                  value={formData.kickoffTime}
                  onChange={(e) => setFormData({ ...formData, kickoffTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="matchVideoLink">Match Video Link (Optional)</Label>
                <Input
                  id="matchVideoLink"
                  type="url"
                  value={formData.matchVideoLink}
                  onChange={(e) => setFormData({ ...formData, matchVideoLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the match..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Saving..." : "Save Match"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default MatchForm;
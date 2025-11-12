import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { getSkillsForPosition, SkillParameter } from "@/constants/skills";

const observationSchema = z.object({
  date: z.string().min(1, "Date is required"),
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  videoLink: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const ObservationForm = () => {
  const navigate = useNavigate();
  const { playerId, observationId } = useParams();
  const [loading, setLoading] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<string | null>(null);
  const [ratingParameters, setRatingParameters] = useState<SkillParameter[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    location: "",
    notes: "",
    videoLink: "",
  });
  const [ratings, setRatings] = useState<Record<string, { score: number; comment: string }>>({});

  useEffect(() => {
    fetchPlayerPosition();
  }, [playerId]);

  useEffect(() => {
    if (playerPosition !== null) {
      const skills = getSkillsForPosition(playerPosition);
      setRatingParameters(skills);
      
      const initialRatings: Record<string, { score: number; comment: string }> = {};
      skills.forEach((param) => {
        initialRatings[param.key] = { score: 5, comment: "" };
      });
      setRatings(initialRatings);

      if (observationId && observationId !== "new") {
        fetchObservation();
      }
    }
  }, [playerPosition, observationId]);

  const fetchPlayerPosition = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("position")
        .eq("id", playerId)
        .single();

      if (error) throw error;
      setPlayerPosition(data.position);
    } catch (error) {
      toast.error("Failed to fetch player data");
      navigate("/");
    }
  };

  const fetchObservation = async () => {
    try {
      const { data: observationData, error: observationError } = await supabase
        .from("observations")
        .select("*")
        .eq("id", observationId)
        .single();

      if (observationError) throw observationError;

      setFormData({
        date: observationData.date,
        location: observationData.location || "",
        notes: observationData.notes || "",
        videoLink: observationData.video_link || "",
      });

      const { data: ratingsData, error: ratingsError } = await supabase
        .from("ratings")
        .select("*")
        .eq("observation_id", observationId);

      if (ratingsError) throw ratingsError;

      const ratingsMap: Record<string, { score: number; comment: string }> = {};
      ratingsData?.forEach((rating) => {
        ratingsMap[rating.parameter] = {
          score: rating.score,
          comment: rating.comment || "",
        };
      });
      setRatings(ratingsMap);
    } catch (error: any) {
      toast.error("Failed to fetch observation");
      navigate(`/player/${playerId}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = observationSchema.parse(formData);

      const observationData = {
        player_id: playerId,
        date: validated.date,
        location: validated.location || null,
        notes: validated.notes || null,
        video_link: validated.videoLink || null,
      };

      let currentObservationId = observationId;

      if (observationId && observationId !== "new") {
        const { error } = await supabase
          .from("observations")
          .update(observationData)
          .eq("id", observationId);

        if (error) throw error;

        // Delete existing ratings
        await supabase.from("ratings").delete().eq("observation_id", observationId);
      } else {
        const { data, error } = await supabase
          .from("observations")
          .insert([observationData])
          .select()
          .single();

        if (error) throw error;
        currentObservationId = data.id;
      }

      // Insert ratings
      const ratingsToInsert = ratingParameters.map((param) => ({
        observation_id: currentObservationId,
        parameter: param.key,
        score: ratings[param.key]?.score || 5,
        comment: ratings[param.key]?.comment || null,
      }));

      const { error: ratingsError } = await supabase
        .from("ratings")
        .insert(ratingsToInsert);

      if (ratingsError) throw ratingsError;

      toast.success("Observation saved successfully");
      navigate(`/player/${playerId}/observation/${currentObservationId}`);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save observation");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateRating = (parameter: string, score: number) => {
    setRatings((prev) => ({
      ...prev,
      [parameter]: { ...prev[parameter], score },
    }));
  };

  const updateComment = (parameter: string, comment: string) => {
    setRatings((prev) => ({
      ...prev,
      [parameter]: { ...prev[parameter], comment },
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/player/${playerId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">{observationId === "new" ? "New Observation" : "Edit Observation"}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Observation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  placeholder="e.g., Stadium name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="General observations about the player..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoLink">Video Link (optional)</Label>
                <Input
                  id="videoLink"
                  type="url"
                  value={formData.videoLink}
                  onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Ratings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {ratingParameters.map((param) => (
                <div key={param.key} className="space-y-3 pb-4 border-b last:border-0">
                  <div className="flex justify-between items-center">
                    <Label>{param.label}</Label>
                    <span className="text-2xl font-bold text-primary">{ratings[param.key]?.score || 5}</span>
                  </div>
                  <Slider
                    value={[ratings[param.key]?.score || 5]}
                    onValueChange={([value]) => updateRating(param.key, value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <Input
                    placeholder={`Comment on ${param.label.toLowerCase()}...`}
                    value={ratings[param.key]?.comment || ""}
                    onChange={(e) => updateComment(param.key, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Saving..." : "Save Observation"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default ObservationForm;

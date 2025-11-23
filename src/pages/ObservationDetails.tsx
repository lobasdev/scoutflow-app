import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Download, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { generatePDF } from "@/utils/pdfService";
import { getSkillsForPosition } from "@/constants/skills";

interface Observation {
  id: string;
  date: string;
  location: string | null;
  notes: string | null;
  video_link: string | null;
}

interface Rating {
  id: string;
  parameter: string;
  score: number;
  comment: string | null;
}

interface Player {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  estimated_value: string | null;
  photo_url: string | null;
}

const ObservationDetails = () => {
  const navigate = useNavigate();
  const { playerId, observationId } = useParams();
  const [observation, setObservation] = useState<Observation | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchObservationDetails();
  }, [observationId]);

  const fetchObservationDetails = async () => {
    try {
      const [observationRes, ratingsRes, playerRes] = await Promise.all([
        supabase.from("observations").select("*").eq("id", observationId).single(),
        supabase.from("ratings").select("*").eq("observation_id", observationId),
        supabase.from("players").select("*").eq("id", playerId).single(),
      ]);

      if (observationRes.error) throw observationRes.error;
      if (ratingsRes.error) throw ratingsRes.error;
      if (playerRes.error) throw playerRes.error;

      setObservation(observationRes.data);
      setRatings(ratingsRes.data || []);
      setPlayer(playerRes.data);
    } catch (error: any) {
      toast.error("Failed to fetch observation details");
      navigate(`/player/${playerId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!observation || !player) return;
    
    setGenerating(true);
    try {
      await generatePDF(player, observation, ratings);
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteObservation = async () => {
    try {
      const { error } = await supabase
        .from("observations")
        .delete()
        .eq("id", observationId);

      if (error) throw error;
      
      toast.success("Observation deleted successfully");
      navigate(`/player/${playerId}`);
    } catch (error: any) {
      toast.error("Failed to delete observation");
    }
  };

  const getAverageRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.score, 0);
    return (sum / ratings.length).toFixed(1);
  };

  if (loading || !observation || !player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/player/${playerId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="ml-2">
              <h1 className="text-xl font-bold">{player.name}</h1>
              <p className="text-sm opacity-90">{new Date(observation.date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/player/${playerId}/observation/${observationId}/edit`)}>
              <Edit className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-32 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Observation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-semibold">Date:</span> {new Date(observation.date).toLocaleDateString()}</p>
            {observation.location && <p><span className="font-semibold">Match Name:</span> {observation.location}</p>}
            {observation.notes && (
              <div>
                <p className="font-semibold mb-1">Notes:</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{observation.notes}</p>
              </div>
            )}
            {observation.video_link && (
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={observation.video_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Watch Video
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Performance Ratings</CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-3xl font-bold text-primary">{getAverageRating()}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratings.map((rating) => {
              // Get the proper skill label based on player position
              const skills = getSkillsForPosition(player?.position || null);
              const skill = skills.find(s => s.key === rating.parameter);
              const displayLabel = skill ? skill.label : rating.parameter.replace(/_/g, " ");
              
              return (
                <div key={rating.id} className="pb-4 border-b last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold capitalize">{displayLabel}</span>
                    <span className="text-2xl font-bold text-primary">{rating.score}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${(rating.score / 10) * 100}%` }} />
                  </div>
                  {rating.comment && <p className="text-sm text-muted-foreground mt-2">{rating.comment}</p>}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Button onClick={handleGeneratePDF} className="w-full" size="lg" disabled={generating}>
          <Download className="h-5 w-5 mr-2" />
          {generating ? "Generating PDF..." : "Download Report"}
        </Button>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Observation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this observation and all associated ratings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteObservation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ObservationDetails;

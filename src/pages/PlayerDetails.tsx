import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Edit, FileText, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { generatePlayerProfilePDF } from "@/utils/pdfGenerator";
import SkillsRadarChart from "@/components/SkillsRadarChart";

interface Player {
  id: string;
  name: string;
  age: number | null;
  position: string | null;
  team: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  estimated_value: string | null;
  photo_url: string | null;
}

interface Rating {
  parameter: string;
  score: number;
}

interface Observation {
  id: string;
  date: string;
  location: string | null;
  notes: string | null;
}

const PlayerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPlayerDetails();
    }
  }, [id]);

  const fetchPlayerDetails = async () => {
    try {
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("id", id)
        .single();

      if (playerError) throw playerError;
      setPlayer(playerData);

      const { data: observationsData, error: observationsError } = await supabase
        .from("observations")
        .select("*")
        .eq("player_id", id)
        .order("date", { ascending: false });

      if (observationsError) throw observationsError;
      setObservations(observationsData || []);

      // Fetch all ratings for this player's observations
      const observationIds = observationsData?.map(obs => obs.id) || [];
      if (observationIds.length > 0) {
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("ratings")
          .select("parameter, score")
          .in("observation_id", observationIds);

        if (ratingsError) throw ratingsError;
        setRatings(ratingsData || []);
      }
    } catch (error: any) {
      toast.error("Failed to fetch player details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRatings = () => {
    if (ratings.length === 0) return [];

    const parameterScores: { [key: string]: number[] } = {};
    
    ratings.forEach(rating => {
      if (!parameterScores[rating.parameter]) {
        parameterScores[rating.parameter] = [];
      }
      parameterScores[rating.parameter].push(rating.score);
    });

    return Object.entries(parameterScores).map(([parameter, scores]) => ({
      parameter,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
    }));
  };

  const handleGeneratePlayerReport = async () => {
    if (!player) return;
    
    setGenerating(true);
    try {
      const averageRatings = calculateAverageRatings();
      await generatePlayerProfilePDF(player, averageRatings);
      toast.success("Player report generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate player report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeletePlayer = async () => {
    try {
      const { error } = await supabase
        .from("players")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Player deleted successfully");
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to delete player");
    }
  };

  if (loading || !player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold ml-2">{player.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/player/${id}/edit`)}>
              <Edit className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Player Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {player.photo_url && (
              <div className="flex justify-center mb-4">
                <img src={player.photo_url} alt={player.name} className="w-32 h-32 rounded-full object-cover border-4 border-primary" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {player.age && <p><span className="font-semibold">Age:</span> {player.age}</p>}
              {player.date_of_birth && <p><span className="font-semibold">Date of Birth:</span> {new Date(player.date_of_birth).toLocaleDateString()}</p>}
              {player.position && <p><span className="font-semibold">Position:</span> {player.position}</p>}
              {player.team && <p><span className="font-semibold">Team:</span> {player.team}</p>}
              {player.nationality && <p><span className="font-semibold">Nationality:</span> {player.nationality}</p>}
              {player.estimated_value && <p><span className="font-semibold">Estimated Value:</span> {player.estimated_value}</p>}
            </div>
          </CardContent>
        </Card>

        {calculateAverageRatings().length > 0 && (
          <div className="mb-6">
            <SkillsRadarChart data={calculateAverageRatings()} />
          </div>
        )}

        <Button onClick={handleGeneratePlayerReport} className="w-full mb-6" size="lg" disabled={generating}>
          <Download className="h-5 w-5 mr-2" />
          {generating ? "Generating Report..." : "Generate Player Report"}
        </Button>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Observations</h2>
          <Button onClick={() => navigate(`/player/${id}/observation/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            New Observation
          </Button>
        </div>

        {observations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No observations yet. Start tracking this player's performance!</p>
              <Button onClick={() => navigate(`/player/${id}/observation/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Observation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {observations.map((observation) => (
              <Card key={observation.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/player/${id}/observation/${observation.id}`)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{new Date(observation.date).toLocaleDateString()}</CardTitle>
                      {observation.location && <p className="text-sm text-muted-foreground mt-1">{observation.location}</p>}
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                {observation.notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{observation.notes}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {player?.name} and all associated observations and ratings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlayer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlayerDetails;

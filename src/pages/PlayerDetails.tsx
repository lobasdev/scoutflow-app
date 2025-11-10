import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Edit, FileText } from "lucide-react";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  age: number | null;
  position: string | null;
  team: string | null;
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
  const [loading, setLoading] = useState(true);

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
    } catch (error: any) {
      toast.error("Failed to fetch player details");
      navigate("/");
    } finally {
      setLoading(false);
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
          <Button variant="ghost" size="icon" onClick={() => navigate(`/player/${id}/edit`)}>
            <Edit className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Player Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {player.age && <p><span className="font-semibold">Age:</span> {player.age}</p>}
            {player.position && <p><span className="font-semibold">Position:</span> {player.position}</p>}
            {player.team && <p><span className="font-semibold">Team:</span> {player.team}</p>}
          </CardContent>
        </Card>

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
    </div>
  );
};

export default PlayerDetails;

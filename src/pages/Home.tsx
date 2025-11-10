import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, User, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  age: number | null;
  position: string | null;
  team: string | null;
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPlayers();
  }, [user, navigate]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch players");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">ScoutFlow</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Players</h2>
          <Button onClick={() => navigate("/player/new")} size="lg" className="rounded-full">
            <Plus className="h-5 w-5 mr-2" />
            Add Player
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading players...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No players yet. Add your first player to start scouting!</p>
            <Button onClick={() => navigate("/player/new")}>
              <Plus className="h-5 w-5 mr-2" />
              Add Player
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {players.map((player) => (
              <Card key={player.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/player/${player.id}`)}>
                <CardHeader>
                  <CardTitle>{player.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    {player.age && <p className="text-muted-foreground">Age: {player.age}</p>}
                    {player.position && <p className="text-muted-foreground">Position: {player.position}</p>}
                    {player.team && <p className="text-muted-foreground">Team: {player.team}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

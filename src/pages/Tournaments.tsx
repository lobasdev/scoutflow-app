import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Calendar, MapPin, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface Tournament {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_at: string;
}

const Tournaments = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const filteredTournaments = tournaments.filter(tournament => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tournament.name.toLowerCase().includes(query) ||
      (tournament.location && tournament.location.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold ml-2">Tournaments</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSearch(!showSearch)}
              >
                {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </Button>
              <Button 
                onClick={() => navigate("/tournament/new")}
                size="default"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">New Tournament</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <p className="text-muted-foreground mb-4">
            Organize scouting events with matches, quick player observations, and tournament reports.
          </p>
          
          {showSearch && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Input
                placeholder="Search tournaments by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading tournaments...</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {tournaments.length === 0 
                ? "No tournaments yet. Create your first tournament to start tracking scouting events."
                : "No tournaments match your search."}
            </p>
            {tournaments.length === 0 && (
              <Button onClick={() => navigate("/tournament/new")}>
                <Plus className="h-5 w-5 mr-2" />
                Create Tournament
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
              <Card 
                key={tournament.id}
                className="cursor-pointer hover:shadow-lg transition-all border-2"
                onClick={() => navigate(`/tournament/${tournament.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span>{tournament.name}</span>
                    <Badge variant="secondary">Active</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tournament.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{tournament.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(tournament.start_date), "MMM d")} - {format(new Date(tournament.end_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  {tournament.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">
                      {tournament.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Tournaments;

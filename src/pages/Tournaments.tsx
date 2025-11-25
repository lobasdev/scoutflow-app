import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trophy, Calendar, MapPin, ArrowUpDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import GlobalMenu from "@/components/GlobalMenu";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [sortBy, setSortBy] = useState<string>("created_at_desc");

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
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const sortedTournaments = [...tournaments].sort((a, b) => {
    switch (sortBy) {
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "date_asc":
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      case "date_desc":
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      case "created_at_asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "created_at_desc":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Tournaments</h1>
            <GlobalMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground text-sm">
              Track multiple players across tournament events
            </p>
            <Button
              onClick={() => navigate("/tournaments/new")}
              size="default"
              className="rounded-full"
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">New Tournament</span>
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] rounded-full">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Newest First</SelectItem>
                <SelectItem value="created_at_asc">Oldest First</SelectItem>
                <SelectItem value="date_desc">Latest Date</SelectItem>
                <SelectItem value="date_asc">Earliest Date</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading tournaments...</p>
          </div>
        ) : sortedTournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No tournaments yet. Create one to track event scouting!
            </p>
            <Button onClick={() => navigate("/tournaments/new")}>
              <Plus className="h-5 w-5 mr-2" />
              Create Tournament
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedTournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <span>{tournament.name}</span>
                    </div>
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
                      {format(new Date(tournament.start_date), "MMM d")} -{" "}
                      {format(new Date(tournament.end_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  {tournament.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 italic">
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

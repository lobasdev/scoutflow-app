import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MapPin, Trophy, Users, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Teams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filteredTeams = teams?.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.league?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="Teams"
        showBackButton={false}
        actions={
          <Button size="sm" onClick={() => navigate("/teams/new")}>
            <Plus className="h-4 w-4 mr-1" />
            Add Team
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredTeams?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No teams yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start adding teams for opposition analysis
              </p>
              <Button onClick={() => navigate("/teams/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTeams?.map((team) => (
              <Card
                key={team.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{team.name}</h3>
                        {team.overall_rating && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {team.overall_rating}/10
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                        {team.league && (
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {team.league}
                          </span>
                        )}
                        {(team.city || team.country) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[team.city, team.country].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>

                      {team.formations && team.formations.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {team.formations.slice(0, 3).map((formation, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {formation}
                            </Badge>
                          ))}
                          {team.formations.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{team.formations.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {team.logo_url && (
                      <img
                        src={team.logo_url}
                        alt={team.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LinkedPlayersSectionProps {
  teamId: string;
}

const LinkedPlayersSection = ({ teamId }: LinkedPlayersSectionProps) => {
  const navigate = useNavigate();

  const { data: players = [] } = useQuery({
    queryKey: ["team-players", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, position, photo_url, recommendation")
        .eq("team_id", teamId)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  if (players.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Linked Players ({players.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              onClick={() => navigate(`/players/${player.id}`)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={player.photo_url || undefined} />
                <AvatarFallback>
                  {player.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{player.name}</p>
                {player.position && (
                  <p className="text-xs text-muted-foreground">{player.position}</p>
                )}
              </div>
              {player.recommendation && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {player.recommendation}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LinkedPlayersSection;

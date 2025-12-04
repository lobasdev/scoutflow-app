import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Plus, Star, Eye, Calendar, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { format, differenceInYears, parseISO } from "date-fns";
import ComparisonRadarChart from "./ComparisonRadarChart";

interface PlayerData {
  id: string;
  name: string;
  position: string | null;
  photo_url: string | null;
  recommendation: string | null;
  estimated_value: string | null;
  date_of_birth: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  observations: { id: string; date: string; notes: string | null }[];
  skillsData: { parameter: string; averageScore: number }[];
  averageRating: number | null;
  observationCount: number;
  lastObservationDate: string | null;
}

interface PlayerComparisonCardProps {
  player: PlayerData | null;
  onSelect: () => void;
  onRemove: () => void;
  allSkillsData: { parameter: string; averageScore: number }[][];
  playerIndex: number;
}

const recommendationColors: Record<string, string> = {
  "Sign": "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  "Observe more": "bg-amber-500/20 text-amber-600 border-amber-500/30",
  "Invite for trial": "bg-blue-500/20 text-blue-600 border-blue-500/30",
  "Not sign": "bg-muted text-muted-foreground border-border",
};

const PlayerComparisonCard = ({
  player,
  onSelect,
  onRemove,
  allSkillsData,
  playerIndex,
}: PlayerComparisonCardProps) => {
  const navigate = useNavigate();

  if (!player) {
    return (
      <Card
        className="border-dashed border-2 border-muted-foreground/30 bg-muted/20 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all"
        onClick={onSelect}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Select Player</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Tap to add a player</p>
        </CardContent>
      </Card>
    );
  }

  const age = player.date_of_birth
    ? differenceInYears(new Date(), parseISO(player.date_of_birth))
    : null;

  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="relative overflow-hidden">
      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/80 hover:bg-destructive/20 hover:text-destructive"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardContent className="p-0">
        {/* Header Block */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
          <div className="flex items-start gap-3">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={player.photo_url || ""} alt={player.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{player.name}</h3>
              <p className="text-sm text-muted-foreground">{player.position || "No position"}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {player.recommendation && (
                  <Badge
                    variant="outline"
                    className={recommendationColors[player.recommendation] || ""}
                  >
                    {player.recommendation}
                  </Badge>
                )}
                {age && (
                  <Badge variant="secondary" className="text-xs">
                    {age} years
                  </Badge>
                )}
              </div>
              {player.estimated_value && (
                <p className="text-sm font-medium text-primary mt-2">
                  {player.estimated_value}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        {player.skillsData.length > 0 && (
          <div className="p-4 border-b border-border">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Skills Overview
            </h4>
            <ComparisonRadarChart
              data={player.skillsData}
              comparisonData={allSkillsData}
              playerIndex={playerIndex}
            />
          </div>
        )}

        {/* Ratings Overview */}
        <div className="p-4 border-b border-border">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Ratings Overview
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-xl font-bold text-primary">
                {player.averageRating ? player.averageRating.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-xl font-bold">{player.observationCount}</p>
              <p className="text-xs text-muted-foreground">Observations</p>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                {player.lastObservationDate
                  ? format(parseISO(player.lastObservationDate), "MMM d")
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Last Obs.</p>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-2 gap-4">
            {/* Strengths */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                Strengths
              </h4>
              {player.strengths && player.strengths.length > 0 ? (
                <ul className="space-y-1">
                  {player.strengths.slice(0, 4).map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span className="line-clamp-1">{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">No strengths listed</p>
              )}
            </div>

            {/* Weaknesses */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-rose-600">
                <TrendingDown className="h-3.5 w-3.5" />
                Weaknesses
              </h4>
              {player.weaknesses && player.weaknesses.length > 0 ? (
                <ul className="space-y-1">
                  {player.weaknesses.slice(0, 4).map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span className="line-clamp-1">{w}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">No weaknesses listed</p>
              )}
            </div>
          </div>
        </div>

        {/* Past Observations Summary */}
        <div className="p-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Recent Observations
          </h4>
          {player.observations.length > 0 ? (
            <div className="space-y-2">
              {player.observations.slice(0, 2).map((obs) => (
                <div
                  key={obs.id}
                  className="text-xs p-2 bg-muted/30 rounded-lg border border-border/50"
                >
                  <p className="text-muted-foreground font-medium mb-0.5">
                    {format(parseISO(obs.date), "MMM d, yyyy")}
                  </p>
                  <p className="text-muted-foreground/80 line-clamp-2">
                    {obs.notes || "No notes"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">No observations yet</p>
          )}

          {/* View Full Profile Link */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-primary"
            onClick={() => navigate(`/player/${player.id}`)}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            View Full Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerComparisonCard;

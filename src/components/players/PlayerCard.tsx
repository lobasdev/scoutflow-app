import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ListPlus, MapPin, Calendar, Users, TrendingUp, Star, Check } from "lucide-react";
import { formatEstimatedValue } from "@/utils/valueFormatter";
import { cn } from "@/lib/utils";
import { calculateAge } from "@/utils/dateUtils";

interface Player {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  recommendation: string | null;
  nationality: string | null;
  estimated_value: string | null;
  estimated_value_numeric: number | null;
  appearances: number | null;
  goals: number | null;
  assists: number | null;
  tags: string[] | null;
  created_at: string;
}

interface PlayerCardProps {
  player: Player;
  onCardClick: (playerId: string) => void;
  onShortlistClick: (playerId: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (playerId: string) => void;
}


const getRecommendationConfig = (recommendation: string | null) => {
  switch (recommendation) {
    case "Sign":
      return { 
        label: "Sign", 
        className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
        dotColor: "bg-emerald-500"
      };
    case "Observe more":
      return { 
        label: "Observe", 
        className: "bg-amber-500/10 text-amber-500 border-amber-500/30",
        dotColor: "bg-amber-500"
      };
    case "Invite for trial":
      return { 
        label: "Trial", 
        className: "bg-blue-500/10 text-blue-500 border-blue-500/30",
        dotColor: "bg-blue-500"
      };
    case "Not sign":
      return { 
        label: "Pass", 
        className: "bg-red-500/10 text-red-400 border-red-500/30",
        dotColor: "bg-red-500"
      };
    default:
      return null;
  }
};

export function PlayerCard({ 
  player, 
  onCardClick, 
  onShortlistClick,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: PlayerCardProps) {
  const recConfig = getRecommendationConfig(player.recommendation);
  const hasStats = player.appearances || player.goals || player.assists;
  const age = player.date_of_birth ? calculateAge(player.date_of_birth) : null;

  const handleClick = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect(player.id);
    } else {
      onCardClick(player.id);
    }
  };

  const handleLongPress = () => {
    if (onToggleSelect) {
      onToggleSelect(player.id);
    }
  };

  return (
    <Card 
      className={cn(
        "group cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden border border-border/50 hover:border-primary/50 bg-card",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={handleClick}
    >
      {/* Header with Photo/Avatar */}
      <div className="relative">
        {player.photo_url ? (
          <div className="relative h-44 overflow-hidden">
            <img 
              src={player.photo_url} 
              alt={player.name} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}

        {/* Recommendation Badge - Top Right */}
        {recConfig && !isSelectionMode && (
          <Badge 
            variant="outline" 
            className={`absolute top-3 right-3 ${recConfig.className} text-xs font-medium shadow-sm`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${recConfig.dotColor} mr-1.5`} />
            {recConfig.label}
          </Badge>
        )}

        {/* Selection Checkbox - Top Right in selection mode */}
        {isSelectionMode && (
          <div className="absolute top-3 right-3">
            <div 
              className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-primary border-primary" 
                  : "bg-background/80 border-border"
              )}
            >
              {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
            </div>
          </div>
        )}

        {/* Shortlist Button - Top Left */}
        {!isSelectionMode && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 left-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onShortlistClick(player.id);
            }}
          >
            <ListPlus className="h-4 w-4" />
          </Button>
        )}

        {/* Player Info Overlay */}
        <div className={`${player.photo_url ? "absolute bottom-0 left-0 right-0 p-4" : "px-4 pt-4 pb-2"}`}>
          <div className="flex items-end gap-3">
            {!player.photo_url && (
              <Avatar className="h-12 w-12 border-2 border-background shadow-lg">
                <AvatarImage src={player.photo_url || ""} alt={player.name} />
                <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                  {player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate text-lg leading-tight">
                {player.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {player.position && (
                  <span className="font-medium text-foreground/70">{player.position}</span>
                )}
                {age && (
                  <>
                    <span className="text-border">•</span>
                    <span>{age} yrs</span>
                  </>
                )}
                {player.nationality && (
                  <>
                    <span className="text-border">•</span>
                    <span className="truncate">{player.nationality}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="pt-3 pb-4 px-4 space-y-3">
        {/* Team & Value Row */}
        <div className="flex items-center justify-between gap-2">
          {player.team ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{player.team}</span>
            </div>
          ) : (
            <div />
          )}
          {player.estimated_value_numeric && (
            <Badge variant="secondary" className="font-semibold shrink-0">
              {formatEstimatedValue(player.estimated_value_numeric)}
            </Badge>
          )}
        </div>

        {/* Stats Row */}
        {hasStats && (
          <div className="flex items-center gap-4 py-2 px-3 rounded-lg bg-muted/50">
            {player.appearances !== null && player.appearances > 0 && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">
                  <span className="font-semibold text-foreground">{player.appearances}</span>
                  <span className="text-muted-foreground ml-1">apps</span>
                </span>
              </div>
            )}
            {player.goals !== null && player.goals > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs">
                  <span className="font-semibold text-foreground">{player.goals}</span>
                  <span className="text-muted-foreground ml-1">goals</span>
                </span>
              </div>
            )}
            {player.assists !== null && player.assists > 0 && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs">
                  <span className="font-semibold text-foreground">{player.assists}</span>
                  <span className="text-muted-foreground ml-1">ast</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {player.tags && player.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {player.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs py-0.5 px-2">
                {tag}
              </Badge>
            ))}
            {player.tags.length > 3 && (
              <Badge variant="outline" className="text-xs py-0.5 px-2 text-muted-foreground">
                +{player.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

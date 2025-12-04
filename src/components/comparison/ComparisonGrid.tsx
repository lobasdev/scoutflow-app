import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Plus, Star, Eye, Calendar, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { format, differenceInYears, parseISO } from "date-fns";
import ComparisonRadarChart from "./ComparisonRadarChart";
import type { ComparisonPlayerData } from "@/pages/PlayerComparison";

interface ComparisonGridProps {
  players: (ComparisonPlayerData | null)[];
  onSelectPlayer: (slot: number) => void;
  onRemovePlayer: (slot: number) => void;
}

const recommendationColors: Record<string, string> = {
  "Sign": "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  "Observe more": "bg-amber-500/20 text-amber-600 border-amber-500/30",
  "Invite for trial": "bg-blue-500/20 text-blue-600 border-blue-500/30",
  "Not sign": "bg-muted text-muted-foreground border-border",
};

const COLORS = ['hsl(var(--primary))', 'hsl(142, 71%, 45%)', 'hsl(217, 91%, 60%)'];

const ComparisonGrid = ({ players, onSelectPlayer, onRemovePlayer }: ComparisonGridProps) => {
  const navigate = useNavigate();
  const columnCount = players.length;

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const getAge = (dob: string | null) =>
    dob ? differenceInYears(new Date(), parseISO(dob)) : null;

  // Get all unique parameters across all players for consistent radar charts
  const allParameters = new Set<string>();
  players.forEach((p) => {
    p?.skillsData.forEach((s) => allParameters.add(s.parameter));
  });

  return (
    <div className="space-y-4">
      {/* Player Headers Row */}
      <div className={`grid gap-3 ${columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {players.map((player, index) => (
          <Card key={index} className={`relative overflow-hidden ${!player ? 'border-dashed border-2 border-muted-foreground/30 bg-muted/20' : ''}`}>
            {player ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-6 w-6 bg-background/80 hover:bg-destructive/20 hover:text-destructive"
                  onClick={() => onRemovePlayer(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <CardContent className="p-3">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-14 w-14 border-2 mb-2" style={{ borderColor: COLORS[index] }}>
                      <AvatarImage src={player.photo_url || ""} alt={player.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-sm truncate w-full">{player.name}</h3>
                    <p className="text-xs text-muted-foreground">{player.position || "—"}</p>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {player.recommendation && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${recommendationColors[player.recommendation]}`}>
                          {player.recommendation}
                        </Badge>
                      )}
                      {getAge(player.date_of_birth) && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {getAge(player.date_of_birth)}y
                        </Badge>
                      )}
                    </div>
                    {player.estimated_value && (
                      <p className="text-xs font-medium text-primary mt-1">{player.estimated_value}</p>
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent
                className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => onSelectPlayer(index)}
              >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Add Player</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Only show comparison sections if at least one player is selected */}
      {players.some(Boolean) && (
        <>
          {/* Radar Charts Row */}
          <Card>
            <CardContent className="p-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Skills Comparison
              </h4>
              <div className={`grid gap-2 ${columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {players.map((player, index) => (
                  <div key={index} className="flex flex-col items-center">
                    {player && player.skillsData.length > 0 ? (
                      <ComparisonRadarChart
                        data={player.skillsData}
                        playerIndex={index}
                      />
                    ) : (
                      <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">
                        {player ? "No ratings" : "—"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ratings Overview Row */}
          <Card>
            <CardContent className="p-3">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Ratings Overview
              </h4>
              <div className={`grid gap-3 ${columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {players.map((player, index) => (
                  <div key={index} className="space-y-2">
                    {player ? (
                      <>
                        <div className="text-center p-2 bg-muted/50 rounded-lg">
                          <p className="text-lg font-bold" style={{ color: COLORS[index] }}>
                            {player.averageRating ? player.averageRating.toFixed(1) : "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Avg Rating</p>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="text-center p-1.5 bg-muted/30 rounded">
                            <p className="text-sm font-semibold">{player.observationCount}</p>
                            <p className="text-[9px] text-muted-foreground">Obs.</p>
                          </div>
                          <div className="text-center p-1.5 bg-muted/30 rounded">
                            <p className="text-[10px] font-medium">
                              {player.lastObservationDate
                                ? format(parseISO(player.lastObservationDate), "MM/dd")
                                : "—"}
                            </p>
                            <p className="text-[9px] text-muted-foreground">Last</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="h-20 flex items-center justify-center text-muted-foreground">—</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths Row */}
          <Card>
            <CardContent className="p-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
                Strengths
              </h4>
              <div className={`grid gap-3 ${columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {players.map((player, index) => (
                  <div key={index} className="min-h-[60px]">
                    {player ? (
                      player.strengths && player.strengths.length > 0 ? (
                        <ul className="space-y-0.5">
                          {player.strengths.slice(0, 4).map((s, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span className="line-clamp-1">{s}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/60 italic">None listed</p>
                      )
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">—</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weaknesses Row */}
          <Card>
            <CardContent className="p-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5 text-rose-600">
                <TrendingDown className="h-4 w-4" />
                Weaknesses
              </h4>
              <div className={`grid gap-3 ${columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {players.map((player, index) => (
                  <div key={index} className="min-h-[60px]">
                    {player ? (
                      player.weaknesses && player.weaknesses.length > 0 ? (
                        <ul className="space-y-0.5">
                          {player.weaknesses.slice(0, 4).map((w, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                              <span className="text-rose-500 mt-0.5">•</span>
                              <span className="line-clamp-1">{w}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/60 italic">None listed</p>
                      )
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">—</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Observations Row */}
          <Card>
            <CardContent className="p-3">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Recent Observations
              </h4>
              <div className={`grid gap-3 ${columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {players.map((player, index) => (
                  <div key={index} className="min-h-[80px]">
                    {player ? (
                      player.observations.length > 0 ? (
                        <div className="space-y-1.5">
                          {player.observations.slice(0, 2).map((obs) => (
                            <div key={obs.id} className="text-[10px] p-1.5 bg-muted/30 rounded border border-border/50">
                              <p className="font-medium text-muted-foreground">
                                {format(parseISO(obs.date), "MMM d, yy")}
                              </p>
                              <p className="text-muted-foreground/70 line-clamp-2">{obs.notes || "No notes"}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/60 italic">No observations</p>
                      )
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">—</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* View Profile Links Row */}
          <div className={`grid gap-3 ${columnCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {players.map((player, index) => (
              <div key={index}>
                {player ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate(`/player/${player.id}`)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Full Profile
                  </Button>
                ) : (
                  <div className="h-8" />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ComparisonGrid;

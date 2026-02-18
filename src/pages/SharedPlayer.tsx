import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEstimatedValue } from "@/utils/valueFormatter";
import { calculateAge } from "@/utils/dateUtils";
import { Activity, User, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

const SharedPlayer = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shared-player", token],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shared-player?token=${token}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load player");
      }
      return res.json();
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium text-foreground mb-2">Link Unavailable</p>
            <p className="text-sm text-muted-foreground">
              {(error as Error)?.message || "This share link is invalid or has expired."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { player, observations, ratings, injuries, sharedBy } = data;

  // Calculate average ratings
  const parameterScores: Record<string, number[]> = {};
  ratings?.forEach((r: any) => {
    if (!parameterScores[r.parameter]) parameterScores[r.parameter] = [];
    parameterScores[r.parameter].push(r.score);
  });
  const avgRatings = Object.entries(parameterScores).map(([param, scores]) => ({
    parameter: param,
    avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary-foreground/30" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <User className="h-8 w-8" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{player.name}</h1>
              <div className="flex flex-wrap gap-2 mt-1 text-sm opacity-80">
                {player.position && <span>{player.position}</span>}
                {player.team && <span>• {player.team}</span>}
                {player.nationality && <span>• {player.nationality}</span>}
              </div>
              {player.recommendation && (
                <Badge variant="secondary" className="mt-2">{player.recommendation}</Badge>
              )}
            </div>
          </div>
          {sharedBy && (
            <p className="text-xs mt-4 opacity-60">
              Shared by {sharedBy.name}{sharedBy.club ? ` • ${sharedBy.club}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Player Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {player.date_of_birth && <p><span className="font-semibold">Age:</span> {calculateAge(player.date_of_birth)}</p>}
              {player.height && <p><span className="font-semibold">Height:</span> {player.height} cm</p>}
              {player.weight && <p><span className="font-semibold">Weight:</span> {player.weight} kg</p>}
              {player.foot && <p><span className="font-semibold">Foot:</span> {player.foot}</p>}
              {player.estimated_value_numeric && <p><span className="font-semibold">Value:</span> {formatEstimatedValue(player.estimated_value_numeric)}</p>}
              {player.contract_expires && <p><span className="font-semibold">Contract:</span> {new Date(player.contract_expires).toLocaleDateString()}</p>}
            </div>
            {player.profile_summary && (
              <p className="text-sm mt-4 p-3 bg-muted/30 rounded-lg italic">{player.profile_summary}</p>
            )}
          </CardContent>
        </Card>

        {/* Strengths / Weaknesses */}
        {((player.strengths?.length > 0) || (player.weaknesses?.length > 0)) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Analysis</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {player.strengths?.length > 0 && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-green-500 mb-2">✓ Strengths</h4>
                  <ul className="space-y-1">{player.strengths.map((s: string, i: number) => <li key={i} className="text-sm">• {s}</li>)}</ul>
                </div>
              )}
              {player.weaknesses?.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-red-500 mb-2">✗ Weaknesses</h4>
                  <ul className="space-y-1">{player.weaknesses.map((w: string, i: number) => <li key={i} className="text-sm">• {w}</li>)}</ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ratings */}
        {avgRatings.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Average Ratings</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {avgRatings.map((r) => (
                  <div key={r.parameter} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                    <span className="text-sm capitalize">{r.parameter.replace(/_/g, " ")}</span>
                    <Badge variant="secondary">{r.avg}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Injuries */}
        {injuries?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" /> Injury History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {injuries.map((inj: any) => (
                <div key={inj.id} className="p-3 bg-muted/30 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{inj.injury_type}</span>
                    {inj.severity && <Badge variant="outline" className="text-xs">{inj.severity}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {inj.body_part && <span>{inj.body_part} • </span>}
                    {format(new Date(inj.injury_date), "MMM d, yyyy")}
                    {inj.days_missed && <span> • {inj.days_missed} days missed</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Observations */}
        {observations?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Observations ({observations.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {observations.map((obs: any) => (
                <div key={obs.id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{format(new Date(obs.date), "MMM d, yyyy")}</span>
                    {obs.location && (
                      <><MapPin className="h-3 w-3 text-muted-foreground ml-2" /><span className="text-muted-foreground">{obs.location}</span></>
                    )}
                  </div>
                  {obs.notes && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{obs.notes}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground py-4">
          Powered by ScoutFlow
        </p>
      </div>
    </div>
  );
};

export default SharedPlayer;

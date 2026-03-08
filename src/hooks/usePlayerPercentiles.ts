import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PercentileData = Record<string, Record<string, number>>; // playerId -> parameter -> percentile

export const usePlayerPercentiles = (scoutId: string | undefined, playerIds: string[]) => {
  return useQuery({
    queryKey: ["player-percentiles", scoutId, playerIds],
    queryFn: async (): Promise<PercentileData> => {
      if (!scoutId || playerIds.length === 0) return {};

      // Get all players for this scout
      const { data: allPlayers } = await supabase
        .from("players")
        .select("id")
        .eq("scout_id", scoutId);
      if (!allPlayers || allPlayers.length === 0) return {};

      // Get all observations for all scout's players
      const { data: allObs } = await supabase
        .from("observations")
        .select("id, player_id")
        .in("player_id", allPlayers.map(p => p.id));
      if (!allObs || allObs.length === 0) return {};

      const obsIds = allObs.map(o => o.id);
      const obsToPlayer = new Map(allObs.map(o => [o.id, o.player_id]));

      // Get all ratings - batch in chunks if needed
      let allRatings: { observation_id: string; parameter: string; score: number }[] = [];
      const chunkSize = 500;
      for (let i = 0; i < obsIds.length; i += chunkSize) {
        const chunk = obsIds.slice(i, i + chunkSize);
        const { data } = await supabase
          .from("ratings")
          .select("observation_id, parameter, score")
          .in("observation_id", chunk);
        if (data) allRatings = allRatings.concat(data);
      }

      // Build per-player average scores per parameter
      const playerParamScores: Record<string, Record<string, number[]>> = {};
      allRatings.forEach(r => {
        const pid = obsToPlayer.get(r.observation_id);
        if (!pid) return;
        if (!playerParamScores[pid]) playerParamScores[pid] = {};
        if (!playerParamScores[pid][r.parameter]) playerParamScores[pid][r.parameter] = [];
        playerParamScores[pid][r.parameter].push(r.score);
      });

      // Calculate averages
      const playerAvgs: Record<string, Record<string, number>> = {};
      Object.entries(playerParamScores).forEach(([pid, params]) => {
        playerAvgs[pid] = {};
        Object.entries(params).forEach(([param, scores]) => {
          playerAvgs[pid][param] = scores.reduce((a, b) => a + b, 0) / scores.length;
        });
      });

      // Calculate percentiles for requested players
      const result: PercentileData = {};
      playerIds.forEach(pid => {
        if (!playerAvgs[pid]) return;
        result[pid] = {};
        Object.entries(playerAvgs[pid]).forEach(([param, avg]) => {
          // Count how many players have a lower average for this param
          const allAvgsForParam = Object.values(playerAvgs)
            .map(p => p[param])
            .filter((v): v is number => v !== undefined);
          const below = allAvgsForParam.filter(v => v < avg).length;
          result[pid][param] = allAvgsForParam.length > 1
            ? Math.round((below / (allAvgsForParam.length - 1)) * 100)
            : 50;
        });
      });

      return result;
    },
    enabled: !!scoutId && playerIds.length > 0,
  });
};

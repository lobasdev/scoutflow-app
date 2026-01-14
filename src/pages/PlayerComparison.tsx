import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import PlayerSearchDialog from "@/components/comparison/PlayerSearchDialog";
import ComparisonGrid from "@/components/comparison/ComparisonGrid";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export interface ComparisonPlayerData {
  id: string;
  name: string;
  position: string | null;
  photo_url: string | null;
  recommendation: string | null;
  estimated_value: string | null;
  estimated_value_numeric: number | null;
  date_of_birth: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  observations: { id: string; date: string; notes: string | null }[];
  skillsData: { parameter: string; averageScore: number }[];
  averageRating: number | null;
  observationCount: number;
  lastObservationDate: string | null;
}

const PlayerComparison = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<(string | null)[]>([null, null]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number>(0);

  // Initialize selected players from URL params
  useEffect(() => {
    const playersParam = searchParams.get("players");
    if (playersParam) {
      const playerIds = playersParam.split(",").filter(Boolean);
      if (playerIds.length > 0) {
        // Pad with nulls to maintain at least 2 slots
        const slots: (string | null)[] = [...playerIds];
        while (slots.length < 2) {
          slots.push(null);
        }
        setSelectedPlayerIds(slots.slice(0, 3)); // Max 3 players
      }
    }
  }, [searchParams]);

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["all-players-for-comparison", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, position, photo_url")
        .eq("scout_id", user?.id)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: selectedPlayers = [] } = useQuery({
    queryKey: ["comparison-players", selectedPlayerIds.filter(Boolean)],
    queryFn: async () => {
      const ids = selectedPlayerIds.filter(Boolean) as string[];
      if (ids.length === 0) return [];

      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("*")
        .in("id", ids);
      if (playersError) throw playersError;

      const playersWithData = await Promise.all(
        (players || []).map(async (player) => {
          const { data: observations } = await supabase
            .from("observations")
            .select("id, date, notes")
            .eq("player_id", player.id)
            .order("date", { ascending: false });

          const observationIds = observations?.map((o) => o.id) || [];
          let ratings: any[] = [];
          if (observationIds.length > 0) {
            const { data: ratingsData } = await supabase
              .from("ratings")
              .select("parameter, score")
              .in("observation_id", observationIds);
            ratings = ratingsData || [];
          }

          const parameterScores: Record<string, number[]> = {};
          ratings.forEach((r) => {
            if (!parameterScores[r.parameter]) parameterScores[r.parameter] = [];
            parameterScores[r.parameter].push(r.score);
          });

          const skillsData = Object.entries(parameterScores).map(([param, scores]) => ({
            parameter: param,
            averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
          }));

          const allScores = ratings.map((r) => r.score);
          const averageRating = allScores.length > 0
            ? allScores.reduce((a, b) => a + b, 0) / allScores.length
            : null;

          return {
            ...player,
            observations: observations || [],
            skillsData,
            averageRating,
            observationCount: observations?.length || 0,
            lastObservationDate: observations?.[0]?.date || null,
          };
        })
      );

      return playersWithData;
    },
    enabled: selectedPlayerIds.some(Boolean),
  });

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) => {
      const newIds = [...prev];
      newIds[activeSlot] = playerId;
      return newIds;
    });
    setSearchDialogOpen(false);
  };

  const handleRemovePlayer = (slot: number) => {
    setSelectedPlayerIds((prev) => {
      const newIds = [...prev];
      newIds[slot] = null;
      return newIds;
    });
  };

  const handleAddSlot = () => {
    if (selectedPlayerIds.length < 3) {
      setSelectedPlayerIds((prev) => [...prev, null]);
    }
  };

  const handleOpenSearch = (slot: number) => {
    setActiveSlot(slot);
    setSearchDialogOpen(true);
  };

  const getPlayerForSlot = (slot: number): ComparisonPlayerData | null => {
    const playerId = selectedPlayerIds[slot];
    if (!playerId) return null;
    return selectedPlayers.find((p) => p.id === playerId) || null;
  };

  const selectedIds = selectedPlayerIds.filter(Boolean) as string[];
  const playersForGrid = selectedPlayerIds.map((_, i) => getPlayerForSlot(i));

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Player Comparison" />

      <div className="p-4">
        {/* Info Banner */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Compare up to 3 players side-by-side</span>
          </div>
          {selectedPlayerIds.length < 3 && (
            <Button variant="outline" size="sm" onClick={handleAddSlot}>
              <Plus className="h-4 w-4 mr-1" />
              Add Player
            </Button>
          )}
        </div>

        {/* Side-by-Side Comparison Grid */}
        <ComparisonGrid
          players={playersForGrid}
          onSelectPlayer={handleOpenSearch}
          onRemovePlayer={handleRemovePlayer}
        />
      </div>

      <PlayerSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        players={allPlayers}
        selectedIds={selectedIds}
        onSelect={handleSelectPlayer}
      />
    </div>
  );
};

export default PlayerComparison;

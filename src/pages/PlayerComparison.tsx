import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import PlayerComparisonCard from "@/components/comparison/PlayerComparisonCard";
import PlayerSearchDialog from "@/components/comparison/PlayerSearchDialog";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

const PlayerComparison = () => {
  const { user } = useAuth();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<(string | null)[]>([null, null]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number>(0);

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

      // Fetch observations and ratings for each player
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

          // Calculate average scores per parameter
          const parameterScores: Record<string, number[]> = {};
          ratings.forEach((r) => {
            if (!parameterScores[r.parameter]) parameterScores[r.parameter] = [];
            parameterScores[r.parameter].push(r.score);
          });

          const skillsData = Object.entries(parameterScores).map(([param, scores]) => ({
            parameter: param,
            averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
          }));

          // Calculate overall average rating
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

  const getPlayerForSlot = (slot: number) => {
    const playerId = selectedPlayerIds[slot];
    if (!playerId) return null;
    return selectedPlayers.find((p) => p.id === playerId);
  };

  const selectedIds = selectedPlayerIds.filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Player Comparison" />

      <div className="p-4">
        {/* Info Banner */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Compare up to 3 players side-by-side</span>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="space-y-4">
          {selectedPlayerIds.map((_, index) => (
            <PlayerComparisonCard
              key={index}
              player={getPlayerForSlot(index)}
              onSelect={() => handleOpenSearch(index)}
              onRemove={() => handleRemovePlayer(index)}
              allSkillsData={selectedPlayers.map((p) => p.skillsData)}
              playerIndex={index}
            />
          ))}

          {/* Add Third Player Button */}
          {selectedPlayerIds.length < 3 && (
            <Button
              variant="outline"
              className="w-full h-16 border-dashed"
              onClick={handleAddSlot}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Third Player
            </Button>
          )}
        </div>
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

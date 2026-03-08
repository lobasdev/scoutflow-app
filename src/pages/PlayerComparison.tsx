import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import PlayerSearchDialog from "@/components/comparison/PlayerSearchDialog";
import ComparisonGrid from "@/components/comparison/ComparisonGrid";
import { Button } from "@/components/ui/button";
import { Plus, Users, Download } from "lucide-react";
import { usePlayerPercentiles } from "@/hooks/usePlayerPercentiles";
import { toast } from "sonner";

export interface ComparisonPlayerData {
  id: string;
  name: string;
  position: string | null;
  photo_url: string | null;
  recommendation: string | null;
  estimated_value: string | null;
  estimated_value_numeric: number | null;
  date_of_birth: string | null;
  height: number | null;
  weight: number | null;
  foot: string | null;
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

  useEffect(() => {
    const playersParam = searchParams.get("players");
    if (playersParam) {
      const playerIds = playersParam.split(",").filter(Boolean);
      if (playerIds.length > 0) {
        const slots: (string | null)[] = [...playerIds];
        while (slots.length < 2) slots.push(null);
        setSelectedPlayerIds(slots.slice(0, 3));
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

  const activeIds = selectedPlayerIds.filter(Boolean) as string[];

  const { data: selectedPlayers = [] } = useQuery({
    queryKey: ["comparison-players", activeIds],
    queryFn: async () => {
      if (activeIds.length === 0) return [];

      const { data: players, error } = await supabase
        .from("players")
        .select("*")
        .in("id", activeIds);
      if (error) throw error;

      return Promise.all(
        (players || []).map(async (player) => {
          const { data: observations } = await supabase
            .from("observations")
            .select("id, date, notes")
            .eq("player_id", player.id)
            .order("date", { ascending: false });

          const obsIds = observations?.map((o) => o.id) || [];
          let ratings: { parameter: string; score: number }[] = [];
          if (obsIds.length > 0) {
            const { data } = await supabase
              .from("ratings")
              .select("parameter, score")
              .in("observation_id", obsIds);
            ratings = data || [];
          }

          const paramScores: Record<string, number[]> = {};
          ratings.forEach((r) => {
            if (!paramScores[r.parameter]) paramScores[r.parameter] = [];
            paramScores[r.parameter].push(r.score);
          });

          const skillsData = Object.entries(paramScores).map(([param, scores]) => ({
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
          } as ComparisonPlayerData;
        })
      );
    },
    enabled: activeIds.length > 0,
  });

  const { data: percentiles } = usePlayerPercentiles(user?.id, activeIds);

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

  const handleExport = () => {
    const active = selectedPlayers.filter(p => activeIds.includes(p.id));
    if (active.length === 0) return;

    const lines: string[] = ["PLAYER COMPARISON REPORT", "=".repeat(40), ""];
    active.forEach(p => {
      lines.push(`📋 ${p.name}`);
      lines.push(`   Position: ${p.position || "—"}`);
      lines.push(`   Avg Rating: ${p.averageRating?.toFixed(1) || "—"}`);
      lines.push(`   Observations: ${p.observationCount}`);
      lines.push(`   Value: ${p.estimated_value_numeric ? `€${(p.estimated_value_numeric / 1000000).toFixed(1)}M` : "—"}`);
      lines.push(`   Height: ${p.height ? `${p.height}cm` : "—"} | Weight: ${p.weight ? `${p.weight}kg` : "—"} | Foot: ${p.foot || "—"}`);
      lines.push(`   Recommendation: ${p.recommendation || "—"}`);
      if (p.strengths?.length) lines.push(`   Strengths: ${p.strengths.join(", ")}`);
      if (p.weaknesses?.length) lines.push(`   Weaknesses: ${p.weaknesses.join(", ")}`);
      if (p.skillsData.length) {
        lines.push(`   Skills: ${p.skillsData.map(s => `${s.parameter}: ${s.averageScore.toFixed(1)}`).join(", ")}`);
      }
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparison-${active.map(p => p.name.replace(/\s/g, "_")).join("-vs-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Comparison exported!");
  };

  const getPlayerForSlot = (slot: number): ComparisonPlayerData | null => {
    const playerId = selectedPlayerIds[slot];
    if (!playerId) return null;
    return selectedPlayers.find((p) => p.id === playerId) || null;
  };

  const playersForGrid = selectedPlayerIds.map((_, i) => getPlayerForSlot(i));

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Player Comparison" />

      <div className="p-4">
        <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Compare up to 3 players side-by-side</span>
          </div>
          <div className="flex gap-2">
            {activeIds.length >= 2 && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            {selectedPlayerIds.length < 3 && (
              <Button variant="outline" size="sm" onClick={handleAddSlot}>
                <Plus className="h-4 w-4 mr-1" />
                Add Player
              </Button>
            )}
          </div>
        </div>

        <ComparisonGrid
          players={playersForGrid}
          onSelectPlayer={handleOpenSearch}
          onRemovePlayer={handleRemovePlayer}
          percentiles={percentiles}
        />
      </div>

      <PlayerSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        players={allPlayers}
        selectedIds={activeIds}
        onSelect={handleSelectPlayer}
      />
    </div>
  );
};

export default PlayerComparison;

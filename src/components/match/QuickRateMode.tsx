import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight, Star, Save, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MatchPlayer {
  id: string;
  team: "home" | "away";
  name: string;
  position: string | null;
  shirt_number: string | null;
  observation_id: string | null;
  is_starter: boolean;
  rating: number | null;
}

interface QuickRateModeProps {
  matchId: string;
  matchDate: string;
  matchName: string;
  players: MatchPlayer[];
  onClose: () => void;
  onSave: () => void;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const QuickRateMode = ({
  matchId,
  matchDate,
  matchName,
  players,
  onClose,
  onSave,
}: QuickRateModeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedPlayers, setSavedPlayers] = useState<Set<string>>(new Set());

  // Filter to only starters for quick rating
  const starterPlayers = players.filter((p) => p.is_starter);
  const currentPlayer = starterPlayers[currentIndex];

  // Initialize ratings from existing data
  useEffect(() => {
    const initialRatings: Record<string, number> = {};
    starterPlayers.forEach((p) => {
      if (p.rating) {
        initialRatings[p.id] = p.rating;
      }
    });
    setRatings(initialRatings);
  }, [players]);

  const handleRatingTap = (rating: number) => {
    if (!currentPlayer) return;
    setRatings((prev) => ({ ...prev, [currentPlayer.id]: rating }));
  };

  const handleNotesChange = (value: string) => {
    if (!currentPlayer) return;
    setNotes((prev) => ({ ...prev, [currentPlayer.id]: value }));
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < starterPlayers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSaveCurrentPlayer = async () => {
    if (!currentPlayer) return;
    
    const rating = ratings[currentPlayer.id];
    if (!rating) {
      toast.error("Please select a rating first");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const playerNotes = notes[currentPlayer.id] || "";
      const fullNotes = `${playerNotes}\n\nRating: ${rating}/10`.trim();

      if (currentPlayer.observation_id) {
        // Update existing observation
        const { error } = await supabase
          .from("observations")
          .update({ notes: fullNotes })
          .eq("id", currentPlayer.observation_id);
        if (error) throw error;
      } else {
        // Create new observation
        const { data: observation, error: obsError } = await supabase
          .from("observations")
          .insert([{
            player_id: null,
            match_id: matchId,
            date: matchDate,
            location: matchName,
            notes: fullNotes,
          }])
          .select()
          .single();

        if (obsError) throw obsError;

        // Link to match player
        const { error: updateError } = await supabase
          .from("match_players")
          .update({ observation_id: observation.id })
          .eq("id", currentPlayer.id);

        if (updateError) throw updateError;
      }

      setSavedPlayers((prev) => new Set([...prev, currentPlayer.id]));
      toast.success(`${currentPlayer.name} rated`);

      // Auto-advance to next player
      if (currentIndex < starterPlayers.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Failed to save rating");
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    onSave();
    onClose();
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return "bg-green-500 text-white";
    if (rating >= 6) return "bg-yellow-500 text-white";
    if (rating >= 4) return "bg-orange-500 text-white";
    return "bg-red-500 text-white";
  };

  const getTeamColor = (team: "home" | "away") => {
    return team === "home" ? "text-primary" : "text-secondary-foreground";
  };

  if (starterPlayers.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">No starting players to rate</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  const progress = (savedPlayers.size / starterPlayers.length) * 100;
  const currentRating = currentPlayer ? ratings[currentPlayer.id] : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <h2 className="font-semibold">Quick Rate Mode</h2>
          <p className="text-xs text-muted-foreground">
            {savedPlayers.size} of {starterPlayers.length} rated
          </p>
        </div>
        <Button variant="default" size="sm" onClick={handleFinish}>
          Done
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Player Card */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <Card className="flex-1 flex flex-col p-6">
          {/* Player Info */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">{currentPlayer?.shirt_number || "-"}</span>
              <span className={cn("text-sm font-medium", getTeamColor(currentPlayer?.team || "home"))}>
                {currentPlayer?.team === "home" ? "HOME" : "AWAY"}
              </span>
            </div>
            <h3 className="text-xl font-semibold">{currentPlayer?.name}</h3>
            <p className="text-muted-foreground">{currentPlayer?.position || "Unknown position"}</p>
            {savedPlayers.has(currentPlayer?.id || "") && (
              <div className="flex items-center justify-center gap-1 mt-2 text-green-500">
                <Check className="h-4 w-4" />
                <span className="text-sm">Saved</span>
              </div>
            )}
          </div>

          {/* Rating Grid */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground text-center mb-3">Tap to rate</p>
            <div className="grid grid-cols-5 gap-2">
              {RATING_OPTIONS.map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingTap(rating)}
                  className={cn(
                    "aspect-square rounded-lg text-lg font-bold transition-all duration-150 active:scale-95",
                    currentRating === rating
                      ? getRatingColor(rating) + " ring-2 ring-offset-2 ring-primary"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Notes */}
          <div className="flex-1 min-h-0">
            <textarea
              placeholder="Quick notes (optional)..."
              value={notes[currentPlayer?.id || ""] || ""}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="w-full h-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* Save Button */}
          <Button
            className="w-full mt-4"
            size="lg"
            onClick={handleSaveCurrentPlayer}
            disabled={saving || !currentRating}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save & Next"}
          </Button>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/50">
        <Button
          variant="outline"
          size="lg"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="w-24"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Prev
        </Button>

        <div className="flex items-center gap-1">
          {starterPlayers.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === currentIndex
                  ? "bg-primary w-4"
                  : savedPlayers.has(starterPlayers[i].id)
                  ? "bg-green-500"
                  : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={handleNext}
          disabled={currentIndex === starterPlayers.length - 1}
          className="w-24"
        >
          Next
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default QuickRateMode;

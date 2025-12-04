import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Check } from "lucide-react";

interface Player {
  id: string;
  name: string;
  position: string | null;
  photo_url: string | null;
}

interface PlayerSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: Player[];
  selectedIds: string[];
  onSelect: (playerId: string) => void;
}

const PlayerSearchDialog = ({
  open,
  onOpenChange,
  players,
  selectedIds,
  onSelect,
}: PlayerSearchDialogProps) => {
  const [search, setSearch] = useState("");

  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.position?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (playerId: string) => {
    onSelect(playerId);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Player</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <ScrollArea className="h-[400px] -mx-2 px-2">
          <div className="space-y-1">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No players found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const isSelected = selectedIds.includes(player.id);
                const initials = player.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <button
                    key={player.id}
                    onClick={() => handleSelect(player.id)}
                    disabled={isSelected}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                      isSelected
                        ? "bg-primary/10 cursor-not-allowed opacity-60"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={player.photo_url || ""} alt={player.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{player.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.position || "No position"}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerSearchDialog;

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ListPlus, GitCompare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onAddToShortlist: () => void;
  onCompare: () => void;
  onDelete: () => void;
  maxCompare?: number;
}

const BulkActionsBar = ({
  selectedCount,
  onClearSelection,
  onAddToShortlist,
  onCompare,
  onDelete,
  maxCompare = 3,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 left-0 right-0 z-40 px-4 pb-2",
        "animate-in slide-in-from-bottom-4 duration-300"
      )}
    >
      <div className="max-w-lg mx-auto bg-card border border-border rounded-xl shadow-lg p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="px-2 py-1">
              {selectedCount} selected
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddToShortlist}
              className="gap-1.5"
            >
              <ListPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Shortlist</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onCompare}
              disabled={selectedCount < 2 || selectedCount > maxCompare}
              className="gap-1.5"
              title={
                selectedCount < 2
                  ? "Select at least 2 players"
                  : selectedCount > maxCompare
                  ? `Maximum ${maxCompare} players for comparison`
                  : "Compare selected players"
              }
            >
              <GitCompare className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;

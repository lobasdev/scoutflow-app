import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface TeamMember {
  user_id: string;
  name: string;
  email: string;
}

interface TeamPlayer {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
}

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: TeamMember[];
  players: TeamPlayer[];
  onSubmit: (data: {
    title: string;
    description?: string;
    assigned_to: string;
    team_player_id?: string;
    focus_areas?: string[];
    priority?: string;
    due_date?: string;
  }) => void;
  isPending?: boolean;
}

const CreateAssignmentDialog = ({
  open, onOpenChange, members, players, onSubmit, isPending
}: CreateAssignmentDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!title.trim() || !assignedTo) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      assigned_to: assignedTo,
      team_player_id: playerId || undefined,
      focus_areas: focusAreas.length > 0 ? focusAreas : undefined,
      priority,
      due_date: dueDate || undefined,
    });
    // Reset
    setTitle(""); setDescription(""); setAssignedTo(""); setPlayerId("");
    setPriority("medium"); setDueDate(""); setFocusAreas([]); setFocusArea("");
  };

  const addFocusArea = () => {
    if (focusArea.trim() && !focusAreas.includes(focusArea.trim())) {
      setFocusAreas([...focusAreas, focusArea.trim()]);
      setFocusArea("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Scouting Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Watch Pedri at Barcelona vs Real Madrid"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label>Assign to *</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select scout" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.name} ({m.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Linked Player (optional)</Label>
            <Select value={playerId} onValueChange={setPlayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No player</SelectItem>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.position ? `(${p.position})` : ""} {p.team ? `— ${p.team}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="Detailed instructions for the scout..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Focus Areas</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Defensive positioning"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFocusArea(); } }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addFocusArea}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {focusAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="gap-1 text-xs">
                    {area}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFocusAreas(focusAreas.filter(a => a !== area))}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="due">Due Date</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!title.trim() || !assignedTo || isPending}>
            {isPending ? "Creating..." : "Create Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssignmentDialog;

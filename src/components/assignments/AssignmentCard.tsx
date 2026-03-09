import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Calendar, Target, MessageSquare, Trash2, ChevronRight } from "lucide-react";
import ChiefScoutFeedback from "@/components/feedback/ChiefScoutFeedback";
import type { ScoutingAssignment } from "@/hooks/useAssignments";

interface AssignmentCardProps {
  assignment: ScoutingAssignment;
  scoutName?: string;
  playerName?: string;
  isChiefScout: boolean;
  isMyAssignment: boolean;
  onUpdateStatus: (id: string, status: string) => void;
  onAddFeedback: (id: string, feedback: string, status?: string) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  assigned: "bg-blue-500/10 text-blue-700 border-blue-200",
  in_progress: "bg-amber-500/10 text-amber-700 border-amber-200",
  submitted: "bg-purple-500/10 text-purple-700 border-purple-200",
  reviewed: "bg-green-500/10 text-green-700 border-green-200",
};

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  submitted: "Submitted",
  reviewed: "Reviewed",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/10 text-amber-700",
  high: "bg-red-500/10 text-red-700",
};

const AssignmentCard = ({
  assignment, scoutName, playerName, isChiefScout, isMyAssignment,
  onUpdateStatus, onAddFeedback, onDelete,
}: AssignmentCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState(assignment.feedback || "");

  const nextStatus = (): string | null => {
    if (isMyAssignment) {
      if (assignment.status === "assigned") return "in_progress";
      if (assignment.status === "in_progress") return "submitted";
    }
    return null;
  };

  const next = nextStatus();

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-left w-full"
              >
                <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
                <h3 className="font-medium text-sm truncate">{assignment.title}</h3>
              </button>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className={`text-[10px] ${priorityColors[assignment.priority]}`}>
                {assignment.priority}
              </Badge>
              <Badge variant="outline" className={`text-[10px] ${statusColors[assignment.status]}`}>
                {statusLabels[assignment.status] || assignment.status}
              </Badge>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {scoutName || "Scout"}
            </span>
            {playerName && (
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {playerName}
              </span>
            )}
            {assignment.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(assignment.due_date).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Focus areas */}
          {assignment.focus_areas?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {assignment.focus_areas.map((area) => (
                <Badge key={area} variant="secondary" className="text-[10px]">
                  {area}
                </Badge>
              ))}
            </div>
          )}

          {/* Expanded content */}
          {expanded && (
            <div className="space-y-3 pt-2 border-t">
              {assignment.description && (
                <p className="text-sm text-muted-foreground">{assignment.description}</p>
              )}

              {assignment.feedback && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-medium mb-1 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Legacy Feedback
                  </p>
                  <p className="text-sm text-muted-foreground">{assignment.feedback}</p>
                </div>
              )}

              {/* Threaded CS Feedback */}
              <ChiefScoutFeedback
                feedbackType="assignment"
                referenceId={assignment.id}
                targetScoutId={assignment.assigned_to}
                entityName={assignment.title}
              />

              <div className="flex items-center gap-2">
                {next && (
                  <Button size="sm" variant="outline" onClick={() => onUpdateStatus(assignment.id, next)}>
                    Mark as {statusLabels[next]}
                  </Button>
                )}
                {isChiefScout && assignment.status === "submitted" && (
                  <Button size="sm" onClick={() => setFeedbackOpen(true)}>
                    Review & Feedback
                  </Button>
                )}
                {isChiefScout && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive ml-auto"
                    onClick={() => onDelete(assignment.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review: {assignment.title}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Write feedback for the scout..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onAddFeedback(assignment.id, feedbackText);
                setFeedbackOpen(false);
              }}
            >
              Save Feedback
            </Button>
            <Button
              onClick={() => {
                onAddFeedback(assignment.id, feedbackText, "reviewed");
                setFeedbackOpen(false);
              }}
            >
              Mark as Reviewed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AssignmentCard;

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Crown, Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ChiefScoutFeedbackProps {
  /** The type: observation, assignment, task, general */
  feedbackType: "observation" | "assignment" | "task" | "general";
  /** The ID of the entity being given feedback on */
  referenceId: string;
  /** The scout who should see this feedback */
  targetScoutId: string;
  /** Optional: entity name for activity logging */
  entityName?: string;
}

const ChiefScoutFeedback = ({ feedbackType, referenceId, targetScoutId, entityName }: ChiefScoutFeedbackProps) => {
  const { user } = useAuth();
  const { team, isChiefScout } = useTeam();
  const queryClient = useQueryClient();
  const [feedbackText, setFeedbackText] = useState("");
  const [showInput, setShowInput] = useState(false);

  const { data: feedback = [] } = useQuery({
    queryKey: ["cs-feedback", feedbackType, referenceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chief_scout_feedback" as any)
        .select("*")
        .eq("feedback_type", feedbackType)
        .eq("reference_id", referenceId)
        .order("created_at", { ascending: true });
      return (data as any[]) || [];
    },
    enabled: !!referenceId,
  });

  // Mark as read when scout views
  const unreadCount = feedback.filter((f: any) => !f.is_read && f.target_scout_id === user?.id).length;
  
  const markAsRead = async () => {
    if (unreadCount === 0 || !user) return;
    const unreadIds = feedback
      .filter((f: any) => !f.is_read && f.target_scout_id === user.id)
      .map((f: any) => f.id);
    if (unreadIds.length > 0) {
      await supabase
        .from("chief_scout_feedback" as any)
        .update({ is_read: true } as any)
        .in("id", unreadIds);
      queryClient.invalidateQueries({ queryKey: ["cs-feedback", feedbackType, referenceId] });
      queryClient.invalidateQueries({ queryKey: ["unread-feedback-count"] });
    }
  };

  // Auto-mark as read on mount if target scout
  useState(() => {
    markAsRead();
  });

  const handleSubmit = async () => {
    if (!user || !team || !feedbackText.trim()) return;
    try {
      const { error } = await supabase.from("chief_scout_feedback" as any).insert({
        team_id: team.id,
        author_id: user.id,
        target_scout_id: targetScoutId,
        feedback_type: feedbackType,
        reference_id: referenceId,
        comment: feedbackText.trim(),
      } as any);
      if (error) throw error;

      // Log activity
      await supabase.from("team_activity_log" as any).insert({
        team_id: team.id,
        actor_id: user.id,
        action: "feedback_added",
        entity_type: feedbackType,
        entity_id: referenceId,
        entity_name: entityName || feedbackType,
        metadata: { feedback_type: feedbackType },
      } as any);

      queryClient.invalidateQueries({ queryKey: ["cs-feedback", feedbackType, referenceId] });
      queryClient.invalidateQueries({ queryKey: ["unread-feedback-count"] });
      setFeedbackText("");
      setShowInput(false);
      toast.success("Feedback sent");
    } catch {
      toast.error("Failed to send feedback");
    }
  };

  const canSee = isChiefScout || feedback.some((f: any) => f.target_scout_id === user?.id);
  if (!canSee && feedback.length === 0 && !isChiefScout) return null;

  return (
    <div className="space-y-2">
      {feedback.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Feedback
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-4 min-w-[16px] text-[9px] px-1 ml-1">{unreadCount}</Badge>
            )}
          </p>
          {feedback.map((fb: any) => (
            <div key={fb.id} className="pl-3 border-l-2 border-primary/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Crown className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium text-primary">Chief Scout</span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(fb.created_at), "MMM d, HH:mm")}
                </span>
                {!fb.is_read && fb.target_scout_id === user?.id && (
                  <Badge variant="destructive" className="h-3.5 text-[8px] px-1">New</Badge>
                )}
              </div>
              <p className="text-xs">{fb.comment}</p>
            </div>
          ))}
        </div>
      )}

      {isChiefScout && (
        <>
          {showInput ? (
            <div className="flex gap-2">
              <Input
                placeholder="Add feedback..."
                className="text-xs h-8"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                  if (e.key === "Escape") {
                    setShowInput(false);
                    setFeedbackText("");
                  }
                }}
              />
              <Button size="sm" className="h-8 px-3" onClick={handleSubmit} disabled={!feedbackText.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7 gap-1"
              onClick={() => setShowInput(true)}
            >
              <Crown className="h-3 w-3" />
              Add Feedback
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default ChiefScoutFeedback;

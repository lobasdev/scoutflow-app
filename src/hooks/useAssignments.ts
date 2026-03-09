import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import { toast } from "sonner";

export interface ScoutingAssignment {
  id: string;
  team_id: string;
  assigned_to: string;
  assigned_by: string;
  team_player_id: string | null;
  title: string;
  description: string | null;
  focus_areas: string[];
  status: string;
  priority: string;
  due_date: string | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export type AssignmentStatus = "assigned" | "in_progress" | "submitted" | "reviewed";
export type AssignmentPriority = "low" | "medium" | "high";

export function useAssignments() {
  const { user } = useAuth();
  const { team } = useTeam();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["scouting-assignments", team?.id],
    queryFn: async () => {
      if (!team?.id) return [];
      const { data, error } = await supabase
        .from("scouting_assignments")
        .select("*")
        .eq("team_id", team.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ScoutingAssignment[];
    },
    enabled: !!team?.id,
  });

  const createAssignment = useMutation({
    mutationFn: async (assignment: {
      title: string;
      description?: string;
      assigned_to: string;
      team_player_id?: string;
      focus_areas?: string[];
      priority?: string;
      due_date?: string;
    }) => {
      if (!team?.id || !user?.id) throw new Error("No team or user");
      const { error } = await supabase.from("scouting_assignments").insert({
        team_id: team.id,
        assigned_by: user.id,
        assigned_to: assignment.assigned_to,
        title: assignment.title,
        description: assignment.description || null,
        team_player_id: assignment.team_player_id || null,
        focus_areas: assignment.focus_areas || [],
        priority: assignment.priority || "medium",
        due_date: assignment.due_date || null,
      });
      if (error) throw error;

      // Also create a scout_task for the assigned scout
      await supabase.from("scout_tasks").insert({
        scout_id: assignment.assigned_to,
        title: `📋 ${assignment.title}`,
        description: assignment.description || `Assignment: ${assignment.title}`,
        status: "todo",
        priority: assignment.priority || "medium",
        due_date: assignment.due_date || null,
        assigned_by: user.id,
        assigned_to: assignment.assigned_to,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scouting-assignments"] });
      toast.success("Assignment created");
    },
    onError: () => toast.error("Failed to create assignment"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("scouting_assignments")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      // Sync with scout_tasks for the assigned scout
      if (user?.id) {
        const assignment = assignments.find(a => a.id === id);
        if (assignment) {
          const taskStatus = status === "reviewed" ? "done" : status === "in_progress" ? "in_progress" : "todo";
          const taskTitle = `📋 ${assignment.title}`;
          
          // Check if a linked task already exists
          const { data: existingTask } = await supabase
            .from("scout_tasks")
            .select("id")
            .eq("scout_id", assignment.assigned_to)
            .eq("title", taskTitle)
            .maybeSingle();

          if (existingTask) {
            await supabase
              .from("scout_tasks")
              .update({ status: taskStatus, updated_at: new Date().toISOString() })
              .eq("id", existingTask.id);
          } else {
            await supabase
              .from("scout_tasks")
              .insert({
                scout_id: assignment.assigned_to,
                title: taskTitle,
                description: assignment.description || `Assignment: ${assignment.title}`,
                status: taskStatus,
                priority: assignment.priority,
                due_date: assignment.due_date,
                assigned_by: assignment.assigned_by,
                assigned_to: assignment.assigned_to,
              });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scouting-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["scout-tasks"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const addFeedback = useMutation({
    mutationFn: async ({ id, feedback, status }: { id: string; feedback: string; status?: string }) => {
      const update: any = { feedback, updated_at: new Date().toISOString() };
      if (status) update.status = status;
      const { error } = await supabase
        .from("scouting_assignments")
        .update(update)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scouting-assignments"] });
      toast.success("Feedback saved");
    },
    onError: () => toast.error("Failed to save feedback"),
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scouting_assignments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scouting-assignments"] });
      toast.success("Assignment deleted");
    },
    onError: () => toast.error("Failed to delete assignment"),
  });

  const myAssignments = assignments.filter(a => a.assigned_to === user?.id);
  const assignedByMe = assignments.filter(a => a.assigned_by === user?.id);

  return {
    assignments,
    myAssignments,
    assignedByMe,
    isLoading,
    createAssignment,
    updateStatus,
    addFeedback,
    deleteAssignment,
  };
}

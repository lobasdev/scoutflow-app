import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GripVertical, Trash2, Calendar, User, Trophy, Swords, Flag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  player_id: string | null;
  match_id: string | null;
  tournament_id: string | null;
  display_order: number;
  created_at: string;
  // joined names
  player_name?: string;
  match_name?: string;
  tournament_name?: string;
}

const COLUMNS = [
  { key: "todo", label: "To Do", color: "bg-muted" },
  { key: "in_progress", label: "In Progress", color: "bg-primary/10" },
  { key: "done", label: "Done", color: "bg-green-500/10" },
];

const priorityColors: Record<string, string> = {
  high: "text-red-500 border-red-500/30",
  medium: "text-amber-500 border-amber-500/30",
  low: "text-blue-500 border-blue-500/30",
};

const Tasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    player_id: "",
    match_id: "",
    tournament_id: "",
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["scout-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scout_tasks")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });

  // Fetch linked entities for display
  const { data: players = [] } = useQuery({
    queryKey: ["task-players"],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("id, name").order("name");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["task-matches"],
    queryFn: async () => {
      const { data } = await supabase.from("matches").select("id, name").order("date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ["task-tournaments"],
    queryFn: async () => {
      const { data } = await supabase.from("tournaments").select("id, name").order("start_date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const handleAddTask = async () => {
    if (!user || !form.title.trim()) return;
    try {
      const { error } = await supabase.from("scout_tasks").insert({
        scout_id: user.id,
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        due_date: form.due_date || null,
        player_id: form.player_id || null,
        match_id: form.match_id || null,
        tournament_id: form.tournament_id || null,
        status: "todo",
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["scout-tasks"] });
      setDialogOpen(false);
      setForm({ title: "", description: "", priority: "medium", due_date: "", player_id: "", match_id: "", tournament_id: "" });
      toast.success("Task created");
    } catch {
      toast.error("Failed to create task");
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("scout_tasks").update({ status: newStatus }).eq("id", taskId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["scout-tasks"] });
    } catch {
      toast.error("Failed to move task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("scout_tasks").delete().eq("id", taskId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["scout-tasks"] });
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const getLinkedName = (task: Task) => {
    if (task.player_id) return players.find((p) => p.id === task.player_id)?.name;
    if (task.match_id) return matches.find((m) => m.id === task.match_id)?.name;
    if (task.tournament_id) return tournaments.find((t) => t.id === task.tournament_id)?.name;
    return null;
  };

  const getLinkedIcon = (task: Task) => {
    if (task.player_id) return <User className="h-3 w-3" />;
    if (task.match_id) return <Swords className="h-3 w-3" />;
    if (task.tournament_id) return <Trophy className="h-3 w-3" />;
    return null;
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Tasks"
        actions={
          <Button variant="ghost" size="icon" onClick={() => setDialogOpen(true)} className="text-primary-foreground hover:bg-primary-foreground/10">
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <main className="px-4 py-6 space-y-4">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.key);
          return (
            <Card key={col.key} className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.key === "todo" ? "bg-muted-foreground" : col.key === "in_progress" ? "bg-primary" : "bg-green-500"}`} />
                  {col.label}
                  <Badge variant="secondary" className="text-xs ml-auto">{columnTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[60px]">
                {columnTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                )}
                {columnTasks.map((task) => (
                  <div key={task.id} className={`p-3 rounded-lg border ${col.color} space-y-2`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.priority && (
                        <Badge variant="outline" className={`text-xs ${priorityColors[task.priority] || ""}`}>
                          <Flag className="h-2.5 w-2.5 mr-1" />{task.priority}
                        </Badge>
                      )}
                      {task.due_date && (
                        <Badge variant="outline" className={`text-xs ${isOverdue(task.due_date) && task.status !== "done" ? "text-red-500 border-red-500/30" : ""}`}>
                          <Calendar className="h-2.5 w-2.5 mr-1" />
                          {format(new Date(task.due_date), "MMM d")}
                        </Badge>
                      )}
                      {getLinkedName(task) && (
                        <Badge variant="outline" className="text-xs">
                          {getLinkedIcon(task)}
                          <span className="ml-1 truncate max-w-[100px]">{getLinkedName(task)}</span>
                        </Badge>
                      )}
                    </div>
                    {/* Move buttons */}
                    <div className="flex gap-1">
                      {col.key !== "todo" && (
                        <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={() => handleMoveTask(task.id, col.key === "done" ? "in_progress" : "todo")}>
                          ← {col.key === "done" ? "In Progress" : "To Do"}
                        </Button>
                      )}
                      {col.key !== "done" && (
                        <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={() => handleMoveTask(task.id, col.key === "todo" ? "in_progress" : "done")}>
                          {col.key === "todo" ? "In Progress" : "Done"} →
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </main>

      {/* Add Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <Select value={form.player_id || "none"} onValueChange={(v) => setForm({ ...form, player_id: v === "none" ? "" : v, match_id: "", tournament_id: "" })}>
              <SelectTrigger><SelectValue placeholder="Link to player (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {players.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.match_id || "none"} onValueChange={(v) => setForm({ ...form, match_id: v === "none" ? "" : v, player_id: "", tournament_id: "" })}>
              <SelectTrigger><SelectValue placeholder="Link to match (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {matches.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.tournament_id || "none"} onValueChange={(v) => setForm({ ...form, tournament_id: v === "none" ? "" : v, player_id: "", match_id: "" })}>
              <SelectTrigger><SelectValue placeholder="Link to tournament (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {tournaments.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTask} disabled={!form.title.trim()}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;

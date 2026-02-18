import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calendar, User, Trophy, Swords, Flag, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
}

const COLUMNS = [
  { key: "todo", label: "To Do", dot: "bg-muted-foreground" },
  { key: "in_progress", label: "In Progress", dot: "bg-primary" },
  { key: "done", label: "Done", dot: "bg-green-500" },
];

const priorityConfig: Record<string, { color: string; bg: string }> = {
  high: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  low: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
};

// Droppable column wrapper
function DroppableColumn({ id, children, label, dot, count }: { id: string; children: React.ReactNode; label: string; dot: string; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <Badge variant="secondary" className="text-xs ml-auto">{count}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[120px] p-2 rounded-xl border-2 border-dashed transition-colors ${
          isOver ? "border-primary/50 bg-primary/5" : "border-transparent"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// Sortable task card
function TaskCard({
  task,
  onDelete,
  linkedName,
  linkedIcon,
  isOverdue,
  isDragging,
}: {
  task: Task;
  onDelete: (id: string) => void;
  linkedName: string | null;
  linkedIcon: React.ReactNode;
  isOverdue: boolean;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const priority = task.priority || "medium";
  const pConfig = priorityConfig[priority] || priorityConfig.medium;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow space-y-2 ${
        isDragging ? "shadow-xl ring-2 ring-primary/30" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap pl-6">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${pConfig.bg} ${pConfig.color} border`}>
          <Flag className="h-2.5 w-2.5 mr-0.5" />{priority}
        </Badge>
        {task.due_date && (
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isOverdue && task.status !== "done" ? "bg-red-500/10 text-red-400 border-red-500/20" : ""}`}>
            <Calendar className="h-2.5 w-2.5 mr-0.5" />
            {format(new Date(task.due_date), "MMM d")}
          </Badge>
        )}
        {linkedName && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {linkedIcon}
            <span className="ml-0.5 truncate max-w-[80px]">{linkedName}</span>
          </Badge>
        )}
      </div>
    </div>
  );
}

const Tasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    player_id: "",
    match_id: "",
    tournament_id: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const { data: tasks = [] } = useQuery({
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
    if (task.player_id) return players.find((p) => p.id === task.player_id)?.name || null;
    if (task.match_id) return matches.find((m) => m.id === task.match_id)?.name || null;
    if (task.tournament_id) return tournaments.find((t) => t.id === task.tournament_id)?.name || null;
    return null;
  };

  const getLinkedIcon = (task: Task) => {
    if (task.player_id) return <User className="h-2.5 w-2.5" />;
    if (task.match_id) return <Swords className="h-2.5 w-2.5" />;
    if (task.tournament_id) return <Trophy className="h-2.5 w-2.5" />;
    return null;
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = COLUMNS.find((c) => c.key === overId);
    if (targetColumn) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetColumn.key) {
        try {
          await supabase.from("scout_tasks").update({ status: targetColumn.key }).eq("id", taskId);
          queryClient.invalidateQueries({ queryKey: ["scout-tasks"] });
        } catch {
          toast.error("Failed to move task");
        }
      }
      return;
    }

    // Dropped on another task - move to that task's column
    const targetTask = tasks.find((t) => t.id === overId);
    const sourceTask = tasks.find((t) => t.id === taskId);
    if (targetTask && sourceTask && sourceTask.status !== targetTask.status) {
      try {
        await supabase.from("scout_tasks").update({ status: targetTask.status }).eq("id", taskId);
        queryClient.invalidateQueries({ queryKey: ["scout-tasks"] });
      } catch {
        toast.error("Failed to move task");
      }
    }
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

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

      <main className="px-4 py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-row gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
              const columnTasks = tasks.filter((t) => t.status === col.key);
              return (
                <DroppableColumn
                  key={col.key}
                  id={col.key}
                  label={col.label}
                  dot={col.dot}
                  count={columnTasks.length}
                >
                  <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {columnTasks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        Drag tasks here
                      </p>
                    )}
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onDelete={handleDeleteTask}
                        linkedName={getLinkedName(task)}
                        linkedIcon={getLinkedIcon(task)}
                        isOverdue={isOverdue(task.due_date)}
                      />
                    ))}
                  </SortableContext>
                </DroppableColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                onDelete={() => {}}
                linkedName={getLinkedName(activeTask)}
                linkedIcon={getLinkedIcon(activeTask)}
                isOverdue={isOverdue(activeTask.due_date)}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
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

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Link to (optional)</p>
              <Select value={form.player_id || "none"} onValueChange={(v) => setForm({ ...form, player_id: v === "none" ? "" : v, match_id: "", tournament_id: "" })}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Player" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No player</SelectItem>
                  {players.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.match_id || "none"} onValueChange={(v) => setForm({ ...form, match_id: v === "none" ? "" : v, player_id: "", tournament_id: "" })}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Match" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No match</SelectItem>
                  {matches.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.tournament_id || "none"} onValueChange={(v) => setForm({ ...form, tournament_id: v === "none" ? "" : v, player_id: "", match_id: "" })}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Tournament" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No tournament</SelectItem>
                  {tournaments.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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

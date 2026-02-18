import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Target, Flame, Trophy, ChevronRight, CheckSquare } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

const TodaysFocus = () => {
  const navigate = useNavigate();

  // Calculate scout streak (consecutive days with activity)
  const { data: streakData } = useQuery({
    queryKey: ["scout-streak"],
    queryFn: async () => {
      // Get all player creation dates and observation dates
      const [playersRes, observationsRes] = await Promise.all([
        supabase.from("players").select("created_at"),
        supabase.from("observations").select("created_at"),
      ]);

      const allDates = [
        ...(playersRes.data?.map(p => new Date(p.created_at)) || []),
        ...(observationsRes.data?.map(o => new Date(o.created_at)) || []),
      ];

      if (allDates.length === 0) return { streak: 0, activeToday: false };

      // Calculate streak
      let streak = 0;
      const today = startOfDay(new Date());
      let checkDate = today;
      let activeToday = false;

      // Check if active today
      activeToday = allDates.some(date => 
        startOfDay(date).getTime() === today.getTime()
      );

      // Count consecutive days backwards
      while (true) {
        const hasActivity = allDates.some(date => 
          startOfDay(date).getTime() === checkDate.getTime()
        );
        
        if (hasActivity) {
          streak++;
          checkDate = subDays(checkDate, 1);
        } else if (checkDate.getTime() === today.getTime()) {
          // Today hasn't had activity yet, check yesterday
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      return { streak, activeToday };
    },
  });

  // Fetch pending tasks count
  const { data: pendingTasks } = useQuery({
    queryKey: ["pending-tasks-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scout_tasks")
        .select("id, title, priority, due_date")
        .in("status", ["todo", "in_progress"])
        .order("due_date", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });

  // Get today's priority item
  const { data: priorityItem } = useQuery({
    queryKey: ["today-priority"],
    queryFn: async () => {
      // Check inbox first
      const { count: inboxCount } = await supabase
        .from("inbox_players")
        .select("id", { count: "exact", head: true });

      if (inboxCount && inboxCount > 0) {
        return {
          type: "inbox",
          label: `${inboxCount} player${inboxCount > 1 ? "s" : ""} in inbox`,
          action: "Review inbox",
          route: "/inbox",
          priority: "high",
        };
      }

      // Check players missing recommendations
      const { count: noRecCount } = await supabase
        .from("players")
        .select("id", { count: "exact", head: true })
        .or("recommendation.is.null,recommendation.eq.");

      if (noRecCount && noRecCount > 0) {
        return {
          type: "recommendation",
          label: `${noRecCount} player${noRecCount > 1 ? "s" : ""} need recommendations`,
          action: "Add recommendations",
          route: "/players",
          priority: "medium",
        };
      }

      // Check for upcoming matches (within 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data: upcomingMatches } = await supabase
        .from("matches")
        .select("id, name, date")
        .gte("date", format(today, "yyyy-MM-dd"))
        .lte("date", format(nextWeek, "yyyy-MM-dd"))
        .order("date", { ascending: true })
        .limit(1);

      if (upcomingMatches && upcomingMatches.length > 0) {
        return {
          type: "match",
          label: `Match coming up: ${upcomingMatches[0].name}`,
          action: "View match",
          route: `/matches/${upcomingMatches[0].id}`,
          priority: "low",
        };
      }

      return null;
    },
  });

  const streak = streakData?.streak || 0;
  const activeToday = streakData?.activeToday || false;

  return (
    <Card className="border-border overflow-hidden">
      <CardContent className="p-0">
        {/* Streak Banner */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${streak > 0 ? "bg-amber-500/20" : "bg-muted"}`}>
              <Flame className={`h-5 w-5 ${streak > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {streak > 0 ? `${streak} day streak!` : "Start your streak"}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeToday 
                  ? "You've logged activity today" 
                  : "Add a player or observation to keep it going"}
              </p>
            </div>
          </div>
          {streak >= 7 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-500">
              <Trophy className="h-3 w-3" />
              <span className="text-xs font-medium">On fire!</span>
            </div>
          )}
        </div>

        {/* Today's Focus */}
        {priorityItem && (
          <div 
            className="p-4 border-t border-border hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate(priorityItem.route)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  priorityItem.priority === "high" 
                    ? "bg-red-500/10" 
                    : priorityItem.priority === "medium"
                    ? "bg-amber-500/10"
                    : "bg-blue-500/10"
                }`}>
                  <Target className={`h-4 w-4 ${
                    priorityItem.priority === "high"
                      ? "text-red-500"
                      : priorityItem.priority === "medium"
                      ? "text-amber-500"
                      : "text-blue-500"
                  }`} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Today's Focus
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {priorityItem.label}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                {priorityItem.action}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {!priorityItem && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-500/10">
                <Trophy className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  All Caught Up
                </p>
                <p className="text-sm text-foreground mt-0.5">
                  No urgent tasks - great job!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Tasks */}
        {pendingTasks && pendingTasks.length > 0 && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Open Tasks</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate("/tasks")}>
                View all <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm" onClick={() => navigate("/tasks")}>
                  <div className={`w-1.5 h-1.5 rounded-full ${task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-amber-500" : "bg-blue-500"}`} />
                  <span className="truncate cursor-pointer hover:text-primary transition-colors">{task.title}</span>
                  {task.due_date && (
                    <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                      {format(new Date(task.due_date), "MMM d")}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysFocus;

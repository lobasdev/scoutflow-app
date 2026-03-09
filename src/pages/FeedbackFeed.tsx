import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, MessageSquare, ClipboardList, CheckSquare, User, Bell } from "lucide-react";
import { format } from "date-fns";

const FeedbackFeed = () => {
  const { user } = useAuth();
  const { team } = useTeam();
  const navigate = useNavigate();

  const { data: feedbackItems = [], isLoading } = useQuery({
    queryKey: ["all-my-feedback", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("chief_scout_feedback" as any)
        .select("*")
        .eq("target_scout_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return [];
      return (data as any[]) || [];
    },
    enabled: !!user && !!team,
  });

  // Fetch CS profile
  const { data: authorProfiles = [] } = useQuery({
    queryKey: ["feedback-authors", team?.id],
    queryFn: async () => {
      const authorIds = [...new Set(feedbackItems.map((f: any) => f.author_id))];
      if (authorIds.length === 0) return [];
      const { data } = await supabase.from("scouts").select("id, name").in("id", authorIds);
      return data || [];
    },
    enabled: feedbackItems.length > 0,
  });

  // Mark all as read
  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = feedbackItems.filter((f: any) => !f.is_read).map((f: any) => f.id);
    if (unreadIds.length > 0) {
      await supabase
        .from("chief_scout_feedback" as any)
        .update({ is_read: true } as any)
        .in("id", unreadIds);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "observation": return <MessageSquare className="h-4 w-4" />;
      case "assignment": return <ClipboardList className="h-4 w-4" />;
      case "task": return <CheckSquare className="h-4 w-4" />;
      case "general": return <User className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypLabel = (type: string) => {
    switch (type) {
      case "observation": return "Observation";
      case "assignment": return "Assignment";
      case "task": return "Task";
      case "general": return "General";
      default: return type;
    }
  };

  const unreadCount = feedbackItems.filter((f: any) => !f.is_read).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Feedback"
        actions={
          unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="text-primary-foreground hover:bg-primary-foreground/10 text-xs"
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <main className="px-4 py-6 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : feedbackItems.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground text-sm">No feedback yet</p>
          </div>
        ) : (
          feedbackItems.map((item: any) => {
            const author = authorProfiles.find(a => a.id === item.author_id);
            return (
              <Card
                key={item.id}
                className={`transition-colors ${!item.is_read ? "border-primary/30 bg-primary/5" : ""}`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium">{author?.name || "Chief Scout"}</span>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        {getIcon(item.feedback_type)}
                        {getTypLabel(item.feedback_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {!item.is_read && (
                        <Badge variant="destructive" className="h-4 text-[9px] px-1">New</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(item.created_at), "MMM d, HH:mm")}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm">{item.comment}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
};

export default FeedbackFeed;

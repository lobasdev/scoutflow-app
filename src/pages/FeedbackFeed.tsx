import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/hooks/useTeam";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, MessageSquare, ClipboardList, CheckSquare, User, Bell, Send } from "lucide-react";
import { format } from "date-fns";

const FeedbackFeed = () => {
  const { user } = useAuth();
  const { team, members, isChiefScout } = useTeam();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"received" | "sent">("received");
  const [noteTarget, setNoteTarget] = useState("");
  const [noteText, setNoteText] = useState("");
  const [sending, setSending] = useState(false);
  const showSent = isChiefScout && view === "sent";

  const { data: memberProfiles = [] } = useQuery({
    queryKey: ["feedback-member-profiles", team?.id, members.length],
    queryFn: async () => {
      const ids = members.map((m) => m.user_id).filter((id) => id !== user?.id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("scouts").select("id, name").in("id", ids);
      return data || [];
    },
    enabled: isChiefScout && members.length > 0,
  });

  const sendGeneralNote = async () => {
    if (!user || !team || !noteTarget || !noteText.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("chief_scout_feedback" as any).insert({
        team_id: team.id,
        author_id: user.id,
        target_scout_id: noteTarget,
        feedback_type: "general",
        reference_id: null,
        comment: noteText.trim(),
      } as any);
      if (error) throw error;
      const target = memberProfiles.find((m) => m.id === noteTarget);
      await supabase.from("team_activity_log" as any).insert({
        team_id: team.id,
        actor_id: user.id,
        action: "feedback_added",
        entity_type: "general",
        entity_id: noteTarget,
        entity_name: target?.name || "Scout",
        metadata: { feedback_type: "general" },
      } as any);
      setNoteText("");
      toast.success("Note sent");
      queryClient.invalidateQueries({ queryKey: ["all-my-feedback"] });
    } catch {
      toast.error("Failed to send note");
    } finally {
      setSending(false);
    }
  };

  const { data: feedbackItems = [], isLoading } = useQuery({
    queryKey: ["all-my-feedback", user?.id, showSent],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("chief_scout_feedback" as any)
        .select("*")
        .eq(showSent ? "author_id" : "target_scout_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return [];
      return (data as any[]) || [];
    },
    enabled: !!user && !!team,
  });

  // Fetch CS profile
  const { data: authorProfiles = [] } = useQuery({
    queryKey: ["feedback-authors", team?.id, showSent, feedbackItems.length],
    queryFn: async () => {
      const authorIds = [...new Set(feedbackItems.map((f: any) => (showSent ? f.target_scout_id : f.author_id)))];
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
      queryClient.invalidateQueries({ queryKey: ["all-my-feedback"] });
      queryClient.invalidateQueries({ queryKey: ["unread-feedback-count"] });
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

  const unreadCount = showSent ? 0 : feedbackItems.filter((f: any) => !f.is_read).length;

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
        {isChiefScout && (
          <>
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium flex items-center gap-2"><Crown className="h-4 w-4 text-primary" />General note to a scout</p>
                <Select value={noteTarget} onValueChange={setNoteTarget}>
                  <SelectTrigger><SelectValue placeholder="Choose a scout" /></SelectTrigger>
                  <SelectContent>
                    {memberProfiles.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea rows={3} placeholder="Write your note…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                <Button size="sm" className="w-full gap-2" onClick={sendGeneralNote} disabled={!noteTarget || !noteText.trim() || sending}>
                  <Send className="h-4 w-4" />Send note
                </Button>
              </CardContent>
            </Card>
            <Tabs value={view} onValueChange={(v) => setView(v as "received" | "sent")}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="received">Received</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        )}
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
                      <span className="text-xs font-medium">{showSent ? `To ${author?.name || "Scout"}` : author?.name || "Chief Scout"}</span>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        {getIcon(item.feedback_type)}
                        {getTypLabel(item.feedback_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {!item.is_read && !showSent && (
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

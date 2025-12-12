import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import RecommendationsOverview from "@/components/dashboard/RecommendationsOverview";
import TeamsOverview from "@/components/dashboard/TeamsOverview";
import { 
  Users, 
  Inbox, 
  Calendar, 
  Eye, 
  ArrowRight,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface SummaryStats {
  totalPlayers: number;
  inboxPlayers: number;
  totalMatches: number;
  totalObservations: number;
}

interface NeedsAttentionItem {
  id: string;
  label: string;
  count: number;
  route: string;
}

interface RecentPlayer {
  id: string;
  name: string;
  position: string | null;
  photo_url: string | null;
  last_observation_date: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect unauthenticated users immediately
  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  // Fetch summary stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [playersRes, inboxRes, matchesRes, observationsRes] = await Promise.all([
        supabase.from("players").select("id", { count: "exact", head: true }),
        supabase.from("inbox_players").select("id", { count: "exact", head: true }),
        supabase.from("matches").select("id", { count: "exact", head: true }),
        supabase.from("observations").select("id", { count: "exact", head: true }),
      ]);

      return {
        totalPlayers: playersRes.count || 0,
        inboxPlayers: inboxRes.count || 0,
        totalMatches: matchesRes.count || 0,
        totalObservations: observationsRes.count || 0,
      } as SummaryStats;
    },
    enabled: !!user,
  });

  // Fetch needs attention items
  const { data: needsAttention, refetch: refetchNeedsAttention } = useQuery({
    queryKey: ["needs-attention"],
    queryFn: async () => {
      const items: NeedsAttentionItem[] = [];

      // Players missing recommendation
      const { count: noRecommendation } = await supabase
        .from("players")
        .select("id", { count: "exact", head: true })
        .or("recommendation.is.null,recommendation.eq.");

      if (noRecommendation && noRecommendation > 0) {
        items.push({
          id: "no-recommendation",
          label: "Players missing recommendation",
          count: noRecommendation,
          route: "/players?filter=no-recommendation",
        });
      }

      // Players missing profile details
      const { count: incompleteProfiles } = await supabase
        .from("players")
        .select("id", { count: "exact", head: true })
        .or("profile_summary.is.null,strengths.is.null,weaknesses.is.null");

      if (incompleteProfiles && incompleteProfiles > 0) {
        items.push({
          id: "incomplete-profiles",
          label: "Players missing profile details",
          count: incompleteProfiles,
          route: "/players?filter=incomplete",
        });
      }

      // Inbox players waiting
      const { count: inboxCount } = await supabase
        .from("inbox_players")
        .select("id", { count: "exact", head: true });

      if (inboxCount && inboxCount > 0) {
        items.push({
          id: "inbox-waiting",
          label: "Inbox players waiting for review",
          count: inboxCount,
          route: "/inbox",
        });
      }

      // Observations missing ratings
      const { data: obsWithoutRatings } = await supabase
        .from("observations")
        .select("id");

      if (obsWithoutRatings) {
        const obsIds = obsWithoutRatings.map(o => o.id);
        const { data: ratedObs } = await supabase
          .from("ratings")
          .select("observation_id")
          .in("observation_id", obsIds);

        const ratedObsIds = new Set(ratedObs?.map(r => r.observation_id) || []);
        const unratedCount = obsIds.filter(id => !ratedObsIds.has(id)).length;

        if (unratedCount > 0) {
          items.push({
            id: "obs-no-ratings",
            label: "Observations missing ratings",
            count: unratedCount,
            route: "/players",
          });
        }
      }

      // Matches missing data
      const { count: incompleteMatches } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .or("home_team.is.null,away_team.is.null,notes.is.null");

      if (incompleteMatches && incompleteMatches > 0) {
        items.push({
          id: "incomplete-matches",
          label: "Matches missing details",
          count: incompleteMatches,
          route: "/matches",
        });
      }

      return items;
    },
    enabled: !!user,
  });

  // Fetch recently viewed players (from localStorage)
  const { data: recentPlayers, refetch: refetchRecentPlayers } = useQuery({
    queryKey: ["recent-players"],
    queryFn: async () => {
      const recentIds = JSON.parse(localStorage.getItem("recentPlayers") || "[]").slice(0, 3);
      
      if (recentIds.length === 0) return [];

      const { data } = await supabase
        .from("players")
        .select(`
          id,
          name,
          position,
          photo_url,
          observations(date)
        `)
        .in("id", recentIds)
        .order("date", { foreignTable: "observations", ascending: false });

      return data?.map(p => ({
        ...p,
        last_observation_date: p.observations?.[0]?.date || null,
      })) as RecentPlayer[];
    },
    enabled: !!user,
  });

  const summaryCards = [
    { title: "My Players", value: stats?.totalPlayers || 0, icon: Users, color: "text-blue-500" },
    { title: "Inbox Players", value: stats?.inboxPlayers || 0, icon: Inbox, color: "text-amber-500" },
    { title: "Matches", value: stats?.totalMatches || 0, icon: Calendar, color: "text-green-500" },
    { title: "Observations", value: stats?.totalObservations || 0, icon: Eye, color: "text-purple-500" },
  ];

  const quickActions = [
    { label: "Add Player", route: "/player/new", icon: Users },
    { label: "New Observation", route: "/players", icon: Eye },
    { label: "Add Match", route: "/matches/new", icon: Calendar },
    { label: "Open Inbox", route: "/inbox", icon: Inbox },
  ];

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["needs-attention"] }),
      queryClient.invalidateQueries({ queryKey: ["recent-players"] }),
      queryClient.invalidateQueries({ queryKey: ["recommendations-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["teams-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["teams-count"] }),
    ]);
    setIsRefreshing(false);
  };

  // Show nothing while loading or if no user (redirect handles this)
  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Dashboard" 
        showBackButton={false}
        subtitle="Welcome back, scout"
        actions={
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        }
      />

      <main className="px-4 py-6 space-y-6">
        {/* Overview - Primary section */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Players Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RecommendationsOverview />
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{card.title}</p>
                        <p className="text-2xl font-bold text-foreground">{card.value}</p>
                      </div>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Teams Overview */}
        <TeamsOverview />

        {/* Needs Attention */}
        {needsAttention && needsAttention.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {needsAttention.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {item.count}
                    </Badge>
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(item.route)}
                    className="h-8 gap-1 text-xs"
                  >
                    Review
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recently Viewed Players */}
        {recentPlayers && recentPlayers.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Recently Viewed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={player.photo_url || ""} alt={player.name} />
                      <AvatarFallback className="text-xs">
                        {player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{player.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {player.position && <span>{player.position}</span>}
                        {player.last_observation_date && (
                          <>
                            <span>•</span>
                            <span>Last seen {format(new Date(player.last_observation_date), "MMM d")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigate(`/player/${player.id}`);
                    }}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => navigate(action.route)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;

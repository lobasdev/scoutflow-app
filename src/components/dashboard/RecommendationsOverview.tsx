import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { subDays, isAfter, parseISO } from "date-fns";

interface RecommendationStats {
  sign: number;
  observeMore: number;
  inviteForTrial: number;
  notSign: number;
  noRecommendation: number;
  weeklyChanges: {
    sign: number;
    observeMore: number;
    inviteForTrial: number;
    notSign: number;
  };
  last30DaysActivity: number[];
}

const RecommendationsOverview = () => {
  const { data: stats } = useQuery({
    queryKey: ["recommendation-stats"],
    queryFn: async (): Promise<RecommendationStats> => {
      const { data: players } = await supabase
        .from("players")
        .select("recommendation, updated_at, created_at");

      const now = new Date();
      const oneWeekAgo = subDays(now, 7);

      const counts = {
        sign: 0,
        observeMore: 0,
        inviteForTrial: 0,
        notSign: 0,
        noRecommendation: 0,
      };

      const weeklyChanges = {
        sign: 0,
        observeMore: 0,
        inviteForTrial: 0,
        notSign: 0,
      };

      // Generate activity data for sparkline (last 7 days)
      const activityBuckets = [0, 0, 0, 0, 0, 0, 0];

      players?.forEach((player) => {
        const rec = player.recommendation?.toLowerCase() || "";
        const updatedAt = player.updated_at ? parseISO(player.updated_at) : null;
        const createdAt = player.created_at ? parseISO(player.created_at) : null;

        // Count by recommendation
        if (rec === "sign") {
          counts.sign++;
          if (updatedAt && isAfter(updatedAt, oneWeekAgo)) weeklyChanges.sign++;
        } else if (rec === "observe more") {
          counts.observeMore++;
          if (updatedAt && isAfter(updatedAt, oneWeekAgo)) weeklyChanges.observeMore++;
        } else if (rec === "invite for trial") {
          counts.inviteForTrial++;
          if (updatedAt && isAfter(updatedAt, oneWeekAgo)) weeklyChanges.inviteForTrial++;
        } else if (rec === "not sign") {
          counts.notSign++;
          if (updatedAt && isAfter(updatedAt, oneWeekAgo)) weeklyChanges.notSign++;
        } else {
          counts.noRecommendation++;
        }

        // Activity for sparkline (players created in last 7 days)
        if (createdAt && isAfter(createdAt, oneWeekAgo)) {
          const daysAgo = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          const bucketIndex = Math.min(6, daysAgo);
          activityBuckets[6 - bucketIndex]++;
        }
      });

      return {
        ...counts,
        weeklyChanges,
        last30DaysActivity: activityBuckets,
      };
    },
  });

  const cards = [
    {
      key: "sign",
      label: "Ready to Sign",
      count: stats?.sign || 0,
      trend: stats?.weeklyChanges.sign || 0,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      chartColor: "#34d399",
    },
    {
      key: "observeMore",
      label: "Needs More Observation",
      count: stats?.observeMore || 0,
      trend: stats?.weeklyChanges.observeMore || 0,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      chartColor: "#fbbf24",
    },
    {
      key: "inviteForTrial",
      label: "Invite for Trial",
      count: stats?.inviteForTrial || 0,
      trend: stats?.weeklyChanges.inviteForTrial || 0,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      chartColor: "#60a5fa",
    },
    {
      key: "notSign",
      label: "Not Recommended",
      count: stats?.notSign || 0,
      trend: stats?.weeklyChanges.notSign || 0,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-border",
      chartColor: "#6b7280",
      secondary: true,
    },
  ];

  // Generate sparkline data
  const generateSparklineData = (baseValue: number) => {
    const variance = Math.max(1, Math.floor(baseValue * 0.3));
    return Array.from({ length: 6 }, (_, i) => ({
      value: Math.max(0, baseValue - variance + Math.floor(Math.random() * variance * 2) + (i * variance) / 6),
    }));
  };

  const activityData = stats?.last30DaysActivity.map((value, i) => ({ value, index: i })) || [];

  return (
    <div className="space-y-4">
      {/* Recommendation Cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <Card
            key={card.key}
            className={`${card.bgColor} ${card.borderColor} border ${card.secondary ? "col-span-1" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-medium uppercase tracking-wider ${card.color}`}>
                  {card.label}
                </span>
              </div>
              
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">{card.count}</p>
                  {card.trend > 0 ? (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs text-emerald-400">+{card.trend} this week</span>
                    </div>
                  ) : card.trend < 0 ? (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="h-3 w-3 text-red-400" />
                      <span className="text-xs text-red-400">{card.trend} this week</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-1">
                      <Minus className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">No change</span>
                    </div>
                  )}
                </div>
                
                {/* Mini Sparkline */}
                <div className="w-16 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateSparklineData(card.count)}>
                      <defs>
                        <linearGradient id={`gradient-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={card.chartColor} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={card.chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={card.chartColor}
                        strokeWidth={1.5}
                        fill={`url(#gradient-${card.key})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Graph */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Player Activity
              </p>
              <p className="text-sm text-foreground mt-0.5">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-foreground">
                {activityData.reduce((sum, d) => sum + d.value, 0)}
              </p>
              <p className="text-xs text-muted-foreground">new players</p>
            </div>
          </div>
          
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#activityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendationsOverview;

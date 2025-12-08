import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, Legend, PieChart, Pie } from "recharts";

interface TeamSeasonStatsChartProps {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  season?: string;
}

const TeamSeasonStatsChart = ({ wins, draws, losses, goalsFor, goalsAgainst, cleanSheets, season }: TeamSeasonStatsChartProps) => {
  const matchesData = [
    { name: "Wins", value: wins, color: "#22c55e" },
    { name: "Draws", value: draws, color: "#eab308" },
    { name: "Losses", value: losses, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const goalsData = [
    { name: "Goals For", value: goalsFor, color: "#3b82f6" },
    { name: "Goals Against", value: goalsAgainst, color: "#f97316" },
  ];

  const totalMatches = wins + draws + losses;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const goalDifference = goalsFor - goalsAgainst;

  if (totalMatches === 0 && goalsFor === 0 && goalsAgainst === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Season Statistics</span>
          {season && <span className="text-sm font-normal text-muted-foreground">{season}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Match Results Pie Chart */}
          {totalMatches > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 text-center">Match Results</p>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={matchesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {matchesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-xs mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  W: {wins}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  D: {draws}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  L: {losses}
                </span>
              </div>
            </div>
          )}

          {/* Goals Bar Chart */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 text-center">Goals</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={goalsData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {goalsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{totalMatches}</p>
            <p className="text-xs text-muted-foreground">Played</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${goalDifference > 0 ? 'text-green-500' : goalDifference < 0 ? 'text-red-500' : ''}`}>
              {goalDifference > 0 ? '+' : ''}{goalDifference}
            </p>
            <p className="text-xs text-muted-foreground">Goal Diff</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-500">{cleanSheets}</p>
            <p className="text-xs text-muted-foreground">Clean Sheets</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamSeasonStatsChart;

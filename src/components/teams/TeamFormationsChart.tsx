import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface TeamFormationsChartProps {
  formations: string[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const TeamFormationsChart = ({ formations }: TeamFormationsChartProps) => {
  // Count occurrences of each formation
  const formationCounts = formations.reduce((acc, formation) => {
    acc[formation] = (acc[formation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(formationCounts).map(([name, value]) => ({
    name,
    value,
  }));

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Common Formations</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 1 ? (
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-primary">{data[0].name}</div>
            <p className="text-sm text-muted-foreground mt-1">Primary Formation</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                label={({ name }) => name}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamFormationsChart;

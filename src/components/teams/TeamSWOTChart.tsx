import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

interface TeamSWOTChartProps {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

const TeamSWOTChart = ({ strengths, weaknesses, opportunities, threats }: TeamSWOTChartProps) => {
  const data = [
    { name: "Strengths", count: strengths.length, color: "#22c55e" },
    { name: "Weaknesses", count: weaknesses.length, color: "#ef4444" },
    { name: "Opportunities", count: opportunities.length, color: "#3b82f6" },
    { name: "Threats", count: threats.length, color: "#f97316" },
  ];

  const total = strengths.length + weaknesses.length + opportunities.length + threats.length;
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">SWOT Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={90}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value) => [`${value} items`, ""]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TeamSWOTChart;

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface SkillData {
  parameter: string;
  averageScore: number;
}

interface ComparisonRadarChartProps {
  data: SkillData[];
  playerIndex: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(142, 71%, 45%)', 'hsl(217, 91%, 60%)'];

const ComparisonRadarChart = ({ data, playerIndex }: ComparisonRadarChartProps) => {
  const chartData = data.map(item => ({
    skill: item.parameter
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3),
    fullName: item.parameter.replace(/_/g, ' '),
    value: item.averageScore,
    fullMark: 10
  }));

  const color = COLORS[playerIndex % COLORS.length];

  return (
    <ResponsiveContainer width="100%" height={160}>
      <RadarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis 
          dataKey="skill" 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 10]} 
          tick={false}
          axisLine={false}
        />
        <Radar 
          name="Skills" 
          dataKey="value" 
          stroke={color}
          fill={color}
          fillOpacity={0.4}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default ComparisonRadarChart;

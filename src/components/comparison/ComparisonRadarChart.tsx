import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface SkillData {
  parameter: string;
  averageScore: number;
}

interface ComparisonRadarChartProps {
  data: SkillData[];
  comparisonData?: SkillData[][];
  playerIndex: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(142, 71%, 45%)', 'hsl(217, 91%, 60%)'];

const ComparisonRadarChart = ({ data, comparisonData, playerIndex }: ComparisonRadarChartProps) => {
  const chartData = data.map(item => ({
    skill: item.parameter
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .substring(0, 12),
    value: item.averageScore,
    fullMark: 10
  }));

  const color = COLORS[playerIndex % COLORS.length];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis 
          dataKey="skill" 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 10]} 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
          tickCount={6}
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

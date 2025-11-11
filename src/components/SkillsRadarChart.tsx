import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SkillData {
  parameter: string;
  averageScore: number;
}

interface SkillsRadarChartProps {
  data: SkillData[];
}

const SkillsRadarChart = ({ data }: SkillsRadarChartProps) => {
  const chartData = data.map(item => ({
    skill: item.parameter.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    value: item.averageScore,
    fullMark: 10
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="skill" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 10]} 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Radar 
              name="Skills" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))" 
              fillOpacity={0.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SkillsRadarChart;

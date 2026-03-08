import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import type { ComparisonPlayerData } from '@/pages/PlayerComparison';

interface UnifiedRadarChartProps {
  players: (ComparisonPlayerData | null)[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(142, 71%, 45%)', 'hsl(217, 91%, 60%)'];

const getShortLabel = (parameter: string): string => {
  const labels: Record<string, string> = {
    speed: 'SPD', passing: 'PAS', vision: 'VIS', technique: 'TEC',
    decision_making: 'DEC', physicality: 'PHY', potential: 'POT',
    reflexes: 'REF', distribution: 'DIS', positioning: 'POS', handling: 'HND',
  };
  return labels[parameter] || parameter.substring(0, 3).toUpperCase();
};

const UnifiedRadarChart = ({ players }: UnifiedRadarChartProps) => {
  const activePlayers = players.filter((p): p is ComparisonPlayerData => p !== null && p.skillsData.length > 0);
  if (activePlayers.length === 0) return null;

  // Collect all unique parameters
  const allParams = new Set<string>();
  activePlayers.forEach(p => p.skillsData.forEach(s => allParams.add(s.parameter)));

  // Build unified data: one entry per parameter with a value key per player
  const chartData = Array.from(allParams).map(param => {
    const entry: Record<string, any> = { skill: getShortLabel(param), fullName: param.replace(/_/g, ' ') };
    players.forEach((p, i) => {
      if (p) {
        const skill = p.skillsData.find(s => s.parameter === param);
        entry[`player${i}`] = skill ? parseFloat(skill.averageScore.toFixed(1)) : 0;
      }
    });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="skill" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
        {players.map((p, i) =>
          p && p.skillsData.length > 0 ? (
            <Radar
              key={i}
              name={p.name}
              dataKey={`player${i}`}
              stroke={COLORS[i]}
              fill={COLORS[i]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ) : null
        )}
        <Legend
          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          iconType="circle"
          iconSize={8}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default UnifiedRadarChart;

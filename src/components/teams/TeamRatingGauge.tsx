import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamRatingGaugeProps {
  rating: number;
}

const TeamRatingGauge = ({ rating }: TeamRatingGaugeProps) => {
  const percentage = (rating / 10) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (rating >= 8) return "text-green-500";
    if (rating >= 6) return "text-yellow-500";
    if (rating >= 4) return "text-orange-500";
    return "text-red-500";
  };

  const getStrokeColor = () => {
    if (rating >= 8) return "#22c55e";
    if (rating >= 6) return "#eab308";
    if (rating >= 4) return "#f97316";
    return "#ef4444";
  };

  const getLabel = () => {
    if (rating >= 9) return "Elite";
    if (rating >= 7) return "Strong";
    if (rating >= 5) return "Average";
    if (rating >= 3) return "Weak";
    return "Poor";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Overall Rating</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke={getStrokeColor()}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getColor()}`}>{rating}</span>
            <span className="text-xs text-muted-foreground">{getLabel()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamRatingGauge;

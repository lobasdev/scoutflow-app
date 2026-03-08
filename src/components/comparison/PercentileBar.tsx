interface PercentileBarProps {
  percentile: number;
  color: string;
  label: string;
}

const PercentileBar = ({ percentile, color, label }: PercentileBarProps) => {
  const getPercentileLabel = (p: number) => {
    if (p >= 90) return 'Top 10%';
    if (p >= 75) return 'Top 25%';
    if (p >= 50) return 'Top 50%';
    return `${Math.round(p)}th`;
  };

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground truncate">{label}</span>
        <span className="text-[10px] font-medium" style={{ color }}>
          {getPercentileLabel(percentile)}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentile}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default PercentileBar;

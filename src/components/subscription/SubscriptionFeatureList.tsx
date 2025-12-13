import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  name: string;
  included: boolean;
}

interface SubscriptionFeatureListProps {
  features?: Feature[];
  className?: string;
}

const defaultFeatures: Feature[] = [
  { name: "Unlimited player profiles", included: true },
  { name: "Advanced observations & ratings", included: true },
  { name: "Match tracking & lineups", included: true },
  { name: "Team opposition analysis", included: true },
  { name: "PDF report generation", included: true },
  { name: "Voice notes & attachments", included: true },
  { name: "Shortlists & player comparison", included: true },
  { name: "Tournament management", included: true },
];

export function SubscriptionFeatureList({ features = defaultFeatures, className }: SubscriptionFeatureListProps) {
  return (
    <ul className={cn("space-y-2", className)}>
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2 text-sm">
          {feature.included ? (
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className={cn(
            feature.included ? "text-foreground" : "text-muted-foreground line-through"
          )}>
            {feature.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

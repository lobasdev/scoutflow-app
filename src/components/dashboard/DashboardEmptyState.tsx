import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import OnboardingChecklist from "./OnboardingChecklist";

interface DashboardEmptyStateProps {
  displayName: string;
  userId?: string;
}

const DashboardEmptyState = ({ displayName, userId }: DashboardEmptyStateProps) => {
  return (
    <div className="space-y-6">
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Welcome to ScoutFlow, {displayName}!
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Your scouting dashboard is ready. Complete the steps below to get the most out of ScoutFlow.
            </p>
          </div>
        </CardContent>
      </Card>

      <OnboardingChecklist
        stats={{ totalPlayers: 0, inboxPlayers: 0, totalMatches: 0, totalObservations: 0 }}
        userId={userId}
        dismissible={false}
      />
    </div>
  );
};

export default DashboardEmptyState;

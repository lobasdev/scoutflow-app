import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Inbox, Calendar, Eye, ArrowRight, Sparkles } from "lucide-react";

interface DashboardEmptyStateProps {
  displayName: string;
}

const DashboardEmptyState = ({ displayName }: DashboardEmptyStateProps) => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Users,
      title: "Add your first player",
      description: "Start building your scouting database by adding a player profile.",
      action: "Add Player",
      route: "/player/new",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Eye,
      title: "Create an observation",
      description: "Record your match observations with detailed skill ratings.",
      action: "View Players",
      route: "/players",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Calendar,
      title: "Log a match",
      description: "Track matches you've attended and link observations to them.",
      action: "Add Match",
      route: "/matches/new",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Inbox,
      title: "Use the Inbox",
      description: "Quickly jot down player names during live matches, then review later.",
      action: "Open Inbox",
      route: "/inbox",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome card */}
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
              Your scouting dashboard is ready. Follow the steps below to get started and unlock the full potential of your scouting workflow.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Getting started steps */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Getting Started
          </p>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full ${step.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${step.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {index + 1}. {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {step.description}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0 gap-1 text-xs"
                  onClick={() => navigate(step.route)}
                >
                  {step.action}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardEmptyState;

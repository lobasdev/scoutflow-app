import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Inbox, Calendar, Eye, ArrowRight, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingStats {
  totalPlayers: number;
  inboxPlayers: number;
  totalMatches: number;
  totalObservations: number;
}

interface Props {
  stats: OnboardingStats;
  userId?: string;
  dismissible?: boolean;
}

const dismissKey = (uid?: string) => `scoutflow-onboarding-dismissed-${uid ?? "anon"}`;

export const isOnboardingDismissed = (uid?: string) =>
  typeof window !== "undefined" && localStorage.getItem(dismissKey(uid)) === "1";

const OnboardingChecklist = ({ stats, userId, dismissible = true }: Props) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => isOnboardingDismissed(userId));

  const steps = [
    { icon: Users, title: "Add your first player", description: "Create a player profile to start your database.", action: "Add Player", route: "/player/new", done: stats.totalPlayers > 0 },
    { icon: Eye, title: "Write an observation", description: "Rate a player's skills after watching them.", action: "Open Players", route: "/players", done: stats.totalObservations > 0 },
    { icon: Calendar, title: "Log a match", description: "Track matches you attend and link observations.", action: "Add Match", route: "/matches/new", done: stats.totalMatches > 0 },
    { icon: Inbox, title: "Capture a name in the Inbox", description: "Jot down players quickly during live games.", action: "Open Inbox", route: "/inbox", done: stats.inboxPlayers > 0 },
  ];

  const completed = steps.filter((s) => s.done).length;
  // Users already actively working in the app don't need the checklist
  const isActiveUser = stats.totalPlayers >= 3 && stats.totalObservations >= 1;
  if (dismissed || completed === steps.length || isActiveUser) return null;

  const dismiss = () => {
    localStorage.setItem(dismissKey(userId), "1");
    setDismissed(true);
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Getting Started</p>
            <p className="text-sm text-foreground font-medium">{completed} of {steps.length} done</p>
          </div>
          {dismissible && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={dismiss} aria-label="Hide checklist">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Progress value={(completed / steps.length) * 100} className="h-2" />
        <div className="space-y-1">
          {steps.map((step) => {
            const Icon = step.done ? CheckCircle2 : step.icon;
            return (
              <div key={step.title} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={cn("flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center", step.done ? "bg-primary/15" : "bg-muted")}>
                  <Icon className={cn("h-5 w-5", step.done ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", step.done ? "text-muted-foreground line-through" : "text-foreground")}>{step.title}</p>
                  {!step.done && <p className="text-xs text-muted-foreground truncate">{step.description}</p>}
                </div>
                {!step.done && (
                  <Button size="sm" variant="ghost" className="flex-shrink-0 gap-1 text-xs" onClick={() => navigate(step.route)}>
                    {step.action}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingChecklist;

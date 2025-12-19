import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ClipboardList, 
  Trophy, 
  FileText, 
  ArrowRight, 
  Sparkles,
  Check,
  Crown,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName?: string;
}

const steps = [
  {
    icon: Crown,
    title: "Your 7-Day Free Trial",
    description: "You have full access to all ScoutFlow features. No credit card required to start.",
    color: "text-primary",
    bgColor: "bg-primary/10",
    isIntro: true,
  },
  {
    icon: Users,
    title: "Track Players",
    description: "Add players you're scouting, rate their skills across 20+ parameters, and add detailed observations.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: ClipboardList,
    title: "Log Matches",
    description: "Record match details, lineups, and quick observations during live games. Add voice notes on the go.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Trophy,
    title: "Analyze Teams",
    description: "Build opposition profiles with tactical analysis, formations, strengths, and key findings.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: FileText,
    title: "Generate Reports",
    description: "Export professional PDF reports to share with clubs, agents, and colleagues.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

export function WelcomeDialog({ open, onOpenChange, firstName }: WelcomeDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setCompletedSteps([]);
    }
  }, [open]);

  const handleNext = () => {
    setCompletedSteps((prev) => [...prev, currentStep]);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const CurrentIcon = steps[currentStep].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-2">
          {isFirstStep ? (
            <>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-4 ring-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <DialogTitle className="text-2xl">
                Welcome{firstName ? `, ${firstName}` : ""}! 🎉
              </DialogTitle>
              <DialogDescription className="text-base">
                Your account is ready. Let's get you started!
              </DialogDescription>
            </>
          ) : (
            <>
              <DialogTitle className="text-lg text-muted-foreground font-normal">
                Feature Tour
              </DialogTitle>
            </>
          )}
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 py-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentStep
                  ? "w-8 bg-primary"
                  : completedSteps.includes(index)
                  ? "w-2 bg-primary/50 hover:bg-primary/70"
                  : "w-2 bg-muted hover:bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Current step content */}
        <div className="space-y-4 py-4">
          <div
            className={cn(
              "mx-auto flex h-24 w-24 items-center justify-center rounded-2xl transition-all duration-300",
              steps[currentStep].bgColor
            )}
          >
            <CurrentIcon className={cn("h-12 w-12", steps[currentStep].color)} />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">{steps[currentStep].title}</h3>
            <p className="text-muted-foreground text-sm px-4 leading-relaxed">
              {steps[currentStep].description}
            </p>
          </div>

          {/* Trial badge on first step */}
          {isFirstStep && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Zap className="h-4 w-4" />
                7 days of full access included
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={handleSkip} className="flex-1">
            {isFirstStep ? "Skip Tour" : "Skip"}
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {isLastStep ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Start Scouting
              </>
            ) : isFirstStep ? (
              <>
                Take the Tour
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Footer tip */}
        {isFirstStep && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            After your trial, continue for just €4.99/month
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

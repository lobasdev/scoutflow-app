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
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName?: string;
}

const steps = [
  {
    icon: Users,
    title: "Track Players",
    description: "Add players you're scouting, rate their skills, and add detailed observations.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: ClipboardList,
    title: "Log Matches",
    description: "Record match details, lineups, and quick observations during live games.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Trophy,
    title: "Analyze Teams",
    description: "Build opposition profiles with tactical analysis, formations, and key findings.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: FileText,
    title: "Generate Reports",
    description: "Export professional PDF reports to share with clubs and colleagues.",
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
  const CurrentIcon = steps[currentStep].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">
            Welcome{firstName ? `, ${firstName}` : ""}! 👋
          </DialogTitle>
          <DialogDescription>
            Let's take a quick tour of ScoutFlow
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                index === currentStep
                  ? "w-6 bg-primary"
                  : completedSteps.includes(index)
                  ? "bg-primary/50"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Current step content */}
        <div className="space-y-4 py-4">
          <div
            className={cn(
              "mx-auto flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300",
              steps[currentStep].bgColor
            )}
          >
            <CurrentIcon className={cn("h-10 w-10", steps[currentStep].color)} />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">{steps[currentStep].title}</h3>
            <p className="text-muted-foreground text-sm px-4">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={handleSkip} className="flex-1">
            Skip Tour
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {isLastStep ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

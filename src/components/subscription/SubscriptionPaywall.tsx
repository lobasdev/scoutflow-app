import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Loader2, Check, Lock } from "lucide-react";
import { usePaddle } from "@/hooks/usePaddle";

interface SubscriptionPaywallProps {
  title?: string;
  description?: string;
}

export function SubscriptionPaywall({ 
  title = "Upgrade to ScoutFlow Solo",
  description = "Your trial has ended. Subscribe to continue using all features."
}: SubscriptionPaywallProps) {
  const [loading, setLoading] = useState(false);
  const { openCheckout } = usePaddle();

  const handleUpgrade = () => {
    setLoading(true);
    openCheckout();
    // Loading state will be reset when page reloads after checkout completes
    // or after a timeout if user cancels
    setTimeout(() => setLoading(false), 3000);
  };

  const features = [
    "Unlimited player profiles",
    "PDF report generation",
    "Voice notes & attachments",
    "Team opposition analysis",
    "Player comparison tools",
    "Tournament tracking",
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">€4.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              7-day free trial included
            </p>
          </div>

          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Crown className="mr-2 h-4 w-4" />
            )}
            Start Free Trial
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

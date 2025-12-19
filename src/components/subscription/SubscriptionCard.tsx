import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Crown, Loader2, ExternalLink, Calendar, Shield, Zap, CheckCircle2 } from "lucide-react";
import { useSubscription, useIsAdmin } from "@/hooks/useSubscription";
import { usePaddle } from "@/hooks/usePaddle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { SubscriptionFeatureList } from "./SubscriptionFeatureList";
import { Progress } from "@/components/ui/progress";

export function SubscriptionCard() {
  const { subscription, isLoading, isActive, isTrialing, isPastDue, isCancelled, isExpired, daysRemaining } = useSubscription();
  const isAdmin = useIsAdmin();
  const { openCheckout } = usePaddle();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleUpgrade = () => {
    setLoadingCheckout(true);
    openCheckout();
    // Loading state will be reset when page reloads after checkout completes
    // or after a timeout if user cancels
    setTimeout(() => setLoadingCheckout(false), 3000);
  };

  const handleManageBilling = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("paddle-portal");

      if (error) throw error;
      if (data?.update_payment_method_url) {
        window.open(data.update_payment_method_url, "_blank");
      } else if (data?.cancel_url) {
        window.open(data.cancel_url, "_blank");
      } else {
        toast.error("No billing portal available");
      }
    } catch (error) {
      console.error("Billing portal error:", error);
      toast.error("Failed to open billing portal");
    } finally {
      setLoadingPortal(false);
    }
  };

  const getStatusBadge = () => {
    if (isAdmin) {
      return <Badge className="bg-purple-500 hover:bg-purple-600">Admin Access</Badge>;
    }
    if (isActive) {
      return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" />Active</Badge>;
    }
    if (isTrialing) {
      return <Badge className="bg-blue-500 hover:bg-blue-600"><Zap className="mr-1 h-3 w-3" />Trial</Badge>;
    }
    if (isPastDue) {
      return <Badge variant="destructive">Past Due</Badge>;
    }
    if (isCancelled) {
      return <Badge variant="secondary">Cancelled</Badge>;
    }
    if (isExpired) {
      return <Badge variant="outline">Expired</Badge>;
    }
    return <Badge variant="outline">Free</Badge>;
  };

  // Calculate trial progress
  const getTrialProgress = () => {
    if (!isTrialing || daysRemaining === null) return null;
    const totalTrialDays = 7;
    const daysUsed = totalTrialDays - daysRemaining;
    return Math.min(100, (daysUsed / totalTrialDays) * 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasSubscription = subscription && (isActive || isTrialing || isPastDue);
  const trialProgress = getTrialProgress();

  return (
    <Card className="overflow-hidden">
      {/* Status header bar */}
      <div className={`px-4 py-2 text-sm font-medium flex items-center justify-between ${
        isAdmin ? "bg-purple-500/10 text-purple-700 dark:text-purple-300" :
        isActive ? "bg-green-500/10 text-green-700 dark:text-green-300" :
        isTrialing ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" :
        isPastDue ? "bg-destructive/10 text-destructive" :
        "bg-muted"
      }`}>
        <div className="flex items-center gap-2">
          {isAdmin ? <Shield className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
          <span>
            {isAdmin ? "Admin Account" :
             isActive ? "ScoutFlow Solo" :
             isTrialing ? "Trial Period" :
             isPastDue ? "Payment Required" :
             "Free Account"}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Subscription</span>
          <span className="text-2xl font-bold">€4.99<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
        </CardTitle>
        <CardDescription>
          {isAdmin ? "Unlimited access to all features" : 
           hasSubscription ? "Your current plan and billing" : 
           "Upgrade to unlock all scouting features"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Admin status */}
        {isAdmin && (
          <div className="rounded-lg bg-purple-500/10 p-4 text-center">
            <Shield className="mx-auto h-8 w-8 text-purple-500 mb-2" />
            <p className="font-medium text-purple-700 dark:text-purple-300">Admin Privileges</p>
            <p className="text-sm text-muted-foreground">You have unlimited access to all features</p>
          </div>
        )}

        {/* Trial progress */}
        {isTrialing && daysRemaining !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Trial progress</span>
              <span className="font-medium">{daysRemaining} days left</span>
            </div>
            <Progress value={trialProgress || 0} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Your trial ends on {subscription?.trial_ends_at && format(new Date(subscription.trial_ends_at), "MMM d, yyyy")}
            </p>
          </div>
        )}

        {/* Active subscription info */}
        {isActive && subscription?.current_period_end && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Calendar className="h-4 w-4" />
            <span>Next billing date: <strong className="text-foreground">{format(new Date(subscription.current_period_end), "MMM d, yyyy")}</strong></span>
          </div>
        )}

        {/* Past due warning */}
        {isPastDue && (
          <div className="rounded-lg bg-destructive/10 p-4 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-destructive mb-2" />
            <p className="font-medium text-destructive">Payment Failed</p>
            <p className="text-sm text-muted-foreground">Please update your payment method to continue access</p>
          </div>
        )}

        {/* Cancelled notice */}
        {isCancelled && subscription?.current_period_end && (
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="font-medium">Subscription Cancelled</p>
            <p className="text-sm text-muted-foreground">
              You'll have access until {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
            </p>
          </div>
        )}

        <Separator />

        {/* Actions */}
        {!isAdmin && (
          <div className="flex gap-2">
            {hasSubscription ? (
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleManageBilling}
                disabled={loadingPortal}
              >
                {loadingPortal ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Manage Billing
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={handleUpgrade}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Crown className="mr-2 h-4 w-4" />
                )}
                Start 7-Day Free Trial
              </Button>
            )}
          </div>
        )}

        {/* Features list for non-subscribers */}
        {!hasSubscription && !isAdmin && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-3">Everything you need to scout:</p>
              <SubscriptionFeatureList />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

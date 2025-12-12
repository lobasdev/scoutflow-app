import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Crown, Loader2, ExternalLink, Calendar } from "lucide-react";
import { useSubscription, useIsAdmin } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export function SubscriptionCard() {
  const { subscription, isLoading, isActive, isTrialing, isPastDue, isCancelled, isExpired, daysRemaining } = useSubscription();
  const isAdmin = useIsAdmin();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleUpgrade = async () => {
    setLoadingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { redirect_url: window.location.origin + "/profile" },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleManageBilling = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription");

      if (error) throw error;
      if (data?.customer_portal_url) {
        window.open(data.customer_portal_url, "_blank");
      } else if (data?.update_payment_method_url) {
        window.open(data.update_payment_method_url, "_blank");
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
      return <Badge className="bg-purple-500 hover:bg-purple-600">Admin</Badge>;
    }
    if (isActive) {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
    if (isTrialing) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Trial</Badge>;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Subscription
        </CardTitle>
        <CardDescription>
          Manage your ScoutFlow Pro subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">ScoutFlow Pro</span>
              {getStatusBadge()}
            </div>
            {isAdmin && (
              <p className="text-sm text-muted-foreground">
                You have admin access with unlimited features
              </p>
            )}
            {isTrialing && daysRemaining !== null && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {daysRemaining} days remaining in trial
              </p>
            )}
            {isActive && subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Renews {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
              </p>
            )}
            {isPastDue && (
              <p className="text-sm text-destructive">
                Payment failed - please update your payment method
              </p>
            )}
            {isCancelled && subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                Access until {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
              </p>
            )}
          </div>
          <span className="text-2xl font-bold">$5<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
        </div>

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

        {!hasSubscription && !isAdmin && (
          <ul className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
            <li>✓ Unlimited player profiles</li>
            <li>✓ Advanced scouting analytics</li>
            <li>✓ PDF report generation</li>
            <li>✓ Voice notes & attachments</li>
            <li>✓ Team opposition analysis</li>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

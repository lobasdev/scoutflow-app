import { useSubscription, useIsAdmin } from "@/hooks/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, AlertTriangle, Clock, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SubscriptionStatusBanner() {
  const { isTrialing, isPastDue, daysRemaining, hasAccess } = useSubscription();
  const isAdmin = useIsAdmin();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Don't show for admins or if dismissed
  if (isAdmin || dismissed) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { redirect_url: window.location.origin + "/profile" },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      toast.error("Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  // Trial ending soon (3 days or less)
  if (isTrialing && daysRemaining !== null && daysRemaining <= 3) {
    return (
      <Alert className="rounded-none border-x-0 border-t-0 bg-amber-500/10 border-amber-500/20">
        <Clock className="h-4 w-4 text-amber-500" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span className="text-amber-700 dark:text-amber-300">
            <strong>Trial ending soon!</strong> {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining.
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleUpgrade} disabled={loading}>
              <Crown className="mr-1 h-3 w-3" />
              Upgrade Now
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setDismissed(true)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Past due payment
  if (isPastDue) {
    return (
      <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span>
            <strong>Payment failed.</strong> Please update your payment method to continue using ScoutFlow.
          </span>
          <Button size="sm" variant="outline" onClick={handleUpgrade} disabled={loading}>
            Update Payment
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled" | "expired" | "paused" | "none";

interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  lemon_subscription_id: string | null;
  lemon_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  isActive: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  hasAccess: boolean;
  daysRemaining: number | null;
  refetch: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }

      return data as Subscription | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const status = subscription?.status || "none";
  const isActive = status === "active";
  const isTrialing = status === "trialing";
  const isPastDue = status === "past_due";
  const isCancelled = status === "cancelled";
  const isExpired = status === "expired";

  // User has access if active, trialing, or past_due (grace period)
  const hasAccess = isActive || isTrialing || isPastDue;

  // Calculate days remaining
  let daysRemaining: number | null = null;
  if (subscription) {
    const endDate = isTrialing && subscription.trial_ends_at 
      ? new Date(subscription.trial_ends_at)
      : subscription.current_period_end 
        ? new Date(subscription.current_period_end)
        : null;
    
    if (endDate) {
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
  }

  return {
    subscription,
    isLoading,
    isActive,
    isTrialing,
    isPastDue,
    isCancelled,
    isExpired,
    hasAccess,
    daysRemaining,
    refetch,
  };
}

export function useIsAdmin(): boolean {
  const { user } = useAuth();

  const { data: isAdmin } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return isAdmin || false;
}

import { useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Checkout flow (reliable):
 * Client calls our backend function which creates a Paddle transaction and returns a hosted checkout URL.
 * This avoids Paddle.js client-token/JWT issues and works consistently in both preview + production.
 */
export function usePaddle() {
  const { user } = useAuth();

  const openCheckout = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to start a trial.");
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/dashboard?subscription=success`;

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { redirect_url: redirectUrl },
      });

      if (error) {
        console.error("create-checkout invoke error:", error);
        toast.error("Could not start checkout. Please try again.");
        return;
      }

      const url = (data as any)?.url as string | undefined;
      if (!url) {
        console.error("create-checkout: missing url", data);
        toast.error("Could not start checkout. Please try again.");
        return;
      }

      // Redirect to hosted checkout
      window.location.href = url;
    } catch (e) {
      console.error("openCheckout error:", e);
      toast.error("Could not start checkout. Please try again.");
    }
  }, [user]);

  return {
    openCheckout,
    isReady: true,
  };
}

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Paddle client token (publishable - safe to expose)
const PADDLE_CLIENT_TOKEN = "live_d1c6c25b3660c9ca0db8f86ed16";

declare global {
  interface Window {
    Paddle?: {
      Initialize: (options: { token: string; eventCallback?: (data: PaddleEvent) => void }) => void;
      Checkout: {
        open: (options: {
          transactionId?: string;
          items?: Array<{ priceId: string; quantity: number }>;
          customData?: Record<string, string>;
          customer?: { email: string };
          settings?: {
            successUrl?: string;
            displayMode?: "overlay" | "inline";
            theme?: "light" | "dark";
          };
        }) => void;
      };
    };
  }
}

interface PaddleEvent {
  name: string;
  data?: Record<string, unknown>;
}

export function usePaddle() {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Paddle.js
  useEffect(() => {
    const initPaddle = () => {
      if (window.Paddle && PADDLE_CLIENT_TOKEN) {
        try {
          window.Paddle.Initialize({
            token: PADDLE_CLIENT_TOKEN,
            eventCallback: (event) => {
              console.log("Paddle event:", event);
              if (event.name === "checkout.completed") {
                toast.success("Subscription activated!");
                setTimeout(() => window.location.reload(), 1500);
              }
              if (event.name === "checkout.closed") {
                setIsLoading(false);
              }
            },
          });
          setIsReady(true);
          console.log("Paddle.js initialized");
        } catch (e) {
          console.error("Failed to init Paddle:", e);
        }
      }
    };

    if (!document.getElementById("paddle-js")) {
      const script = document.createElement("script");
      script.id = "paddle-js";
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = initPaddle;
      document.head.appendChild(script);
    } else if (window.Paddle) {
      initPaddle();
    }
  }, []);

  const openCheckout = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to start a trial.");
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard?subscription=success`;

      // Create transaction via edge function
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { redirect_url: redirectUrl },
      });

      if (error) {
        console.error("create-checkout error:", error);
        toast.error("Could not start checkout. Please try again.");
        setIsLoading(false);
        return;
      }

      // Check for configuration error
      if (data?.error === "paddle_config_needed") {
        toast.error("Payment system is being configured. Please try again later.");
        setIsLoading(false);
        return;
      }

      const transactionId = data?.transaction_id;
      const checkoutUrl = data?.url;

      // If we have a checkout URL, redirect to it
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      // If we have a transaction ID and Paddle.js is ready, open inline checkout
      if (transactionId && window.Paddle && isReady) {
        window.Paddle.Checkout.open({
          transactionId,
          settings: {
            displayMode: "overlay",
            theme: "dark",
            successUrl: redirectUrl,
          },
        });
        return;
      }

      // Fallback error
      toast.error("Could not start checkout. Please try again.");
      setIsLoading(false);
    } catch (e) {
      console.error("openCheckout error:", e);
      toast.error("Could not start checkout. Please try again.");
      setIsLoading(false);
    }
  }, [user, isReady]);

  return {
    openCheckout,
    isReady,
    isLoading,
  };
}

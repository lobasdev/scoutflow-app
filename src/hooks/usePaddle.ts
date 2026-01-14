import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Paddle client token (publishable - safe to expose)
const PADDLE_CLIENT_TOKEN = "live_d1c6c25b3660c9ca0db8f86ed16";

declare global {
  interface Window {
    Paddle?: {
      Environment?: {
        set: (env: "sandbox" | "production") => void;
      };
      Initialize: (options: {
        token: string;
        eventCallback?: (data: PaddleEvent) => void;
      }) => void;
      Checkout: {
        open: (options: {
          transactionId?: string;
          items?: Array<{ priceId: string; quantity: number }>;
          customData?: Record<string, string>;
          customer?: { email?: string; id?: string };
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
          const env = PADDLE_CLIENT_TOKEN.startsWith("live_") ? "production" : "sandbox";
          window.Paddle.Environment?.set(env);
          console.log("Paddle environment:", env);

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

              if (event.name === "checkout.error" || event.name.includes("error")) {
                toast.error("Checkout error. Please try again.");
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

    if (!window.Paddle || !isReady) {
      toast.error("Payment system is loading. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard?subscription=success`;

      // Get checkout data from edge function (price ID, customer info)
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { redirect_url: redirectUrl },
      });

      if (error) {
        console.error("create-checkout error:", error);
        toast.error("Could not start checkout. Please try again.");
        setIsLoading(false);
        return;
      }

      if (data?.error) {
        console.error("Checkout error:", data.error);
        toast.error("Could not start checkout. Please try again.");
        setIsLoading(false);
        return;
      }

      const priceId = data?.price_id;
      const customerId = data?.customer_id;
      const customerEmail = data?.customer_email;
      const userId = data?.user_id;
      const successUrl = data?.success_url || redirectUrl;

      if (!priceId) {
        toast.error("Payment configuration error. Please contact support.");
        setIsLoading(false);
        return;
      }

      console.log("Opening Paddle checkout with:", { priceId, customerId, customerEmail });

      // Open Paddle.js checkout with customer ID if available
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: customerId ? { id: customerId } : (customerEmail ? { email: customerEmail } : undefined),
        customData: { user_id: userId || "", user_email: customerEmail || "" },
        settings: {
          displayMode: "overlay",
          theme: "dark",
          successUrl,
        },
      });
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

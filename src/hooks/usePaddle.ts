import { useEffect, useCallback, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

declare global {
  interface Window {
    Paddle?: {
      Initialize: (options: {
        token: string;
        eventCallback?: (data: PaddleEvent) => void;
      }) => void;
      Checkout: {
        open: (options: {
          items: Array<{ priceId: string; quantity: number }>;
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

// Paddle configuration - hardcoded for production use
// Client token is safe to expose (it's a publishable key)
const PADDLE_CLIENT_TOKEN = "live_d1c6c25b3660c9ca0db8f86ed16";
const PADDLE_PRICE_ID = "pri_01jtvq1wjxn9g1rqbp5d2wkxkg";

export function usePaddle() {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  // Initialize Paddle when component mounts
  useEffect(() => {
    const initializePaddle = () => {
      if (window.Paddle && PADDLE_CLIENT_TOKEN) {
        try {
          window.Paddle.Initialize({
            token: PADDLE_CLIENT_TOKEN,
            eventCallback: (data) => {
              console.log("Paddle event:", data);
              if (data.name === "checkout.completed") {
                console.log("Checkout completed!");
                toast.success("Subscription activated successfully!");
                window.location.reload();
              }
            },
          });
          setIsReady(true);
          console.log("Paddle initialized successfully");
        } catch (error) {
          console.error("Failed to initialize Paddle:", error);
        }
      }
    };

    // Load Paddle.js script if not already loaded
    if (!document.getElementById("paddle-js")) {
      const script = document.createElement("script");
      script.id = "paddle-js";
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = initializePaddle;
      script.onerror = () => {
        console.error("Failed to load Paddle script");
        toast.error("Payment system unavailable. Please try again later.");
      };
      document.head.appendChild(script);
    } else if (window.Paddle) {
      initializePaddle();
    }
  }, []);

  // Open checkout
  const openCheckout = useCallback(() => {
    console.log("openCheckout called", { 
      paddleLoaded: !!window.Paddle, 
      priceId: PADDLE_PRICE_ID,
      user: user?.email 
    });

    if (!window.Paddle) {
      console.error("Paddle not loaded");
      toast.error("Payment system is loading. Please try again in a moment.");
      return;
    }

    if (!PADDLE_PRICE_ID) {
      console.error("Paddle price ID not configured");
      toast.error("Payment configuration error. Please contact support.");
      return;
    }

    try {
      window.Paddle.Checkout.open({
        items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
        customData: user ? {
          user_id: user.id,
          user_email: user.email || "",
        } : undefined,
        customer: user?.email ? { email: user.email } : undefined,
        settings: {
          displayMode: "overlay",
          theme: "dark",
          successUrl: window.location.origin + "/dashboard?subscription=success",
        },
      });
    } catch (error) {
      console.error("Failed to open checkout:", error);
      toast.error("Failed to open checkout. Please try again.");
    }
  }, [user]);

  return {
    openCheckout,
    isReady,
  };
}
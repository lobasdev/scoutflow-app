import { useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

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

// Paddle client token from environment
const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
const PADDLE_PRICE_ID = import.meta.env.VITE_PADDLE_PRICE_ID;

export function usePaddle() {
  const { user } = useAuth();

  // Initialize Paddle when component mounts
  useEffect(() => {
    // Load Paddle.js script if not already loaded
    if (!document.getElementById("paddle-js")) {
      const script = document.createElement("script");
      script.id = "paddle-js";
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = () => {
        if (window.Paddle && PADDLE_CLIENT_TOKEN) {
          window.Paddle.Initialize({
            token: PADDLE_CLIENT_TOKEN,
            eventCallback: (data) => {
              console.log("Paddle event:", data);
              if (data.name === "checkout.completed") {
                // Checkout completed - the webhook will handle subscription creation
                console.log("Checkout completed!");
                // Optionally reload or redirect
                window.location.reload();
              }
            },
          });
        }
      };
      document.head.appendChild(script);
    } else if (window.Paddle && PADDLE_CLIENT_TOKEN) {
      // Script already loaded, just initialize
      window.Paddle.Initialize({
        token: PADDLE_CLIENT_TOKEN,
        eventCallback: (data) => {
          console.log("Paddle event:", data);
          if (data.name === "checkout.completed") {
            window.location.reload();
          }
        },
      });
    }
  }, []);

  // Open checkout
  const openCheckout = useCallback(() => {
    if (!window.Paddle) {
      console.error("Paddle not loaded");
      return;
    }

    if (!PADDLE_PRICE_ID) {
      console.error("Paddle price ID not configured");
      return;
    }

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
  }, [user]);

  return {
    openCheckout,
    isReady: !!window.Paddle,
  };
}
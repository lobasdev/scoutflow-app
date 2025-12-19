import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paddle-signature",
};

// Verify Paddle webhook signature
async function verifyPaddleSignature(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  const webhookSecret = Deno.env.get("PADDLE_WEBHOOK_SECRET");
  
  if (!webhookSecret || !signature) {
    console.log("Missing webhook secret or signature");
    return false;
  }

  try {
    // Parse the signature header
    // Format: ts=timestamp;h1=hash
    const parts = signature.split(";");
    const timestampPart = parts.find(p => p.startsWith("ts="));
    const hashPart = parts.find(p => p.startsWith("h1="));

    if (!timestampPart || !hashPart) {
      console.log("Invalid signature format");
      return false;
    }

    const timestamp = timestampPart.split("=")[1];
    const expectedHash = hashPart.split("=")[1];

    // Create the signed payload
    const signedPayload = `${timestamp}:${rawBody}`;

    // Generate HMAC
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );

    const computedHash = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    return computedHash === expectedHash;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("paddle-signature");
    const rawBody = await req.text();
    
    // Verify webhook signature
    const isValid = await verifyPaddleSignature(rawBody, signature);
    if (!isValid) {
      console.error("Invalid Paddle webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const payload = JSON.parse(rawBody);
    const eventType = payload.event_type;
    const data = payload.data;

    console.log("Received Paddle webhook:", eventType);
    console.log("Payload data:", JSON.stringify(data, null, 2));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extract user ID from custom data
    const customData = data.custom_data || {};
    const userId = customData.user_id;
    const userEmail = customData.user_email;

    console.log("Processing for user:", userEmail, "userId:", userId);

    // Find user by ID or email
    let targetUserId = userId;
    if (!targetUserId && userEmail) {
      const { data: scout } = await supabase
        .from("scouts")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();
      
      if (scout) {
        targetUserId = scout.id;
      }
    }

    if (!targetUserId) {
      console.log("User not found for webhook event");
      return new Response(JSON.stringify({ received: true, warning: "User not found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle different Paddle Billing event types
    switch (eventType) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.activated": {
        const status = mapPaddleStatus(data.status);
        const subscriptionData = {
          user_id: targetUserId,
          paddle_subscription_id: data.id,
          paddle_customer_id: data.customer_id,
          status,
          current_period_start: data.current_billing_period?.starts_at || null,
          current_period_end: data.current_billing_period?.ends_at || null,
          trial_ends_at: data.scheduled_change?.effective_at || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("subscriptions")
          .upsert(subscriptionData, { onConflict: "user_id" });

        if (error) {
          console.error("Error upserting subscription:", error);
        } else {
          console.log("Subscription upserted successfully");
        }
        break;
      }

      case "subscription.trialing": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "trialing",
            trial_ends_at: data.scheduled_change?.effective_at || null,
            updated_at: new Date().toISOString(),
          })
          .eq("paddle_subscription_id", data.id);

        if (error) {
          console.error("Error updating trial:", error);
        }
        break;
      }

      case "subscription.canceled": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("paddle_subscription_id", data.id);

        if (error) {
          console.error("Error cancelling subscription:", error);
        } else {
          console.log("Subscription cancelled successfully");
        }
        break;
      }

      case "subscription.past_due": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("paddle_subscription_id", data.id);

        if (error) {
          console.error("Error updating past due:", error);
        }
        break;
      }

      case "subscription.paused": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "paused",
            updated_at: new Date().toISOString(),
          })
          .eq("paddle_subscription_id", data.id);

        if (error) {
          console.error("Error pausing subscription:", error);
        }
        break;
      }

      case "subscription.resumed": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("paddle_subscription_id", data.id);

        if (error) {
          console.error("Error resuming subscription:", error);
        }
        break;
      }

      case "transaction.completed": {
        // Payment succeeded - update subscription to active
        const subscriptionId = data.subscription_id;
        if (subscriptionId) {
          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("paddle_subscription_id", subscriptionId);

          if (error) {
            console.error("Error updating payment success:", error);
          }
        }
        break;
      }

      default:
        console.log("Unhandled Paddle event type:", eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Paddle webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function mapPaddleStatus(paddleStatus: string): string {
  switch (paddleStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "paused":
      return "paused";
    default:
      return "active";
  }
}
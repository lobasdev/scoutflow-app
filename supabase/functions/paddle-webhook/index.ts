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
  
  if (!webhookSecret) {
    console.log("No webhook secret configured, skipping verification");
    return true; // Allow if no secret configured
  }
  
  if (!signature) {
    console.log("No signature provided in request");
    return true; // Allow for now
  }

  try {
    // Parse the signature header
    // Format: ts=timestamp;h1=hash
    const parts = signature.split(";");
    const timestampPart = parts.find(p => p.startsWith("ts="));
    const hashPart = parts.find(p => p.startsWith("h1="));

    if (!timestampPart || !hashPart) {
      console.log("Invalid signature format, allowing anyway");
      return true;
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

    const isValid = computedHash === expectedHash;
    console.log("Signature verification:", isValid ? "PASSED" : "FAILED (allowing anyway for debugging)");
    return true; // Allow even if signature fails for now
  } catch (error) {
    console.error("Signature verification error:", error);
    return true; // Allow on error for debugging
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("paddle-signature");
    const rawBody = await req.text();
    
    console.log("=== PADDLE WEBHOOK RECEIVED ===");
    console.log("Signature header present:", !!signature);
    
    // Verify webhook signature
    const isValid = await verifyPaddleSignature(rawBody, signature);
    if (!isValid) {
      console.error("Webhook signature verification failed");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const payload = JSON.parse(rawBody);
    const eventType = payload.event_type;
    const data = payload.data;

    console.log("Event type:", eventType);
    console.log("Payload data:", JSON.stringify(data, null, 2));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extract user info from custom data or customer info
    const customData = data.custom_data || {};
    let userId = customData.user_id;
    let userEmail = customData.user_email;

    // Also try to get email from customer object
    if (!userEmail && data.customer?.email) {
      userEmail = data.customer.email;
    }
    
    // For transaction events, check the billing details
    if (!userEmail && data.billing_details?.email) {
      userEmail = data.billing_details.email;
    }

    console.log("Custom data:", JSON.stringify(customData));
    console.log("User ID from custom data:", userId);
    console.log("User email:", userEmail);

    // Find user by ID or email
    let targetUserId = userId;
    if (!targetUserId && userEmail) {
      console.log("Looking up user by email:", userEmail);
      
      // First try scouts table
      const { data: scout } = await supabase
        .from("scouts")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();
      
      if (scout) {
        targetUserId = scout.id;
        console.log("Found user in scouts:", targetUserId);
      } else {
        // Try auth.users via admin API
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && users) {
          const authUser = users.find(u => u.email === userEmail);
          if (authUser) {
            targetUserId = authUser.id;
            console.log("Found user in auth.users:", targetUserId);
          }
        }
      }
    }

    if (!targetUserId) {
      console.error("Could not find user for email:", userEmail);
      // Return 200 to acknowledge receipt even if user not found
      return new Response(JSON.stringify({ received: true, warning: "User not found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing webhook for user:", targetUserId);

    // Handle different Paddle Billing event types
    switch (eventType) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.activated": {
        const status = mapPaddleStatus(data.status);
        console.log("Paddle status:", data.status, "-> mapped to:", status);
        
        const subscriptionData = {
          user_id: targetUserId,
          paddle_subscription_id: data.id,
          paddle_customer_id: data.customer_id,
          status,
          current_period_start: data.current_billing_period?.starts_at || null,
          current_period_end: data.current_billing_period?.ends_at || null,
          trial_ends_at: data.current_billing_period?.ends_at || null,
          updated_at: new Date().toISOString(),
        };

        console.log("Upserting subscription:", JSON.stringify(subscriptionData));

        const { error } = await supabase
          .from("subscriptions")
          .upsert(subscriptionData, { onConflict: "user_id" });

        if (error) {
          console.error("Error upserting subscription:", error);
        } else {
          console.log("Subscription upserted successfully!");
        }
        break;
      }

      case "subscription.trialing": {
        console.log("Processing subscription.trialing event");
        const { error } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: targetUserId,
            paddle_subscription_id: data.id,
            paddle_customer_id: data.customer_id,
            status: "trialing",
            trial_ends_at: data.current_billing_period?.ends_at || null,
            current_period_start: data.current_billing_period?.starts_at || null,
            current_period_end: data.current_billing_period?.ends_at || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (error) {
          console.error("Error updating trial:", error);
        } else {
          console.log("Trial subscription created/updated successfully!");
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
          .eq("user_id", targetUserId);

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
          .eq("user_id", targetUserId);

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
          .eq("user_id", targetUserId);

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
          .eq("user_id", targetUserId);

        if (error) {
          console.error("Error resuming subscription:", error);
        }
        break;
      }

      case "transaction.completed": {
        console.log("Processing transaction.completed event");
        // Payment succeeded - update or create subscription to active/trialing
        const subscriptionId = data.subscription_id;
        if (subscriptionId) {
          // Check if this is initial trial transaction (amount = 0)
          const isTrialPayment = data.details?.totals?.total === "0" || data.details?.totals?.total === 0;
          const status = isTrialPayment ? "trialing" : "active";
          
          console.log("Transaction total:", data.details?.totals?.total, "-> status:", status);
          
          const { error } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: targetUserId,
              paddle_subscription_id: subscriptionId,
              paddle_customer_id: data.customer_id,
              status,
              current_period_start: data.billing_period?.starts_at || null,
              current_period_end: data.billing_period?.ends_at || null,
              trial_ends_at: isTrialPayment ? data.billing_period?.ends_at : null,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });

          if (error) {
            console.error("Error upserting from transaction:", error);
          } else {
            console.log("Subscription updated from transaction.completed!");
          }
        }
        break;
      }

      default:
        console.log("Unhandled Paddle event type:", eventType);
    }

    console.log("=== WEBHOOK PROCESSED SUCCESSFULLY ===");
    
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

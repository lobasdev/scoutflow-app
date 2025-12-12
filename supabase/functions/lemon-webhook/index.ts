import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("x-signature");
    const body = await req.text();
    const payload = JSON.parse(body);

    console.log("Received webhook event:", payload.meta?.event_name);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const eventName = payload.meta?.event_name;
    const data = payload.data;
    const attrs = data?.attributes;

    // Get user email from custom data or customer email
    const customData = payload.meta?.custom_data;
    const userEmail = customData?.user_email || attrs?.user_email;
    const userId = customData?.user_id;

    console.log("Processing for user:", userEmail, "userId:", userId);

    if (!userId && !userEmail) {
      console.log("No user identifier found in webhook");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      console.log("User not found");
      return new Response(JSON.stringify({ received: true, error: "User not found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle different event types
    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const status = mapLemonStatus(attrs?.status);
        const subscriptionData = {
          user_id: targetUserId,
          lemon_subscription_id: String(data.id),
          lemon_customer_id: String(attrs?.customer_id),
          lemon_order_id: String(attrs?.order_id),
          status,
          variant_id: String(attrs?.variant_id),
          current_period_start: attrs?.renews_at ? new Date(attrs.created_at).toISOString() : null,
          current_period_end: attrs?.renews_at ? new Date(attrs.renews_at).toISOString() : null,
          trial_ends_at: attrs?.trial_ends_at ? new Date(attrs.trial_ends_at).toISOString() : null,
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

      case "subscription_cancelled": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", String(data.id));

        if (error) {
          console.error("Error cancelling subscription:", error);
        } else {
          console.log("Subscription cancelled successfully");
        }
        break;
      }

      case "subscription_expired": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", String(data.id));

        if (error) {
          console.error("Error expiring subscription:", error);
        } else {
          console.log("Subscription expired successfully");
        }
        break;
      }

      case "subscription_paused": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "paused",
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", String(data.id));

        if (error) {
          console.error("Error pausing subscription:", error);
        }
        break;
      }

      case "subscription_unpaused": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", String(data.id));

        if (error) {
          console.error("Error unpausing subscription:", error);
        }
        break;
      }

      case "subscription_payment_success": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: attrs?.renews_at ? new Date(attrs.renews_at).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", String(data.id));

        if (error) {
          console.error("Error updating payment success:", error);
        }
        break;
      }

      case "subscription_payment_failed": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", String(data.id));

        if (error) {
          console.error("Error updating payment failed:", error);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", eventName);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function mapLemonStatus(lemonStatus: string): string {
  switch (lemonStatus) {
    case "on_trial":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "cancelled":
      return "cancelled";
    case "expired":
      return "expired";
    case "paused":
      return "paused";
    default:
      return "active";
  }
}

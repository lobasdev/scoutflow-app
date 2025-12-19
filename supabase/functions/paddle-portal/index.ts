import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get subscription details
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("paddle_subscription_id, paddle_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) {
      console.error("Error fetching subscription:", subError);
      throw new Error("Failed to fetch subscription");
    }

    if (!subscription?.paddle_subscription_id) {
      throw new Error("No active subscription found");
    }

    // Fetch cancellation/management URL from Paddle API
    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    if (!paddleApiKey) {
      throw new Error("Paddle API key not configured");
    }

    // Get subscription details from Paddle
    const paddleResponse = await fetch(
      `https://api.paddle.com/subscriptions/${subscription.paddle_subscription_id}`,
      {
        headers: {
          "Authorization": `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!paddleResponse.ok) {
      const errorText = await paddleResponse.text();
      console.error("Paddle API error:", errorText);
      throw new Error("Failed to fetch subscription from Paddle");
    }

    const paddleData = await paddleResponse.json();
    const subscriptionData = paddleData.data;

    // Return the management URLs
    return new Response(
      JSON.stringify({
        management_urls: subscriptionData.management_urls || null,
        cancel_url: subscriptionData.management_urls?.cancel || null,
        update_payment_method_url: subscriptionData.management_urls?.update_payment_method || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Paddle portal error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
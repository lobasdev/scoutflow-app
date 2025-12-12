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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's subscription
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: subscription } = await serviceClient
      .from("subscriptions")
      .select("lemon_subscription_id, lemon_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!subscription?.lemon_subscription_id) {
      return new Response(JSON.stringify({ error: "No subscription found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get subscription details with update URLs
    const subscriptionResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemon_subscription_id}`,
      {
        headers: {
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );

    if (!subscriptionResponse.ok) {
      console.error("Failed to fetch subscription");
      return new Response(JSON.stringify({ error: "Failed to fetch subscription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subData = await subscriptionResponse.json();
    const urls = subData.data?.attributes?.urls;

    return new Response(JSON.stringify({
      update_payment_method_url: urls?.update_payment_method,
      customer_portal_url: urls?.customer_portal,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Manage subscription error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

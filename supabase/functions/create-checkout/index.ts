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

    const { redirect_url } = await req.json();

    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    const priceId = Deno.env.get("PADDLE_PRICE_ID");

    if (!paddleApiKey || !priceId) {
      console.error("Missing Paddle configuration");
      return new Response(JSON.stringify({ error: "Payment configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Paddle checkout URL directly (hosted checkout)
    // Format: https://buy.paddle.com/product/{priceId}?customer_email={email}&passthrough={customData}
    const successUrl = redirect_url || "https://scoutflow-app.lovable.app/dashboard?subscription=success";
    
    const customData = JSON.stringify({
      user_id: user.id,
      user_email: user.email,
    });
    
    // Use Paddle's hosted checkout URL format
    const checkoutUrl = new URL("https://checkout.paddle.com/checkout/custom-checkout");
    checkoutUrl.searchParams.set("items[0][price_id]", priceId);
    checkoutUrl.searchParams.set("items[0][quantity]", "1");
    checkoutUrl.searchParams.set("customer[email]", user.email || "");
    checkoutUrl.searchParams.set("custom_data", customData);
    checkoutUrl.searchParams.set("settings[success_url]", successUrl);
    checkoutUrl.searchParams.set("settings[theme]", "dark");

    console.log("Paddle checkout URL created:", checkoutUrl.toString());

    return new Response(JSON.stringify({ url: checkoutUrl.toString() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
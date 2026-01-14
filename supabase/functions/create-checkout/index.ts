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

    const successUrl = redirect_url || "https://scoutflow-app.lovable.app/dashboard?subscription=success";

    // Create a transaction via Paddle API (this will return a transaction ID we can use)
    const transactionResponse = await fetch("https://api.paddle.com/transactions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paddleApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        customer_email: user.email,
        custom_data: {
          user_id: user.id,
          user_email: user.email,
        },
        // Use 'manual' collection mode - returns transaction ID for client-side checkout
        collection_mode: "manual",
        checkout: {
          url: successUrl,
        },
      }),
    });

    if (!transactionResponse.ok) {
      const errorData = await transactionResponse.json();
      console.error("Paddle API error:", JSON.stringify(errorData));
      
      // Check if the error is about missing default payment link
      if (errorData?.error?.code === "transaction_default_checkout_url_not_set") {
        // Return transaction_id for client-side checkout instead
        return new Response(JSON.stringify({ 
          error: "paddle_config_needed",
          message: "Please set up a Default Payment Link in Paddle Dashboard → Checkout Settings"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to create checkout" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transactionData = await transactionResponse.json();
    const transactionId = transactionData.data?.id;
    const checkoutUrl = transactionData.data?.checkout?.url;
    
    console.log("Paddle transaction created:", { transactionId, checkoutUrl });

    // Return both transaction ID (for Paddle.js) and checkout URL (for redirect)
    return new Response(JSON.stringify({ 
      transaction_id: transactionId,
      url: checkoutUrl
    }), {
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

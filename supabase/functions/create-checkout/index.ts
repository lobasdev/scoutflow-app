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

    // First, check if customer exists or create one
    let customerId: string | null = null;
    
    // Search for existing customer by email
    const customerSearchResponse = await fetch(
      `https://api.paddle.com/customers?email=${encodeURIComponent(user.email || "")}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    if (customerSearchResponse.ok) {
      const customerData = await customerSearchResponse.json();
      if (customerData.data && customerData.data.length > 0) {
        customerId = customerData.data[0].id;
        console.log("Found existing customer:", customerId);
      }
    }
    
    // If no customer found, create one
    if (!customerId && user.email) {
      const createCustomerResponse = await fetch("https://api.paddle.com/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          custom_data: {
            user_id: user.id,
          },
        }),
      });
      
      if (createCustomerResponse.ok) {
        const newCustomer = await createCustomerResponse.json();
        customerId = newCustomer.data?.id;
        console.log("Created new customer:", customerId);
      }
    }

    // Return the price ID and customer info - let client-side Paddle.js handle the checkout
    // This avoids the "default payment link not set" API error
    console.log("Returning checkout data for client-side Paddle.js");
    
    return new Response(JSON.stringify({ 
      price_id: priceId,
      customer_id: customerId,
      customer_email: user.email,
      user_id: user.id,
      success_url: successUrl,
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

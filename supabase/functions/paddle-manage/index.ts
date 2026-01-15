import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "cancel" | "pause" | "resume";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId } = await req.json() as { action: Action; userId?: string };

    if (!action || !["cancel", "pause", "resume"].includes(action)) {
      throw new Error("Invalid action. Must be 'cancel', 'pause', or 'resume'");
    }

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

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user is admin (only admins can manage other users' subscriptions)
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!userRole;
    const targetUserId = userId && isAdmin ? userId : user.id;

    // Get subscription details
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("id, paddle_subscription_id, status")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (subError) {
      console.error("Error fetching subscription:", subError);
      throw new Error("Failed to fetch subscription");
    }

    if (!subscription?.paddle_subscription_id) {
      // No Paddle subscription - just update local database
      console.log("No Paddle subscription found, updating local database only");
      
      const statusMap: Record<Action, string> = {
        cancel: "cancelled",
        pause: "paused",
        resume: "active",
      };

      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({ 
          status: statusMap[action],
          ...(action === "cancel" ? { cancelled_at: new Date().toISOString() } : {})
        })
        .eq("id", subscription?.id);

      if (updateError) {
        throw new Error("Failed to update local subscription");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Subscription ${action}ed locally (no Paddle subscription)`,
          paddleSynced: false 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call Paddle API
    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    if (!paddleApiKey) {
      throw new Error("Paddle API key not configured");
    }

    let paddleResponse: Response;
    const baseUrl = `https://api.paddle.com/subscriptions/${subscription.paddle_subscription_id}`;

    if (action === "cancel") {
      paddleResponse = await fetch(`${baseUrl}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          effective_from: "next_billing_period", // Cancel at end of billing period
        }),
      });
    } else if (action === "pause") {
      paddleResponse = await fetch(`${baseUrl}/pause`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          effective_from: "next_billing_period",
        }),
      });
    } else if (action === "resume") {
      paddleResponse = await fetch(`${baseUrl}/resume`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          effective_from: "immediately",
        }),
      });
    } else {
      throw new Error("Invalid action");
    }

    if (!paddleResponse.ok) {
      const errorText = await paddleResponse.text();
      console.error(`Paddle API error for ${action}:`, errorText);
      
      // Try to parse the error
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error?.detail || `Paddle ${action} failed`);
      } catch {
        throw new Error(`Paddle ${action} failed: ${paddleResponse.status}`);
      }
    }

    const paddleData = await paddleResponse.json();
    console.log(`Paddle ${action} successful:`, paddleData);

    // Update local database to match
    const statusMap: Record<Action, string> = {
      cancel: "cancelled",
      pause: "paused",
      resume: "active",
    };

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({ 
        status: statusMap[action],
        ...(action === "cancel" ? { cancelled_at: new Date().toISOString() } : {})
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("Failed to update local subscription:", updateError);
      // Don't throw - Paddle action succeeded
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Subscription ${action}ed successfully`,
        paddleSynced: true,
        paddleStatus: paddleData.data?.status 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Paddle manage error:", error);
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

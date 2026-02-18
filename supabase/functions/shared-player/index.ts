import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing share token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the share record
    const { data: share, error: shareError } = await supabase
      .from("player_shares")
      .select("*")
      .eq("share_token", token)
      .eq("is_active", true)
      .single();

    if (shareError || !share) {
      return new Response(JSON.stringify({ error: "Invalid or expired share link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This share link has expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch full player profile
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("*")
      .eq("id", share.player_id)
      .single();

    if (playerError || !player) {
      return new Response(JSON.stringify({ error: "Player not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch observations
    const { data: observations } = await supabase
      .from("observations")
      .select("id, date, location, notes")
      .eq("player_id", share.player_id)
      .order("date", { ascending: false });

    // Fetch ratings
    const obsIds = observations?.map((o: any) => o.id) || [];
    let ratings: any[] = [];
    if (obsIds.length > 0) {
      const { data } = await supabase
        .from("ratings")
        .select("parameter, score")
        .in("observation_id", obsIds);
      ratings = data || [];
    }

    // Fetch injuries
    const { data: injuries } = await supabase
      .from("player_injuries")
      .select("*")
      .eq("player_id", share.player_id)
      .order("injury_date", { ascending: false });

    // Fetch scout name
    const { data: scout } = await supabase
      .from("scouts")
      .select("name, club")
      .eq("id", share.scout_id)
      .single();

    // Remove sensitive fields
    const { scout_id, football_data_id, stats_last_updated, ...safePlayer } = player;

    return new Response(
      JSON.stringify({
        player: safePlayer,
        observations: observations || [],
        ratings,
        injuries: injuries || [],
        sharedBy: scout ? { name: scout.name, club: scout.club } : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

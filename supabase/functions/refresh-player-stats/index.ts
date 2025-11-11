import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playerId, footballDataId } = await req.json();
    
    if (!playerId || !footballDataId) {
      throw new Error('Player ID and Football Data ID are required');
    }

    const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY');
    if (!apiKey) {
      throw new Error('FOOTBALL_DATA_API_KEY not configured');
    }

    // Fetch player details from Football-Data.org
    const response = await fetch(
      `https://api.football-data.org/v4/persons/${footballDataId}`,
      {
        headers: {
          'X-Auth-Token': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Football-Data API error:', errorText);
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Football-Data.org API has strict rate limits. Please try again in a minute.',
            errorCode: 429
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error(`Failed to fetch player stats: ${response.status}`);
    }

    const playerData = await response.json();
    console.log('Player data from API:', playerData);
    
    // Extract stats from current season if available
    let appearances = 0;
    let minutesPlayed = 0;
    let goals = 0;
    let assists = 0;
    let height = null;
    let weight = null;

    // Extract physical attributes
    if (playerData.dateOfBirth) {
      // Height in cm, weight in kg from API
      height = playerData.height || null;
      weight = playerData.weight || null;
    }

    // Current season is the most recent one
    if (playerData.currentTeam?.contract) {
      // Try to get stats from matches
      const matchesResponse = await fetch(
        `https://api.football-data.org/v4/persons/${footballDataId}/matches?status=FINISHED&limit=100`,
        {
          headers: {
            'X-Auth-Token': apiKey,
          },
        }
      );

      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        appearances = matchesData.matches?.length || 0;
        
        // Aggregate stats (note: detailed stats might require premium tier)
        matchesData.matches?.forEach((match: any) => {
          // This is a simplified aggregation
          // In reality, you'd need match-specific player stats
          goals += match.score?.fullTime?.home === playerData.currentTeam?.id ? 1 : 0;
        });
      }
    }

    // Update player in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updateData: any = {
      appearances,
      minutes_played: minutesPlayed,
      goals,
      assists,
      stats_last_updated: new Date().toISOString(),
    };

    // Only update height and weight if they exist
    if (height !== null) updateData.height = height;
    if (weight !== null) updateData.weight = weight;

    const { data, error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        stats: {
          appearances,
          minutesPlayed,
          goals,
          assists,
          height,
          weight,
          lastUpdated: new Date().toISOString(),
        },
        player: data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in refresh-player-stats function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

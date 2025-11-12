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

    console.log(`Fetching stats for player ${footballDataId}`);

    // Fetch player details from Football-Data.org (Person endpoint in v4)
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
    console.log('Player data from API:', JSON.stringify(playerData, null, 2));
    
    // Extract basic info
    let height = playerData.height || null;
    let weight = playerData.weight || null;
    let nationality = playerData.nationality || null;
    let position = playerData.position || null;
    let dateOfBirth = playerData.dateOfBirth || null;
    let currentTeam = playerData.currentTeam?.name || null;

    // Initialize stats
    let appearances = 0;
    let minutesPlayed = 0;
    let goals = 0;
    let assists = 0;

    // Fetch player matches to calculate statistics
    // Note: The free tier of football-data.org doesn't provide aggregated stats
    // We need to fetch matches and count them
    try {
      console.log(`Fetching matches for player ${footballDataId}`);
      
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
        const matches = matchesData.matches || [];
        
        console.log(`Found ${matches.length} finished matches`);

        // Count appearances
        appearances = matches.length;

        // Try to extract goals and assists from match data
        // Note: The free tier doesn't provide detailed player stats per match
        // This is a limitation of the API - detailed stats require premium tier
        matches.forEach((match: any) => {
          // We can only get basic match data without premium tier
          // Goals and assists per player are not available in free tier
          if (match.goals) {
            match.goals.forEach((goal: any) => {
              if (goal.scorer?.id === footballDataId) {
                goals++;
              }
              if (goal.assist?.id === footballDataId) {
                assists++;
              }
            });
          }
        });

        console.log(`Calculated stats - Appearances: ${appearances}, Goals: ${goals}, Assists: ${assists}`);
      } else {
        console.log(`Failed to fetch matches: ${matchesResponse.status}`);
      }
    } catch (matchError) {
      console.error('Error fetching matches:', matchError);
      // Continue with basic data even if matches fetch fails
    }

    // Update player in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updateData: any = {
      appearances,
      minutes_played: minutesPlayed, // Not available in free tier
      goals,
      assists,
      stats_last_updated: new Date().toISOString(),
    };

    // Update optional fields if available
    if (height !== null) updateData.height = height;
    if (weight !== null) updateData.weight = weight;
    if (nationality !== null) updateData.nationality = nationality;
    if (position !== null) updateData.position = position;
    if (dateOfBirth !== null) updateData.date_of_birth = dateOfBirth;
    if (currentTeam !== null) updateData.team = currentTeam;

    console.log('Updating player in database with:', updateData);

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

    console.log('Successfully updated player stats');

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
          nationality,
          position,
          dateOfBirth,
          team: currentTeam,
          lastUpdated: new Date().toISOString(),
        },
        player: data,
        note: 'Minutes played and detailed match statistics require premium API tier'
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

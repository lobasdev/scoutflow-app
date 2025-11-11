import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchQuery } = await req.json();
    
    if (!searchQuery || searchQuery.length < 2) {
      return new Response(
        JSON.stringify({ players: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY');
    if (!apiKey) {
      throw new Error('FOOTBALL_DATA_API_KEY not configured');
    }

    // Check cache
    const cacheKey = `search:${searchQuery.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached results for:', searchQuery);
      return new Response(
        JSON.stringify({ players: cached.data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search across major competitions for players
    const competitions = [2021, 2014, 2015, 2019, 2002]; // Premier League, La Liga, Ligue 1, Serie A, Bundesliga
    const allPlayers: any[] = [];
    
    for (const competitionId of competitions) {
      try {
        const response = await fetch(
          `https://api.football-data.org/v4/competitions/${competitionId}/teams`,
          {
            headers: {
              'X-Auth-Token': apiKey,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          // Search through teams and their squads
          for (const team of data.teams || []) {
            // Fetch team details to get squad
            const teamResponse = await fetch(
              `https://api.football-data.org/v4/teams/${team.id}`,
              {
                headers: {
                  'X-Auth-Token': apiKey,
                },
              }
            );

            if (teamResponse.ok) {
              const teamData = await teamResponse.json();
              const matchingPlayers = (teamData.squad || [])
                .filter((player: any) => 
                  player.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((player: any) => ({
                  id: player.id,
                  name: player.name,
                  position: player.position,
                  team: teamData.name,
                  nationality: player.nationality,
                  dateOfBirth: player.dateOfBirth,
                }));
              
              allPlayers.push(...matchingPlayers);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching competition ${competitionId}:`, error);
      }
    }

    // Remove duplicates and limit results
    const uniquePlayers = Array.from(
      new Map(allPlayers.map(p => [p.id, p])).values()
    ).slice(0, 10);

    // Cache results
    cache.set(cacheKey, { data: uniquePlayers, timestamp: Date.now() });

    return new Response(
      JSON.stringify({ players: uniquePlayers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in search-players function:', error);
    return new Response(
      JSON.stringify({ error: error.message, players: [] }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

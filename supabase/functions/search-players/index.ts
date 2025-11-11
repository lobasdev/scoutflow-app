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

    // Simplified search - just search one competition to reduce API calls
    // Free tier has very strict rate limits (10 calls/minute)
    const competitionId = 2021; // Premier League only for now
    const allPlayers: any[] = [];
    
    try {
      const response = await fetch(
        `https://api.football-data.org/v4/competitions/${competitionId}/teams`,
        {
          headers: {
            'X-Auth-Token': apiKey,
          },
        }
      );

      if (response.status === 429) {
        console.log('Rate limit hit, returning cached/empty results');
        return new Response(
          JSON.stringify({ players: [], rateLimited: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.ok) {
        const data = await response.json();
        
        // Limit team searches to first 5 teams to avoid rate limits
        const teamsToSearch = (data.teams || []).slice(0, 5);
        
        for (const team of teamsToSearch) {
          try {
            const teamResponse = await fetch(
              `https://api.football-data.org/v4/teams/${team.id}`,
              {
                headers: {
                  'X-Auth-Token': apiKey,
                },
              }
            );

            if (teamResponse.status === 429) {
              console.log('Rate limit hit on team fetch, stopping search');
              break;
            }

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
              
              // Stop if we found enough matches
              if (allPlayers.length >= 10) break;
            }
          } catch (error) {
            console.error(`Error fetching team ${team.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error in search:`, error);
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

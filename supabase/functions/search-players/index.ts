import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// All competitions to search across
const COMPETITION_CODES = ["WC", "CL", "BL1", "DED", "BSA", "PD", "FL1", "ELC", "PPL", "EC", "SA", "PL"];

// Map competition codes to IDs (from football-data.org API)
const COMPETITION_MAP: Record<string, number> = {
  "WC": 2000,   // FIFA World Cup
  "CL": 2001,   // UEFA Champions League
  "BL1": 2002,  // Bundesliga
  "DED": 2003,  // Eredivisie
  "BSA": 2013,  // Campeonato Brasileiro Série A
  "PD": 2014,   // La Liga
  "FL1": 2015,  // Ligue 1
  "ELC": 2016,  // Championship
  "PPL": 2017,  // Primeira Liga
  "EC": 2018,   // European Championship
  "SA": 2019,   // Serie A
  "PL": 2021,   // Premier League
};

// Rate limiting: add delay between requests to avoid 429 errors
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Map football-data.org positions to our position constants
const mapFootballDataPosition = (position: string | null): string => {
  if (!position) return "";
  
  const positionLower = position.toLowerCase();
  
  // Goalkeeper
  if (positionLower.includes("goalkeeper") || positionLower.includes("goalie")) {
    return "GK";
  }
  
  // Defenders
  if (positionLower.includes("centre-back") || positionLower.includes("central defender") || positionLower === "defender") {
    return "CB";
  }
  if (positionLower.includes("left-back") || positionLower.includes("left back")) {
    return "LB";
  }
  if (positionLower.includes("right-back") || positionLower.includes("right back")) {
    return "RB";
  }
  
  // Midfielders
  if (positionLower.includes("defensive midfield") || positionLower.includes("holding midfield")) {
    return "DM";
  }
  if (positionLower.includes("central midfield") || positionLower === "midfield") {
    return "CM";
  }
  if (positionLower.includes("attacking midfield")) {
    return "CAM";
  }
  if (positionLower.includes("left midfield")) {
    return "LM";
  }
  if (positionLower.includes("right midfield")) {
    return "RM";
  }
  
  // Wingers
  if (positionLower.includes("left wing")) {
    return "LW";
  }
  if (positionLower.includes("right wing")) {
    return "RW";
  }
  
  // Forwards
  if (positionLower.includes("centre-forward") || positionLower.includes("central forward")) {
    return "CF";
  }
  if (positionLower.includes("striker") || positionLower.includes("attacker") || positionLower === "offence") {
    return "ST";
  }
  
  // If no match, return the original position
  return position;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchQuery } = await req.json();
    
    if (!searchQuery || searchQuery.trim().length < 2) {
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

    console.log('Searching for players:', searchQuery);

    const allPlayers: any[] = [];
    const searchLower = searchQuery.toLowerCase();
    let requestCount = 0;

    // Search across all competitions
    for (const code of COMPETITION_CODES) {
      const competitionId = COMPETITION_MAP[code];
      if (!competitionId) continue;

      try {
        console.log(`Searching in competition ${code} (ID: ${competitionId})`);
        
        // Add delay to respect rate limits (free tier: 10 requests/minute)
        if (requestCount > 0) {
          await delay(6000); // 6 seconds between requests
        }
        requestCount++;

        const teamsResponse = await fetch(
          `https://api.football-data.org/v4/competitions/${competitionId}/teams`,
          {
            headers: {
              'X-Auth-Token': apiKey,
            },
          }
        );

        if (!teamsResponse.ok) {
          if (teamsResponse.status === 429) {
            console.log('Rate limit hit, waiting 60 seconds...');
            await delay(60000);
            continue;
          }
          console.error(`Failed to fetch teams for ${code}:`, teamsResponse.status);
          continue;
        }

        const teamsData = await teamsResponse.json();

        // Search through all team squads
        for (const team of teamsData.teams || []) {
          if (team.squad) {
            for (const player of team.squad) {
              if (player.name.toLowerCase().includes(searchLower)) {
                // Check if player already exists (avoid duplicates)
                const exists = allPlayers.some(p => p.id === player.id);
                if (!exists) {
                  allPlayers.push({
                    id: player.id,
                    name: player.name,
                    position: mapFootballDataPosition(player.position),
                    dateOfBirth: player.dateOfBirth,
                    nationality: player.nationality,
                    team: team.name,
                    teamId: team.id,
                    competition: code,
                  });
                }
                
                // Limit results to avoid overwhelming the UI
                if (allPlayers.length >= 15) {
                  break;
                }
              }
            }
          }
          
          if (allPlayers.length >= 15) {
            break;
          }
        }

        // If we found enough players, stop searching
        if (allPlayers.length >= 15) {
          break;
        }

      } catch (error) {
        console.error(`Error searching competition ${code}:`, error);
        continue;
      }
    }

    // Remove duplicates by player ID (just in case)
    const uniquePlayers = Array.from(
      new Map(allPlayers.map(p => [p.id, p])).values()
    );

    // Cache the results
    cache.set(cacheKey, {
      data: uniquePlayers,
      timestamp: Date.now(),
    });

    console.log(`Found ${uniquePlayers.length} players matching "${searchQuery}"`);

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

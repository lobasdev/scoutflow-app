-- Add Football-Data.org integration columns to players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS football_data_id INTEGER,
ADD COLUMN IF NOT EXISTS appearances INTEGER,
ADD COLUMN IF NOT EXISTS minutes_played INTEGER,
ADD COLUMN IF NOT EXISTS goals INTEGER,
ADD COLUMN IF NOT EXISTS assists INTEGER,
ADD COLUMN IF NOT EXISTS foot TEXT,
ADD COLUMN IF NOT EXISTS stats_last_updated TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_football_data_id ON public.players(football_data_id);
-- Add is_starter column to match_players table
ALTER TABLE public.match_players 
ADD COLUMN IF NOT EXISTS is_starter BOOLEAN NOT NULL DEFAULT true;

-- Update existing players: first 11 per team are starters
WITH ranked_players AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY match_id, team ORDER BY created_at) as rn
  FROM public.match_players
)
UPDATE public.match_players mp
SET is_starter = (rp.rn <= 11)
FROM ranked_players rp
WHERE mp.id = rp.id;
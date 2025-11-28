-- Update RLS policies for observations to allow quick observations (null player_id) linked to matches
DROP POLICY IF EXISTS "Scouts can view own observations" ON public.observations;
DROP POLICY IF EXISTS "Scouts can insert own observations" ON public.observations;
DROP POLICY IF EXISTS "Scouts can update own observations" ON public.observations;
DROP POLICY IF EXISTS "Scouts can delete own observations" ON public.observations;

-- Allow viewing observations where either player belongs to scout OR match belongs to scout
CREATE POLICY "Scouts can view own observations" 
ON public.observations 
FOR SELECT 
USING (
  (player_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM players 
    WHERE players.id = observations.player_id 
    AND players.scout_id = auth.uid()
  ))
  OR
  (match_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM matches 
    WHERE matches.id = observations.match_id 
    AND matches.scout_id = auth.uid()
  ))
);

-- Allow inserting observations where either player belongs to scout OR match belongs to scout
CREATE POLICY "Scouts can insert own observations" 
ON public.observations 
FOR INSERT 
WITH CHECK (
  (player_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM players 
    WHERE players.id = observations.player_id 
    AND players.scout_id = auth.uid()
  ))
  OR
  (match_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM matches 
    WHERE matches.id = observations.match_id 
    AND matches.scout_id = auth.uid()
  ))
);

-- Allow updating observations where either player belongs to scout OR match belongs to scout
CREATE POLICY "Scouts can update own observations" 
ON public.observations 
FOR UPDATE 
USING (
  (player_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM players 
    WHERE players.id = observations.player_id 
    AND players.scout_id = auth.uid()
  ))
  OR
  (match_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM matches 
    WHERE matches.id = observations.match_id 
    AND matches.scout_id = auth.uid()
  ))
);

-- Allow deleting observations where either player belongs to scout OR match belongs to scout
CREATE POLICY "Scouts can delete own observations" 
ON public.observations 
FOR DELETE 
USING (
  (player_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM players 
    WHERE players.id = observations.player_id 
    AND players.scout_id = auth.uid()
  ))
  OR
  (match_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM matches 
    WHERE matches.id = observations.match_id 
    AND matches.scout_id = auth.uid()
  ))
);
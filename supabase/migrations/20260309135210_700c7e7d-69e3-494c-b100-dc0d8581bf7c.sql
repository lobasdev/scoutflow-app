
-- Add visibility and scouting_team_id columns to players table
ALTER TABLE public.players 
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS scouting_team_id uuid REFERENCES public.scouting_teams(id) ON DELETE SET NULL;

-- Create index for team player queries
CREATE INDEX IF NOT EXISTS idx_players_scouting_team ON public.players(scouting_team_id) WHERE scouting_team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_visibility ON public.players(visibility);

-- RLS: Team members can view team-tagged players in their team
CREATE POLICY "Team members can view team players"
ON public.players
FOR SELECT
TO authenticated
USING (
  visibility = 'team' 
  AND scouting_team_id IS NOT NULL 
  AND is_team_member_of(auth.uid(), scouting_team_id)
);

-- RLS: Team members can insert team players
CREATE POLICY "Team members can insert team players"
ON public.players
FOR INSERT
TO authenticated
WITH CHECK (
  (visibility = 'private' AND scout_id = auth.uid())
  OR (visibility = 'team' AND scouting_team_id IS NOT NULL AND scout_id = auth.uid() AND is_team_member_of(auth.uid(), scouting_team_id))
);

-- RLS: Chief scout or creator can update team players
CREATE POLICY "Team members can update team players"
ON public.players
FOR UPDATE
TO authenticated
USING (
  visibility = 'team' 
  AND scouting_team_id IS NOT NULL 
  AND (scout_id = auth.uid() OR is_chief_scout(auth.uid(), scouting_team_id))
);

-- RLS: Chief scout or creator can delete team players
CREATE POLICY "Team members can delete team players"
ON public.players
FOR DELETE
TO authenticated
USING (
  visibility = 'team' 
  AND scouting_team_id IS NOT NULL 
  AND (scout_id = auth.uid() OR is_chief_scout(auth.uid(), scouting_team_id))
);

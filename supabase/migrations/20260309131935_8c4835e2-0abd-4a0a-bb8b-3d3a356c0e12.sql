
-- Chief scout verdicts / consensus ratings on team players
CREATE TABLE public.team_player_verdicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_player_id UUID NOT NULL REFERENCES public.team_players(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  recommendation TEXT,
  summary TEXT,
  consensus_ratings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_player_id)
);

ALTER TABLE public.team_player_verdicts ENABLE ROW LEVEL SECURITY;

-- Team members can view verdicts
CREATE POLICY "Team members can view verdicts"
  ON public.team_player_verdicts
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_players tp
    WHERE tp.id = team_player_verdicts.team_player_id
    AND is_team_member_of(auth.uid(), tp.team_id)
  ));

-- Chief scout can manage verdicts
CREATE POLICY "Chief scout can manage verdicts"
  ON public.team_player_verdicts
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_players tp
    WHERE tp.id = team_player_verdicts.team_player_id
    AND is_chief_scout(auth.uid(), tp.team_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_players tp
    WHERE tp.id = team_player_verdicts.team_player_id
    AND is_chief_scout(auth.uid(), tp.team_id)
  ));

ALTER TABLE public.shortlists ADD COLUMN IF NOT EXISTS scouting_team_id uuid REFERENCES public.scouting_teams(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_shortlists_scouting_team ON public.shortlists(scouting_team_id);

CREATE OR REPLACE FUNCTION public.can_access_shortlist(_user_id uuid, _shortlist_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shortlists s
    WHERE s.id = _shortlist_id
      AND (s.scout_id = _user_id
        OR (s.scouting_team_id IS NOT NULL AND public.is_team_member_of(_user_id, s.scouting_team_id)))
  )
$$;

CREATE POLICY "Team members can view team shortlists" ON public.shortlists
FOR SELECT TO authenticated
USING (scouting_team_id IS NOT NULL AND public.is_team_member_of(auth.uid(), scouting_team_id));

CREATE POLICY "Chief scouts can update team shortlists" ON public.shortlists
FOR UPDATE TO authenticated
USING (scouting_team_id IS NOT NULL AND public.is_chief_scout(auth.uid(), scouting_team_id));

DROP POLICY IF EXISTS "Scouts can view own player shortlists" ON public.player_shortlists;
DROP POLICY IF EXISTS "Scouts can insert into own shortlists" ON public.player_shortlists;
DROP POLICY IF EXISTS "Scouts can update own player shortlists" ON public.player_shortlists;
DROP POLICY IF EXISTS "Scouts can delete from own shortlists" ON public.player_shortlists;

CREATE POLICY "Scouts can view accessible player shortlists" ON public.player_shortlists
FOR SELECT TO authenticated USING (public.can_access_shortlist(auth.uid(), shortlist_id));
CREATE POLICY "Scouts can insert into accessible shortlists" ON public.player_shortlists
FOR INSERT TO authenticated WITH CHECK (public.can_access_shortlist(auth.uid(), shortlist_id));
CREATE POLICY "Scouts can update accessible player shortlists" ON public.player_shortlists
FOR UPDATE TO authenticated USING (public.can_access_shortlist(auth.uid(), shortlist_id))
WITH CHECK (public.can_access_shortlist(auth.uid(), shortlist_id));
CREATE POLICY "Scouts can delete from accessible shortlists" ON public.player_shortlists
FOR DELETE TO authenticated USING (public.can_access_shortlist(auth.uid(), shortlist_id));
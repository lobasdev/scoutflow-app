-- Add admin SELECT policies for tables missing admin visibility
CREATE POLICY "Admins can view all matches"
ON public.matches
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all teams"
ON public.teams
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all tournaments"
ON public.tournaments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all shortlists"
ON public.shortlists
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all inbox players"
ON public.inbox_players
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add missing UPDATE policy for player_shortlists (needed for drag-and-drop reordering)
CREATE POLICY "Scouts can update own player shortlists"
ON public.player_shortlists
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM shortlists
  WHERE shortlists.id = player_shortlists.shortlist_id
  AND shortlists.scout_id = auth.uid()
));

-- Add missing UPDATE policy for voice_notes
CREATE POLICY "Scouts can update own voice notes"
ON public.voice_notes
FOR UPDATE
TO authenticated
USING (auth.uid() = scout_id);
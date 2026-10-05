ALTER POLICY "Scouts can update own player shortlists" ON public.player_shortlists
WITH CHECK (EXISTS (SELECT 1 FROM public.shortlists WHERE shortlists.id = player_shortlists.shortlist_id AND shortlists.scout_id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_shortlists TO authenticated;
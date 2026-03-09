-- Allow team members to view scout profiles of their teammates
CREATE POLICY "Team members can view teammate profiles"
ON public.scouts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = scouts.id
      AND tm1.status = 'active'
      AND tm2.status = 'active'
  )
);
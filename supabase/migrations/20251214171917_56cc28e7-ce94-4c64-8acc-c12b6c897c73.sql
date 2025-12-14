-- Allow admins to view all scouts
CREATE POLICY "Admins can view all scouts"
ON public.scouts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to view all players (for stats)
CREATE POLICY "Admins can view all players"
ON public.players
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to view all observations (for stats)
CREATE POLICY "Admins can view all observations"
ON public.observations
FOR SELECT
USING (has_role(auth.uid(), 'admin'));
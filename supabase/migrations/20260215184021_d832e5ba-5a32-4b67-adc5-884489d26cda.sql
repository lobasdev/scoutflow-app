
CREATE OR REPLACE FUNCTION public.count_observations_without_ratings(_scout_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM observations o
  JOIN players p ON p.id = o.player_id
  WHERE p.scout_id = _scout_id
    AND NOT EXISTS (
      SELECT 1 FROM ratings r WHERE r.observation_id = o.id
    );
$$;


-- Use DO block to add constraints only if they don't exist
DO $$
BEGIN
  -- match_players
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_players_match_id_fkey') THEN
    ALTER TABLE public.match_players ADD CONSTRAINT match_players_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_players_observation_id_fkey') THEN
    ALTER TABLE public.match_players ADD CONSTRAINT match_players_observation_id_fkey FOREIGN KEY (observation_id) REFERENCES public.observations(id) ON DELETE SET NULL;
  END IF;

  -- ratings
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ratings_observation_id_fkey') THEN
    ALTER TABLE public.ratings ADD CONSTRAINT ratings_observation_id_fkey FOREIGN KEY (observation_id) REFERENCES public.observations(id) ON DELETE CASCADE;
  END IF;

  -- tournament_players
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_players_tournament_id_fkey') THEN
    ALTER TABLE public.tournament_players ADD CONSTRAINT tournament_players_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_players_match_id_fkey') THEN
    ALTER TABLE public.tournament_players ADD CONSTRAINT tournament_players_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.tournament_matches(id) ON DELETE SET NULL;
  END IF;

  -- voice_notes
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voice_notes_player_id_fkey') THEN
    ALTER TABLE public.voice_notes ADD CONSTRAINT voice_notes_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voice_notes_match_id_fkey') THEN
    ALTER TABLE public.voice_notes ADD CONSTRAINT voice_notes_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;
  END IF;

  -- observations
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'observations_player_id_fkey') THEN
    ALTER TABLE public.observations ADD CONSTRAINT observations_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'observations_match_id_fkey') THEN
    ALTER TABLE public.observations ADD CONSTRAINT observations_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE SET NULL;
  END IF;

  -- tournament_matches
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_matches_tournament_id_fkey') THEN
    ALTER TABLE public.tournament_matches ADD CONSTRAINT tournament_matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;
  END IF;
END $$;

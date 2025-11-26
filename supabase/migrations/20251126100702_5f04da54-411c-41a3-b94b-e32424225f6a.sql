-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scout_id UUID NOT NULL,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add match_id to observations table
ALTER TABLE public.observations
ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL;

-- Enable RLS on matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for matches
CREATE POLICY "Scouts can view own matches"
  ON public.matches FOR SELECT
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can insert own matches"
  ON public.matches FOR INSERT
  WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can update own matches"
  ON public.matches FOR UPDATE
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete own matches"
  ON public.matches FOR DELETE
  USING (auth.uid() = scout_id);

-- Create updated_at trigger for matches
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create match_players table for quick observations during matches
CREATE TABLE IF NOT EXISTS public.match_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('home', 'away')),
  name TEXT NOT NULL,
  position TEXT,
  shirt_number TEXT,
  observation_id UUID REFERENCES public.observations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on match_players
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- RLS policies for match_players (inherit from match)
CREATE POLICY "Scouts can view players from own matches"
  ON public.match_players FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = match_players.match_id
    AND matches.scout_id = auth.uid()
  ));

CREATE POLICY "Scouts can insert players in own matches"
  ON public.match_players FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = match_players.match_id
    AND matches.scout_id = auth.uid()
  ));

CREATE POLICY "Scouts can update players in own matches"
  ON public.match_players FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = match_players.match_id
    AND matches.scout_id = auth.uid()
  ));

CREATE POLICY "Scouts can delete players from own matches"
  ON public.match_players FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = match_players.match_id
    AND matches.scout_id = auth.uid()
  ));
-- Create inbox_players table for quick player captures
CREATE TABLE public.inbox_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scout_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  shirt_number TEXT,
  team TEXT,
  nationality TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on inbox_players
ALTER TABLE public.inbox_players ENABLE ROW LEVEL SECURITY;

-- RLS policies for inbox_players
CREATE POLICY "Scouts can view own inbox players"
  ON public.inbox_players FOR SELECT
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can insert own inbox players"
  ON public.inbox_players FOR INSERT
  WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can update own inbox players"
  ON public.inbox_players FOR UPDATE
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete own inbox players"
  ON public.inbox_players FOR DELETE
  USING (auth.uid() = scout_id);

-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scout_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- RLS policies for tournaments
CREATE POLICY "Scouts can view own tournaments"
  ON public.tournaments FOR SELECT
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can insert own tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can update own tournaments"
  ON public.tournaments FOR UPDATE
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete own tournaments"
  ON public.tournaments FOR DELETE
  USING (auth.uid() = scout_id);

-- Create tournament_matches table
CREATE TABLE public.tournament_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  match_date DATE NOT NULL,
  home_team TEXT,
  away_team TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tournament_matches
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for tournament_matches
CREATE POLICY "Scouts can view matches from own tournaments"
  ON public.tournament_matches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tournaments 
    WHERE tournaments.id = tournament_matches.tournament_id 
    AND tournaments.scout_id = auth.uid()
  ));

CREATE POLICY "Scouts can insert matches in own tournaments"
  ON public.tournament_matches FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tournaments 
    WHERE tournaments.id = tournament_matches.tournament_id 
    AND tournaments.scout_id = auth.uid()
  ));

CREATE POLICY "Scouts can update matches in own tournaments"
  ON public.tournament_matches FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM tournaments 
    WHERE tournaments.id = tournament_matches.tournament_id 
    AND tournaments.scout_id = auth.uid()
  ));

CREATE POLICY "Scouts can delete matches from own tournaments"
  ON public.tournament_matches FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM tournaments 
    WHERE tournaments.id = tournament_matches.tournament_id 
    AND tournaments.scout_id = auth.uid()
  ));

-- Create tournament_players table for quick player tracking during tournaments
CREATE TABLE public.tournament_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  shirt_number TEXT,
  team TEXT,
  nationality TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  observation_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tournament_players
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

-- RLS policies for tournament_players
CREATE POLICY "Scouts can view players from own tournaments"
  ON public.tournament_players FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tournaments 
    WHERE tournaments.id = tournament_players.tournament_id 
    AND tournaments.scout_id = auth.uid()
  ));

CREATE POLICY "Scouts can insert players in own tournaments"
  ON public.tournament_players FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tournaments 
    WHERE tournaments.id = tournament_players.tournament_id 
    AND tournaments.scout_id = auth.uid()
  ));

CREATE POLICY "Scouts can update players in own tournaments"
  ON public.tournament_players FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM tournaments 
    WHERE tournaments.id = tournament_players.tournament_id 
    AND tournaments.scout_id = auth.uid()
  ));

CREATE POLICY "Scouts can delete players from own tournaments"
  ON public.tournament_players FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM tournaments 
    WHERE tournaments.id = tournament_players.tournament_id 
    AND tournaments.scout_id = auth.uid()
  ));

-- Create scout_preferences table for sorting and other preferences
CREATE TABLE public.scout_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scout_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_player_sort TEXT DEFAULT 'created_at_desc',
  default_inbox_sort TEXT DEFAULT 'created_at_desc',
  default_tournament_sort TEXT DEFAULT 'created_at_desc',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on scout_preferences
ALTER TABLE public.scout_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for scout_preferences
CREATE POLICY "Scouts can view own preferences"
  ON public.scout_preferences FOR SELECT
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can insert own preferences"
  ON public.scout_preferences FOR INSERT
  WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can update own preferences"
  ON public.scout_preferences FOR UPDATE
  USING (auth.uid() = scout_id);

-- Create triggers for updated_at
CREATE TRIGGER update_inbox_players_updated_at
  BEFORE UPDATE ON public.inbox_players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournament_players_updated_at
  BEFORE UPDATE ON public.tournament_players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scout_preferences_updated_at
  BEFORE UPDATE ON public.scout_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
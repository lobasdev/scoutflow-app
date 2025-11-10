-- Create scouts profiles table
CREATE TABLE public.scouts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scouts ENABLE ROW LEVEL SECURITY;

-- Scouts can view and update their own profile
CREATE POLICY "Scouts can view own profile"
  ON public.scouts FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Scouts can update own profile"
  ON public.scouts FOR UPDATE
  USING (auth.uid() = id);

-- Create players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id UUID NOT NULL REFERENCES public.scouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  position TEXT,
  team TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Scouts can manage their own players
CREATE POLICY "Scouts can view own players"
  ON public.players FOR SELECT
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can insert own players"
  ON public.players FOR INSERT
  WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can update own players"
  ON public.players FOR UPDATE
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete own players"
  ON public.players FOR DELETE
  USING (auth.uid() = scout_id);

-- Create observations table
CREATE TABLE public.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  location TEXT,
  notes TEXT,
  video_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;

-- Scouts can manage observations for their players
CREATE POLICY "Scouts can view own observations"
  ON public.observations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = observations.player_id
      AND players.scout_id = auth.uid()
    )
  );

CREATE POLICY "Scouts can insert own observations"
  ON public.observations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = player_id
      AND players.scout_id = auth.uid()
    )
  );

CREATE POLICY "Scouts can update own observations"
  ON public.observations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = observations.player_id
      AND players.scout_id = auth.uid()
    )
  );

CREATE POLICY "Scouts can delete own observations"
  ON public.observations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = observations.player_id
      AND players.scout_id = auth.uid()
    )
  );

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id UUID NOT NULL REFERENCES public.observations(id) ON DELETE CASCADE,
  parameter TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Scouts can manage ratings for their observations
CREATE POLICY "Scouts can view own ratings"
  ON public.ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.observations
      JOIN public.players ON players.id = observations.player_id
      WHERE observations.id = ratings.observation_id
      AND players.scout_id = auth.uid()
    )
  );

CREATE POLICY "Scouts can insert own ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.observations
      JOIN public.players ON players.id = observations.player_id
      WHERE observations.id = observation_id
      AND players.scout_id = auth.uid()
    )
  );

CREATE POLICY "Scouts can update own ratings"
  ON public.ratings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.observations
      JOIN public.players ON players.id = observations.player_id
      WHERE observations.id = ratings.observation_id
      AND players.scout_id = auth.uid()
    )
  );

CREATE POLICY "Scouts can delete own ratings"
  ON public.ratings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.observations
      JOIN public.players ON players.id = observations.player_id
      WHERE observations.id = ratings.observation_id
      AND players.scout_id = auth.uid()
    )
  );

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamps
CREATE TRIGGER update_scouts_updated_at
  BEFORE UPDATE ON public.scouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_observations_updated_at
  BEFORE UPDATE ON public.observations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create scout profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_scout()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.scouts (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Scout'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_scout();
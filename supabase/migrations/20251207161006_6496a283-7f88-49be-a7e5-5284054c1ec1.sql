-- Create teams table for opposition analysis
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scout_id UUID NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  league TEXT,
  stadium TEXT,
  founded_year INTEGER,
  manager TEXT,
  
  -- Tactical analysis
  formations TEXT[] DEFAULT '{}',
  game_model TEXT,
  coaching_style TEXT,
  pressing_style TEXT,
  build_up_play TEXT,
  defensive_approach TEXT,
  set_piece_quality TEXT,
  
  -- Squad analysis
  key_players TEXT[] DEFAULT '{}',
  squad_overview TEXT,
  squad_age_profile TEXT,
  squad_depth_rating INTEGER CHECK (squad_depth_rating >= 1 AND squad_depth_rating <= 10),
  
  -- SWOT Analysis
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  opportunities TEXT[] DEFAULT '{}',
  threats TEXT[] DEFAULT '{}',
  
  -- Links and media
  video_links TEXT[] DEFAULT '{}',
  report_links TEXT[] DEFAULT '{}',
  logo_url TEXT,
  
  -- Scout insights
  scout_notes TEXT,
  recommendation TEXT,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 10),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Scouts can view own teams"
ON public.teams FOR SELECT
USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can insert own teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can update own teams"
ON public.teams FOR UPDATE
USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete own teams"
ON public.teams FOR DELETE
USING (auth.uid() = scout_id);

-- Create trigger for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
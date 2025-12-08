-- Add new fields for Team feature enhancements
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS draws INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS goals_for INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS goals_against INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clean_sheets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS key_findings TEXT,
ADD COLUMN IF NOT EXISTS opposition_report TEXT,
ADD COLUMN IF NOT EXISTS tactical_shape TEXT,
ADD COLUMN IF NOT EXISTS attacking_patterns TEXT,
ADD COLUMN IF NOT EXISTS defensive_patterns TEXT,
ADD COLUMN IF NOT EXISTS transition_play TEXT;

-- Drop overall_rating as user said it doesn't make sense
ALTER TABLE public.teams DROP COLUMN IF EXISTS overall_rating;

-- Create storage bucket for team logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for team logos
CREATE POLICY "Team logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-logos');

CREATE POLICY "Authenticated users can upload team logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own team logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'team-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own team logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'team-logos' AND auth.role() = 'authenticated');

-- Add team_id to players table for optional linking
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
-- Create storage buckets for player photos and attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('player-photos', 'player-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('player-attachments', 'player-attachments', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'video/quicktime']);

-- Create table for tracking player attachments
CREATE TABLE public.player_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for player_attachments table
CREATE POLICY "Scouts can view own player attachments"
ON public.player_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM players
    WHERE players.id = player_attachments.player_id
    AND players.scout_id = auth.uid()
  )
);

CREATE POLICY "Scouts can insert own player attachments"
ON public.player_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM players
    WHERE players.id = player_attachments.player_id
    AND players.scout_id = auth.uid()
  )
);

CREATE POLICY "Scouts can delete own player attachments"
ON public.player_attachments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM players
    WHERE players.id = player_attachments.player_id
    AND players.scout_id = auth.uid()
  )
);

-- Storage policies for player-photos bucket
CREATE POLICY "Scouts can upload their player photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'player-photos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM players WHERE scout_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view player photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-photos');

CREATE POLICY "Scouts can update their player photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'player-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM players WHERE scout_id = auth.uid()
  )
);

CREATE POLICY "Scouts can delete their player photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'player-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM players WHERE scout_id = auth.uid()
  )
);

-- Storage policies for player-attachments bucket
CREATE POLICY "Scouts can upload attachments for their players"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'player-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM players WHERE scout_id = auth.uid()
  )
);

CREATE POLICY "Scouts can view their player attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'player-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM players WHERE scout_id = auth.uid()
  )
);

CREATE POLICY "Scouts can delete their player attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'player-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM players WHERE scout_id = auth.uid()
  )
);
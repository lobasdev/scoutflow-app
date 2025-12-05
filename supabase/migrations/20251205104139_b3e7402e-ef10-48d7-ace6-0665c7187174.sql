-- Create voice_notes table
CREATE TABLE public.voice_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scout_id UUID NOT NULL,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure note belongs to either player or match, not both
  CONSTRAINT voice_note_belongs_to_one CHECK (
    (player_id IS NOT NULL AND match_id IS NULL) OR
    (player_id IS NULL AND match_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Scouts can view own voice notes"
ON public.voice_notes FOR SELECT
USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can insert own voice notes"
ON public.voice_notes FOR INSERT
WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete own voice notes"
ON public.voice_notes FOR DELETE
USING (auth.uid() = scout_id);

-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', false);

-- Storage policies
CREATE POLICY "Scouts can upload voice notes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Scouts can view own voice notes"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Scouts can delete own voice notes"
ON storage.objects FOR DELETE
USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);
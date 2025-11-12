-- Create shortlists table
CREATE TABLE public.shortlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scout_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for players in shortlists
CREATE TABLE public.player_shortlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shortlist_id UUID NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shortlist_id, player_id)
);

-- Enable RLS
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_shortlists ENABLE ROW LEVEL SECURITY;

-- RLS policies for shortlists
CREATE POLICY "Scouts can view own shortlists"
ON public.shortlists FOR SELECT
USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can insert own shortlists"
ON public.shortlists FOR INSERT
WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can update own shortlists"
ON public.shortlists FOR UPDATE
USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete own shortlists"
ON public.shortlists FOR DELETE
USING (auth.uid() = scout_id);

-- RLS policies for player_shortlists
CREATE POLICY "Scouts can view own player shortlists"
ON public.player_shortlists FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shortlists
    WHERE shortlists.id = player_shortlists.shortlist_id
    AND shortlists.scout_id = auth.uid()
  )
);

CREATE POLICY "Scouts can insert into own shortlists"
ON public.player_shortlists FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shortlists
    WHERE shortlists.id = player_shortlists.shortlist_id
    AND shortlists.scout_id = auth.uid()
  )
);

CREATE POLICY "Scouts can delete from own shortlists"
ON public.player_shortlists FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM shortlists
    WHERE shortlists.id = player_shortlists.shortlist_id
    AND shortlists.scout_id = auth.uid()
  )
);

-- Trigger for updating shortlists updated_at
CREATE TRIGGER update_shortlists_updated_at
BEFORE UPDATE ON public.shortlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
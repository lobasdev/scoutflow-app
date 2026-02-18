
-- ============================================
-- 1. PLAYER INJURIES TABLE
-- ============================================
CREATE TABLE public.player_injuries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  injury_type TEXT NOT NULL,
  body_part TEXT,
  severity TEXT CHECK (severity IN ('minor', 'moderate', 'severe', 'career-threatening')),
  injury_date DATE NOT NULL,
  return_date DATE,
  days_missed INTEGER,
  surgery_required BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.player_injuries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scouts can view own player injuries"
  ON public.player_injuries FOR SELECT
  USING (EXISTS (SELECT 1 FROM players WHERE players.id = player_injuries.player_id AND players.scout_id = auth.uid()));

CREATE POLICY "Scouts can insert own player injuries"
  ON public.player_injuries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE players.id = player_injuries.player_id AND players.scout_id = auth.uid()));

CREATE POLICY "Scouts can update own player injuries"
  ON public.player_injuries FOR UPDATE
  USING (EXISTS (SELECT 1 FROM players WHERE players.id = player_injuries.player_id AND players.scout_id = auth.uid()));

CREATE POLICY "Scouts can delete own player injuries"
  ON public.player_injuries FOR DELETE
  USING (EXISTS (SELECT 1 FROM players WHERE players.id = player_injuries.player_id AND players.scout_id = auth.uid()));

CREATE TRIGGER update_player_injuries_updated_at
  BEFORE UPDATE ON public.player_injuries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. PLAYER SHARES TABLE (public read-only links)
-- ============================================
CREATE TABLE public.player_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  scout_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.player_shares ENABLE ROW LEVEL SECURITY;

-- Scouts manage their own shares
CREATE POLICY "Scouts can view own shares"
  ON public.player_shares FOR SELECT
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can insert own shares"
  ON public.player_shares FOR INSERT
  WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete own shares"
  ON public.player_shares FOR DELETE
  USING (auth.uid() = scout_id);

-- Public read access via share token (for the edge function, not direct client)
-- We'll use an edge function to serve public data, so no anon policy needed.

-- ============================================
-- 3. SCOUT TASKS TABLE (Kanban)
-- ============================================
CREATE TABLE public.scout_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scout_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scout_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scouts can view own tasks"
  ON public.scout_tasks FOR SELECT
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can insert own tasks"
  ON public.scout_tasks FOR INSERT
  WITH CHECK (auth.uid() = scout_id);

CREATE POLICY "Scouts can update own tasks"
  ON public.scout_tasks FOR UPDATE
  USING (auth.uid() = scout_id);

CREATE POLICY "Scouts can delete own tasks"
  ON public.scout_tasks FOR DELETE
  USING (auth.uid() = scout_id);

CREATE TRIGGER update_scout_tasks_updated_at
  BEFORE UPDATE ON public.scout_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

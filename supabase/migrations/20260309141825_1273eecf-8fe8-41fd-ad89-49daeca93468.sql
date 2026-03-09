
-- Chief Scout Feedback table (polymorphic: observation, assignment, task, general)
CREATE TABLE public.chief_scout_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.scouting_teams(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  target_scout_id uuid NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('observation', 'assignment', 'task', 'general')),
  reference_id uuid,
  comment text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chief_scout_feedback ENABLE ROW LEVEL SECURITY;

-- Only CS (author) and target scout can see feedback
CREATE POLICY "Author can manage own feedback"
  ON public.chief_scout_feedback FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid() AND is_chief_scout(auth.uid(), team_id));

CREATE POLICY "Target scout can view feedback"
  ON public.chief_scout_feedback FOR SELECT
  TO authenticated
  USING (target_scout_id = auth.uid());

CREATE POLICY "Target scout can mark as read"
  ON public.chief_scout_feedback FOR UPDATE
  TO authenticated
  USING (target_scout_id = auth.uid())
  WITH CHECK (target_scout_id = auth.uid());

-- Team Activity Log table
CREATE TABLE public.team_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.scouting_teams(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view activity log"
  ON public.team_activity_log FOR SELECT
  TO authenticated
  USING (is_team_member_of(auth.uid(), team_id));

CREATE POLICY "Team members can insert activity"
  ON public.team_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid() AND is_team_member_of(auth.uid(), team_id));

-- Enable realtime for feedback notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.chief_scout_feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_activity_log;

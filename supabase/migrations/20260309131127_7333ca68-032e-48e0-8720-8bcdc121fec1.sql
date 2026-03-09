
-- Create scouting_assignments table
CREATE TABLE public.scouting_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.scouting_teams(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  team_player_id UUID REFERENCES public.team_players(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  focus_areas TEXT[] DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'assigned',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scouting_assignments ENABLE ROW LEVEL SECURITY;

-- Team members can view assignments for their team
CREATE POLICY "Team members can view team assignments"
  ON public.scouting_assignments
  FOR SELECT
  TO authenticated
  USING (is_team_member_of(auth.uid(), team_id));

-- Chief scout can create assignments
CREATE POLICY "Chief scout can create assignments"
  ON public.scouting_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_chief_scout(auth.uid(), team_id) AND assigned_by = auth.uid());

-- Chief scout can update any assignment, scouts can update their own status
CREATE POLICY "Chief scout can update assignments"
  ON public.scouting_assignments
  FOR UPDATE
  TO authenticated
  USING (is_chief_scout(auth.uid(), team_id) OR assigned_to = auth.uid());

-- Chief scout can delete assignments
CREATE POLICY "Chief scout can delete assignments"
  ON public.scouting_assignments
  FOR DELETE
  TO authenticated
  USING (is_chief_scout(auth.uid(), team_id));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.scouting_assignments;

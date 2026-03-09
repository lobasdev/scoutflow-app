
-- Step 1: Create enums
CREATE TYPE public.team_role AS ENUM ('chief_scout', 'scout');
CREATE TYPE public.plan_type AS ENUM ('solo', 'team');

-- Step 2: Add plan_type to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN plan_type public.plan_type NOT NULL DEFAULT 'solo';

-- Step 3: Add assigned_to and assigned_by to scout_tasks
ALTER TABLE public.scout_tasks ADD COLUMN assigned_to uuid;
ALTER TABLE public.scout_tasks ADD COLUMN assigned_by uuid;

-- Step 4: Create scouting_teams table
CREATE TABLE public.scouting_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scouting_teams ENABLE ROW LEVEL SECURITY;

-- Step 5: Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.scouting_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.team_role NOT NULL DEFAULT 'scout',
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  invited_by uuid
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX team_members_team_user_unique ON public.team_members(team_id, user_id);

-- Step 6: Create team_invites table
CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.scouting_teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.team_role NOT NULL DEFAULT 'scout',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Step 7: Create team_players table (shared player pool)
CREATE TABLE public.team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.scouting_teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  position text,
  team text,
  nationality text,
  date_of_birth date,
  height integer,
  weight integer,
  foot text,
  shirt_number text,
  photo_url text,
  estimated_value text,
  contract_expires date,
  current_salary text,
  expected_salary text,
  agency text,
  agency_link text,
  profile_summary text,
  recommendation text,
  scout_notes text,
  video_link text,
  tags text[] DEFAULT '{}',
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  risks text[] DEFAULT '{}',
  ceiling_level text,
  transfer_potential_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;

-- Step 8: Create team_observations table
CREATE TABLE public.team_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_player_id uuid NOT NULL REFERENCES public.team_players(id) ON DELETE CASCADE,
  scout_id uuid NOT NULL,
  date date NOT NULL,
  location text,
  notes text,
  video_link text,
  match_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_observations ENABLE ROW LEVEL SECURITY;

-- Step 9: Create team_ratings table
CREATE TABLE public.team_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_observation_id uuid NOT NULL REFERENCES public.team_observations(id) ON DELETE CASCADE,
  parameter text NOT NULL,
  score integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_ratings ENABLE ROW LEVEL SECURITY;

-- Step 10: Create observation_feedback table
CREATE TABLE public.observation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_observation_id uuid NOT NULL REFERENCES public.team_observations(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.observation_feedback ENABLE ROW LEVEL SECURITY;

-- Step 11: Security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member_of(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND status = 'active'
  )
$$;

-- Helper: get user's team id
CREATE OR REPLACE FUNCTION public.get_user_team_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.team_members
  WHERE user_id = _user_id AND status = 'active'
  LIMIT 1
$$;

-- Helper: check if user is chief scout of a team
CREATE OR REPLACE FUNCTION public.is_chief_scout(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND role = 'chief_scout'
      AND status = 'active'
  )
$$;

-- Step 12: RLS Policies

-- scouting_teams: owner full CRUD, members SELECT
CREATE POLICY "Owner can do all on own team" ON public.scouting_teams FOR ALL
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Members can view their team" ON public.scouting_teams FOR SELECT
  TO authenticated USING (public.is_team_member_of(auth.uid(), id));

-- team_members: owner manages, members view
CREATE POLICY "Chief scout manages members" ON public.team_members FOR ALL
  TO authenticated USING (public.is_chief_scout(auth.uid(), team_id)) WITH CHECK (public.is_chief_scout(auth.uid(), team_id));

CREATE POLICY "Members can view roster" ON public.team_members FOR SELECT
  TO authenticated USING (public.is_team_member_of(auth.uid(), team_id));

-- team_invites: chief scout manages
CREATE POLICY "Chief scout manages invites" ON public.team_invites FOR ALL
  TO authenticated USING (public.is_chief_scout(auth.uid(), team_id)) WITH CHECK (public.is_chief_scout(auth.uid(), team_id));

CREATE POLICY "Anyone can view invite by token" ON public.team_invites FOR SELECT
  TO authenticated USING (true);

-- team_players: all members SELECT, any member INSERT, chief+creator UPDATE/DELETE
CREATE POLICY "Team members can view shared players" ON public.team_players FOR SELECT
  TO authenticated USING (public.is_team_member_of(auth.uid(), team_id));

CREATE POLICY "Team members can add shared players" ON public.team_players FOR INSERT
  TO authenticated WITH CHECK (public.is_team_member_of(auth.uid(), team_id) AND created_by = auth.uid());

CREATE POLICY "Chief or creator can update shared players" ON public.team_players FOR UPDATE
  TO authenticated USING (created_by = auth.uid() OR public.is_chief_scout(auth.uid(), team_id));

CREATE POLICY "Chief or creator can delete shared players" ON public.team_players FOR DELETE
  TO authenticated USING (created_by = auth.uid() OR public.is_chief_scout(auth.uid(), team_id));

-- team_observations: author CRUD own, all members SELECT
CREATE POLICY "Team members can view team observations" ON public.team_observations FOR SELECT
  TO authenticated USING (
    public.is_team_member_of(auth.uid(), (SELECT team_id FROM public.team_players WHERE id = team_player_id))
  );

CREATE POLICY "Scouts can insert own team observations" ON public.team_observations FOR INSERT
  TO authenticated WITH CHECK (scout_id = auth.uid() AND public.is_team_member_of(auth.uid(), (SELECT team_id FROM public.team_players WHERE id = team_player_id)));

CREATE POLICY "Scouts can update own team observations" ON public.team_observations FOR UPDATE
  TO authenticated USING (scout_id = auth.uid());

CREATE POLICY "Scouts can delete own team observations" ON public.team_observations FOR DELETE
  TO authenticated USING (scout_id = auth.uid());

-- team_ratings: same as team_observations
CREATE POLICY "Team members can view team ratings" ON public.team_ratings FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.team_observations to2
      JOIN public.team_players tp ON tp.id = to2.team_player_id
      WHERE to2.id = team_ratings.team_observation_id
        AND public.is_team_member_of(auth.uid(), tp.team_id)
    )
  );

CREATE POLICY "Observation author can manage ratings" ON public.team_ratings FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.team_observations WHERE id = team_ratings.team_observation_id AND scout_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.team_observations WHERE id = team_ratings.team_observation_id AND scout_id = auth.uid())
  );

-- observation_feedback: chief scout INSERT, author+chief SELECT
CREATE POLICY "Chief scout can add feedback" ON public.observation_feedback FOR INSERT
  TO authenticated WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.team_observations to2
      JOIN public.team_players tp ON tp.id = to2.team_player_id
      WHERE to2.id = observation_feedback.team_observation_id
        AND public.is_chief_scout(auth.uid(), tp.team_id)
    )
  );

CREATE POLICY "Team members can view feedback" ON public.observation_feedback FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.team_observations to2
      JOIN public.team_players tp ON tp.id = to2.team_player_id
      WHERE to2.id = observation_feedback.team_observation_id
        AND public.is_team_member_of(auth.uid(), tp.team_id)
    )
  );

CREATE POLICY "Chief scout can delete feedback" ON public.observation_feedback FOR DELETE
  TO authenticated USING (author_id = auth.uid());

-- scout_tasks: add policy for assigned_to
CREATE POLICY "Scouts can view tasks assigned to them" ON public.scout_tasks FOR SELECT
  TO authenticated USING (assigned_to = auth.uid());

-- Step 13: Updated_at triggers
CREATE TRIGGER update_scouting_teams_updated_at BEFORE UPDATE ON public.scouting_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_players_updated_at BEFORE UPDATE ON public.team_players
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_observations_updated_at BEFORE UPDATE ON public.team_observations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

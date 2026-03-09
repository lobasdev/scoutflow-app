

# Scouting Team Workspaces

## Concept

A hybrid workspace where the Chief Scout creates a team, invites scouts, and manages a shared player pool. Scouts can also keep private player records. Two roles only: **Chief Scout** (owner) and **Scout** (member). Pricing is feature-based (not per-seat), with a "Coming Soon" label for now.

## Roles

| Role | Permissions |
|------|------------|
| **Chief Scout** | Creates team, invites/removes scouts, creates shared players, views ALL team observations/players/tasks, assigns tasks, leaves feedback on observations, manages team settings |
| **Scout** | Views shared player pool, adds observations to shared players, keeps own private players, sees assigned tasks + own tasks, sees feedback on their observations |

## Database Changes

### New Tables

**`scouting_teams`** -- One team per workspace
- `id`, `name`, `owner_id` (Chief Scout), `created_at`, `updated_at`

**`team_members`** -- Links scouts to teams
- `id`, `team_id`, `user_id`, `role` (enum: `chief_scout`, `scout`), `status` (`active`, `removed`), `joined_at`, `invited_by`

**`team_invites`** -- Email-based invitations
- `id`, `team_id`, `email`, `role`, `token` (unique), `status` (`pending`, `accepted`, `expired`), `invited_by`, `created_at`, `expires_at`

**`team_players`** -- Shared player pool (separate from personal `players` table)
- `id`, `team_id`, `created_by` (who added it), same columns as `players` (name, position, team, nationality, etc.)

**`team_observations`** -- Observations on shared players, attributed to the scout who wrote them
- `id`, `team_player_id` (FK → team_players), `scout_id` (who wrote it), `date`, `location`, `notes`, `video_link`, `match_id`, `created_at`, `updated_at`

**`team_ratings`** -- Ratings for team observations
- `id`, `team_observation_id`, `parameter`, `score`, `comment`, `created_at`

**`observation_feedback`** -- Chief Scout comments on any team observation
- `id`, `team_observation_id`, `author_id`, `comment`, `created_at`

### Modifications to Existing Tables

- **`subscriptions`**: Add `plan_type` column (enum: `solo`, `team`), default `solo`
- **`scout_tasks`**: Add `assigned_to` (uuid, nullable), `assigned_by` (uuid, nullable) -- for Chief Scout task delegation

### New Enum

```sql
CREATE TYPE team_role AS ENUM ('chief_scout', 'scout');
CREATE TYPE plan_type AS ENUM ('solo', 'team');
```

### RLS Strategy

- `scouting_teams`: Owner full CRUD; members SELECT
- `team_members`: Owner manages; members can view roster
- `team_players`: All active team members can SELECT; Chief Scout + creator can UPDATE/DELETE; any member can INSERT
- `team_observations`: Author can CRUD own; all team members can SELECT (cross-observation visibility)
- `team_ratings`: Same as team_observations
- `observation_feedback`: Chief Scout can INSERT; observation author + Chief Scout can SELECT
- `scout_tasks`: Add policy for `assigned_to` -- scouts can see tasks assigned to them
- Use `security definer` function `is_team_member_of(user_id, team_id)` to avoid RLS recursion

### Key Design Decision

Shared players live in `team_players` (separate from personal `players`). This means:
- Zero impact on existing solo users and their data
- No complex RLS mixing personal/shared visibility on the same table
- Chief Scout sees all team_observations from all scouts on each shared player
- Scouts keep their private `players` table untouched

## Frontend Implementation

### New Pages

1. **`/team`** -- Team dashboard: member list, shared players count, recent activity, team stats
2. **`/team/settings`** -- Manage members, send invites, remove scouts, edit team name
3. **`/team/players`** -- Shared player pool (grid view like Home.tsx but for team_players)
4. **`/team/players/:id`** -- Shared player detail with all scouts' observations listed, feedback section
5. **`/team/invite/:token`** -- Accept invite landing page

### Modified Pages

- **Tasks**: Add "Assigned to me" / "Assigned by me" filter tabs when on team plan
- **Observation Details**: Show feedback thread from Chief Scout (on team observations)
- **Profile**: Show team membership, role badge
- **Global Menu**: Add "Team Workspace" nav item (visible only on team plan)
- **Dashboard**: Add "Team Activity" widget (recent team observations across all scouts)
- **Landing/Pricing**: Add "Team Plan -- Coming Soon" card

### New Hooks

- `useTeam()` -- Current user's team, role, members
- `useTeamPlan()` -- Returns `boolean` (is user on team plan)
- `useTeamPlayers(teamId)` -- Shared player pool
- `useTeamObservations(teamPlayerId)` -- All observations from all scouts for a shared player
- `useObservationFeedback(observationId)` -- Feedback thread

### Feature Gate

```typescript
function useTeamPlan() {
  const { subscription } = useSubscription();
  return subscription?.plan_type === 'team';
}
// All team UI hidden when this returns false
```

### Solo → Team Upgrade Path

- Profile page shows "Upgrade to Team Plan -- Coming Soon" banner
- Admin panel can manually set `plan_type = 'team'` for testing
- Future: Paddle product for team plan, upgrade flow in-app

## Suggested Workspace Features (Team Plan Perks)

1. **Cross-Observation Reports** -- Chief Scout generates a combined PDF comparing all scouts' ratings for the same shared player side-by-side
2. **Team Activity Feed** -- Real-time feed of who observed what, new observations, task completions across the team
3. **Scout Performance Dashboard** -- Chief Scout sees stats per scout: observations count, avg ratings given, tasks completed, active streak
4. **Observation Review Workflow** -- Chief Scout marks observations as "Reviewed" / "Needs Revision" with feedback. Scouts see review status on their work
5. **Team Shortlists** -- Shared shortlists visible to all team members. Chief Scout curates, scouts can suggest additions
6. **Assignment Board** -- Chief Scout assigns specific players or matches to specific scouts. Visual board showing who's covering what

## Implementation Order

1. Database migration: enums, tables, RLS, `plan_type` column, `assigned_to`/`assigned_by` on scout_tasks
2. `useTeam` + `useTeamPlan` hooks, feature gate
3. Team creation + invite flow (pages + edge function for invite emails)
4. Shared player pool (team_players CRUD + UI)
5. Team observations + cross-scout visibility
6. Observation feedback system
7. Task assignment (assigned_to/assigned_by)
8. Team dashboard + activity feed
9. Landing page "Coming Soon" card

## Testing Strategy

1. Manually set your subscription to `plan_type = 'team'` via Admin panel
2. Create a scouting team as Chief Scout
3. Create a second test account, invite them as Scout
4. Both add observations to a shared player -- verify Chief Scout sees all
5. Chief Scout assigns a task -- verify Scout sees it
6. Chief Scout leaves feedback on Scout's observation -- verify Scout sees it
7. Verify solo plan users see zero team UI
8. Verify existing personal player data is completely unaffected


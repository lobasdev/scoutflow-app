import { supabase as typedClient } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Undo restores exact snapshots across many tables, addressed by name at
// runtime, so the fluent builder is used dynamically here — the generated
// client's per-table types can't express that.
const supabase = typedClient as any;

/**
 * Deletes are destructive and, in this app, often cascade (a player carries
 * observations, ratings, voice notes, attachments, injuries, shares and
 * shortlist links with it). To make deletion recoverable we snapshot the exact
 * rows first, delete them, and offer a short window to put everything back
 * with the original ids intact.
 */

type Row = Record<string, any>;
type Match = Record<string, string | string[]>;

const UNDO_WINDOW_MS = 8000;

function applyMatch(query: any, match: Match) {
  let q = query;
  for (const [column, value] of Object.entries(match)) {
    q = Array.isArray(value) ? q.in(column, value) : q.eq(column, value);
  }
  return q;
}

async function selectRows(table: string, match: Match): Promise<Row[]> {
  const { data, error } = await applyMatch(supabase.from(table).select("*"), match);
  if (error) throw error;
  return data || [];
}

async function insertRows(table: string, rows: Row[]) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
}

function showUndoToast(message: string, restore: () => Promise<void>) {
  toast.success(message, {
    duration: UNDO_WINDOW_MS,
    action: {
      label: "Undo",
      onClick: async () => {
        try {
          await restore();
          toast.success("Put back");
        } catch {
          toast.error("Couldn't put it back — please refresh the page");
        }
      },
    },
  });
}

/**
 * Delete one table's rows and offer to restore them. `related` lists tables
 * that the database will remove as part of the same cascade, so they can be
 * captured up front and re-created in order on undo.
 */
export async function deleteWithUndo(options: {
  table: string;
  match: Match;
  message: string;
  invalidate: () => void;
  related?: { table: string; match: Match }[];
}): Promise<void> {
  const { table, match, message, invalidate, related = [] } = options;

  const rows = await selectRows(table, match);
  const relatedRows = await Promise.all(related.map((r) => selectRows(r.table, r.match)));

  const { error } = await applyMatch(supabase.from(table).delete(), match);
  if (error) throw error;

  invalidate();
  showUndoToast(message, async () => {
    await insertRows(table, rows);
    for (let i = 0; i < related.length; i++) {
      await insertRows(related[i].table, relatedRows[i]);
    }
    invalidate();
  });
}

/**
 * Removing a player cascades across every table that references it, and two
 * links are merely nulled rather than deleted (tasks and match rows), so those
 * have to be re-pointed explicitly.
 */
export async function deletePlayersWithUndo(
  playerIds: string[],
  invalidate: () => void
): Promise<void> {
  if (playerIds.length === 0) return;

  const [players, observations, voiceNotes, attachments, injuries, shares, shortlistLinks, tasks] =
    await Promise.all([
      selectRows("players", { id: playerIds }),
      selectRows("observations", { player_id: playerIds }),
      selectRows("voice_notes", { player_id: playerIds }),
      selectRows("player_attachments", { player_id: playerIds }),
      selectRows("player_injuries", { player_id: playerIds }),
      selectRows("player_shares", { player_id: playerIds }),
      selectRows("player_shortlists", { player_id: playerIds }),
      selectRows("scout_tasks", { player_id: playerIds }),
    ]);

  const observationIds = observations.map((o) => o.id);
  const [ratings, matchPlayers] =
    observationIds.length > 0
      ? await Promise.all([
          selectRows("ratings", { observation_id: observationIds }),
          selectRows("match_players", { observation_id: observationIds }),
        ])
      : [[], []];

  const { error } = await supabase.from("players").delete().in("id", playerIds);
  if (error) throw error;

  invalidate();

  const message =
    playerIds.length === 1 ? "Player deleted" : `${playerIds.length} players deleted`;

  showUndoToast(message, async () => {
    await insertRows("players", players);
    await insertRows("observations", observations);
    await insertRows("ratings", ratings);
    await insertRows("voice_notes", voiceNotes);
    await insertRows("player_attachments", attachments);
    await insertRows("player_injuries", injuries);
    await insertRows("player_shares", shares);
    await insertRows("player_shortlists", shortlistLinks);

    for (const task of tasks) {
      await supabase.from("scout_tasks").update({ player_id: task.player_id }).eq("id", task.id);
    }
    for (const row of matchPlayers) {
      await supabase
        .from("match_players")
        .update({ observation_id: row.observation_id })
        .eq("id", row.id);
    }

    invalidate();
  });
}

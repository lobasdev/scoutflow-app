import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  listOperations,
  removeOperation,
  updateOperation,
  type OfflineOperation,
} from "@/lib/offlineStore";

interface OfflineContextValue {
  isOnline: boolean;
  syncing: boolean;
  operations: OfflineOperation[];
  retry: (id?: string) => Promise<void>;
  discard: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

/** A conflict means retrying automatically won't help: the user must decide. */
export class SyncConflictError extends Error {}

const SKIP_EXISTING = { onConflict: "id", ignoreDuplicates: true } as const;

function classify(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === "23503") throw new SyncConflictError("The linked player or match was deleted on another device");
  if (error.code === "42501" || /row-level security/i.test(error.message || "")) {
    throw new SyncConflictError("You no longer have access to this record");
  }
  throw error;
}

const isAlreadyUploaded = (error: { message?: string; statusCode?: string } | null) =>
  !!error && (error.statusCode === "409" || /already exists|duplicate/i.test(error.message || ""));

async function processOperation(operation: OfflineOperation) {
  switch (operation.type) {
    case "create-inbox-player": {
      const { error } = await supabase.from("inbox_players").upsert(operation.payload as never, SKIP_EXISTING);
      classify(error);
      return;
    }
    case "create-player": {
      const payload = operation.payload as { player: Record<string, unknown> };
      // Never overwrite a profile that already reached the server (e.g. edited on another device)
      const { error } = await supabase.from("players").upsert(payload.player as never, SKIP_EXISTING);
      classify(error);
      const playerId = String(payload.player.id);
      for (const entry of operation.blobs || []) {
        if (entry.key === "photo") {
          const extension = entry.name?.split(".").pop() || "jpg";
          const path = `${playerId}/photo.${extension}`;
          const { error: uploadError } = await supabase.storage.from("player-photos").upload(path, entry.blob, { upsert: true, contentType: entry.type });
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from("player-photos").getPublicUrl(path);
          const { error: updateError } = await supabase.from("players").update({ photo_url: data.publicUrl }).eq("id", playerId).is("photo_url", null);
          if (updateError) throw updateError;
        } else if (entry.key.startsWith("attachment:")) {
          const path = `${playerId}/${operation.id}-${entry.name || "attachment"}`;
          const { error: uploadError } = await supabase.storage.from("player-attachments").upload(path, entry.blob, { contentType: entry.type });
          if (uploadError && !isAlreadyUploaded(uploadError as never)) throw uploadError;
          const { data: existing } = await supabase.from("player_attachments").select("id").eq("file_path", path).maybeSingle();
          if (existing) continue;
          const { error: recordError } = await supabase.from("player_attachments").insert({ player_id: playerId, file_name: entry.name || "Attachment", file_path: path, file_size: entry.blob.size, mime_type: entry.type || null });
          if (recordError) throw recordError;
        }
      }
      return;
    }
    case "create-observation": {
      const payload = operation.payload as {
        observation: Record<string, unknown>;
        ratings: Array<Record<string, unknown>>;
      };
      const { error } = await supabase.from("observations").upsert(payload.observation as never, SKIP_EXISTING);
      classify(error);
      if (payload.ratings.length) {
        const { error: ratingsError } = await supabase.from("ratings").upsert(payload.ratings as never, SKIP_EXISTING);
        classify(ratingsError);
      }
      return;
    }
    case "upload-voice-note": {
      const audio = operation.blobs?.find((entry) => entry.key === "audio");
      if (!audio) throw new Error("The saved recording is unavailable");
      const payload = operation.payload as {
        id: string;
        scout_id: string;
        player_id: string | null;
        match_id: string | null;
        file_path: string;
        duration: number;
      };
      const { error: uploadError } = await supabase.storage
        .from("voice-notes")
        .upload(payload.file_path, audio.blob, { contentType: audio.type || "audio/webm", upsert: true });
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("voice_notes").upsert(payload, SKIP_EXISTING);
      classify(error);
      return;
    }
  }
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [operations, setOperations] = useState<OfflineOperation[]>([]);

  const refresh = useCallback(async () => {
    setOperations(user ? await listOperations(user.id) : []);
  }, [user]);

  const syncingRef = useRef(false);
  const retry = useCallback(async (onlyId?: string) => {
    if (!user || !navigator.onLine || syncingRef.current) return;
    // Conflicts wait for the user; only an explicit retry re-sends them
    const queued = (await listOperations(user.id)).filter((item) =>
      onlyId ? item.id === onlyId : item.status !== "conflict",
    );
    // Nothing to send: don't flash the "Syncing" badge
    if (queued.length === 0) return;
    syncingRef.current = true;
    setSyncing(true);
    for (const operation of queued) {
      try {
        await updateOperation(operation.id, { status: "syncing" });
        await processOperation(operation);
        await removeOperation(operation.id);
      } catch (error) {
        await updateOperation(operation.id, {
          status: error instanceof SyncConflictError ? "conflict" : "failed",
          attempts: operation.attempts + 1,
          error: error instanceof Error ? error.message : "Sync failed",
        });
      }
    }
    syncingRef.current = false;
    setSyncing(false);
    await refresh();
    window.dispatchEvent(new CustomEvent("scoutflow-sync-complete"));
  }, [refresh, user]);

  const discard = useCallback(async (id: string) => {
    await removeOperation(id);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    const online = () => { setIsOnline(true); void retry(); };
    const offline = () => setIsOnline(false);
    const changed = () => void refresh();
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    window.addEventListener("scoutflow-offline-change", changed);
    void refresh();
    if (navigator.onLine) void retry();
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("scoutflow-offline-change", changed);
    };
  }, [refresh, retry]);

  const value = useMemo(() => ({ isOnline, syncing, operations, retry, discard, refresh }), [discard, isOnline, operations, refresh, retry, syncing]);
  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) throw new Error("useOffline must be used within OfflineProvider");
  return context;
}

export function useOptionalOffline() {
  return useContext(OfflineContext);
}
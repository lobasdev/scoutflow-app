import { openDB, type DBSchema } from "idb";

export type OfflineOperationType =
  | "create-observation"
  | "create-inbox-player"
  | "create-player"
  | "upload-voice-note";

export type OfflineStatus = "pending" | "syncing" | "failed" | "conflict";

export interface OfflineOperation {
  id: string;
  userId: string;
  type: OfflineOperationType;
  payload: Record<string, unknown>;
  blobs?: Array<{ key: string; blob: Blob; name?: string; type?: string }>;
  status: OfflineStatus;
  attempts: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

interface DraftRecord {
  key: string;
  userId: string;
  value: unknown;
  updatedAt: number;
}

export interface CachedPlayerRecord {
  key: string;
  userId: string;
  playerId: string;
  value: unknown;
  cachedAt: number;
}

interface ScoutFlowOfflineDB extends DBSchema {
  operations: {
    key: string;
    value: OfflineOperation;
    indexes: { "by-user": string; "by-status": OfflineStatus };
  };
  drafts: {
    key: string;
    value: DraftRecord;
    indexes: { "by-user": string };
  };
  cachedPlayers: {
    key: string;
    value: CachedPlayerRecord;
    indexes: { "by-user": string };
  };
}

const dbPromise = openDB<ScoutFlowOfflineDB>("scoutflow-offline", 1, {
  upgrade(db) {
    const operations = db.createObjectStore("operations", { keyPath: "id" });
    operations.createIndex("by-user", "userId");
    operations.createIndex("by-status", "status");
    const drafts = db.createObjectStore("drafts", { keyPath: "key" });
    drafts.createIndex("by-user", "userId");
    const cache = db.createObjectStore("cachedPlayers", { keyPath: "key" });
    cache.createIndex("by-user", "userId");
  },
});

export const createOfflineId = () => crypto.randomUUID();

export async function enqueueOperation(
  operation: Omit<OfflineOperation, "status" | "attempts" | "createdAt" | "updatedAt">,
) {
  const now = Date.now();
  await (await dbPromise).put("operations", {
    ...operation,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  });
  window.dispatchEvent(new CustomEvent("scoutflow-offline-change"));
}

export async function listOperations(userId: string) {
  const rows = await (await dbPromise).getAllFromIndex("operations", "by-user", userId);
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function updateOperation(id: string, patch: Partial<OfflineOperation>) {
  const db = await dbPromise;
  const operation = await db.get("operations", id);
  if (!operation) return;
  await db.put("operations", { ...operation, ...patch, updatedAt: Date.now() });
  window.dispatchEvent(new CustomEvent("scoutflow-offline-change"));
}

export async function removeOperation(id: string) {
  await (await dbPromise).delete("operations", id);
  window.dispatchEvent(new CustomEvent("scoutflow-offline-change"));
}

export async function saveDraft(userId: string, draftId: string, value: unknown) {
  await (await dbPromise).put("drafts", {
    key: `${userId}:${draftId}`,
    userId,
    value,
    updatedAt: Date.now(),
  });
}

export async function getDraft<T>(userId: string, draftId: string): Promise<T | null> {
  const record = await (await dbPromise).get("drafts", `${userId}:${draftId}`);
  return (record?.value as T | undefined) ?? null;
}

export async function removeDraft(userId: string, draftId: string) {
  await (await dbPromise).delete("drafts", `${userId}:${draftId}`);
}

export async function cachePlayer(userId: string, playerId: string, value: unknown) {
  await (await dbPromise).put("cachedPlayers", {
    key: `${userId}:${playerId}`,
    userId,
    playerId,
    value,
    cachedAt: Date.now(),
  });
}

export async function getCachedPlayer<T>(userId: string, playerId: string) {
  const record = await (await dbPromise).get("cachedPlayers", `${userId}:${playerId}`);
  return record ? { value: record.value as T, cachedAt: record.cachedAt } : null;
}

export async function clearOfflineUserData(userId: string) {
  const db = await dbPromise;
  const tx = db.transaction(["operations", "drafts", "cachedPlayers"], "readwrite");
  const operations = await tx.objectStore("operations").index("by-user").getAllKeys(userId);
  const drafts = await tx.objectStore("drafts").index("by-user").getAllKeys(userId);
  const cache = await tx.objectStore("cachedPlayers").index("by-user").getAllKeys(userId);
  await Promise.all([
    ...operations.map((key) => tx.objectStore("operations").delete(key)),
    ...drafts.map((key) => tx.objectStore("drafts").delete(key)),
    ...cache.map((key) => tx.objectStore("cachedPlayers").delete(key)),
  ]);
  await tx.done;
}
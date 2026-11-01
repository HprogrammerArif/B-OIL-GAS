import AsyncStorage from "@react-native-async-storage/async-storage";
import { AsyncKeys } from "@/lib/storage/keys";
import { logger } from "@/lib/logger";
import { buildSeed } from "../seed";
import { MOCK_DB_VERSION, type MockDb } from "./schema";

let db: MockDb | null = null;
let loading: Promise<MockDb> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function load(): Promise<MockDb> {
  try {
    const raw = await AsyncStorage.getItem(AsyncKeys.mockDb);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb;
      if (parsed.version === MOCK_DB_VERSION) return parsed;
      logger.info("mock db version changed; reseeding", { from: parsed.version, to: MOCK_DB_VERSION });
    }
  } catch (error) {
    logger.warn("mock db unreadable; reseeding", { error: String(error) });
  }
  const fresh = buildSeed();
  await AsyncStorage.setItem(AsyncKeys.mockDb, JSON.stringify(fresh));
  return fresh;
}

/** The live database; loaded once per app run. */
export async function getDb(): Promise<MockDb> {
  if (db) return db;
  loading ??= load().then((loaded) => {
    db = loaded;
    return loaded;
  });
  return loading;
}

/** Schedule a write-behind save; handlers call this after mutating `db`. */
export function commit(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (!db) return;
    AsyncStorage.setItem(AsyncKeys.mockDb, JSON.stringify(db)).catch((error: unknown) =>
      logger.warn("mock db save failed", { error: String(error) }),
    );
  }, 250);
}

/** Restore seed data but keep the caller's sessions so the presenter stays signed in. */
export async function resetDb(): Promise<MockDb> {
  const current = await getDb();
  const fresh = buildSeed();
  fresh.sessions = current.sessions;
  db = fresh;
  await AsyncStorage.setItem(AsyncKeys.mockDb, JSON.stringify(fresh));
  return fresh;
}

/** Monotonic human reference numbers (e.g. `NS-2026-0042`). */
export function nextRef(store: MockDb, prefix: string, pad = 4): string {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const next = (store.counters[key] ?? 0) + 1;
  store.counters[key] = next;
  return `${prefix}-${year}-${String(next).padStart(pad, "0")}`;
}

import type { MockDb } from "./schema";

/** Monotonic human reference numbers (e.g. `NS-2026-0042`). Kept apart from `db/index` so engines and seeds can share it. */
export function nextRef(store: MockDb, prefix: string, pad = 4): string {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const next = (store.counters[key] ?? 0) + 1;
  store.counters[key] = next;
  return `${prefix}-${year}-${String(next).padStart(pad, "0")}`;
}

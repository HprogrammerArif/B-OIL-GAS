/**
 * Versioned localStorage persistence for the observable stores.
 *
 * Each store saves a plain-JSON snapshot under `oneops.store.<name>.v<N>`.
 * Bumping the version (or changing seed data shape) discards old snapshots.
 * The presenter panel's "Reset demo data" clears every `oneops.*` key.
 */

const PREFIX = 'oneops.store.';
const SAVE_DELAY_MS = 150;

const timers = new Map<string, number>();

function storageKey(name: string, version: number) {
  return `${PREFIX}${name}.v${version}`;
}

export function loadPersisted<S>(name: string, version: number): S | null {
  try {
    const raw = window.localStorage.getItem(storageKey(name, version));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: number; data: S };
    return parsed.v === version ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Debounced write; call from the store's notify(). */
export function savePersisted<S>(name: string, version: number, getSnapshot: () => S): void {
  const key = storageKey(name, version);
  const pending = timers.get(key);
  if (pending) window.clearTimeout(pending);
  timers.set(
    key,
    window.setTimeout(() => {
      timers.delete(key);
      try {
        window.localStorage.setItem(key, JSON.stringify({ v: version, data: getSnapshot() }));
      } catch {
        /* quota or private mode: run in-memory only */
      }
    }, SAVE_DELAY_MS),
  );
}

export function clearPersisted(): void {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

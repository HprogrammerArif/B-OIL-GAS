/**
 * Minimal hash router. URLs look like `#/approvals`, survive reloads and
 * make the browser back button work without adding a dependency.
 */
import { useCallback, useSyncExternalStore } from 'react';
import type { AppView } from '../types';

const VIEW_PATHS: Record<AppView, string> = {
  dashboard: '/',
  approvals: '/approvals',
  notesheet: '/documents',
  inner_circle: '/messages',
  compliance: '/permits',
  fleet: '/fleet',
  vehicle_request: '/fleet/request',
  bus: '/shuttle',
  parcel: '/parcels',
  attendance: '/attendance',
  incident: '/safety',
  claims: '/claims',
  asset: '/assets',
  guest: '/visitors',
  workforce: '/people',
};

const PATH_VIEWS = new Map<string, AppView>(
  (Object.entries(VIEW_PATHS) as [AppView, string][]).map(([v, p]) => [p, v]),
);

export function hashForView(view: AppView): string {
  return `#${VIEW_PATHS[view]}`;
}

export function viewFromHash(hash: string): AppView | null {
  const path = hash.replace(/^#/, '').split('?')[0] || '/';
  return PATH_VIEWS.get(path) ?? PATH_VIEWS.get(path.replace(/\/$/, '')) ?? null;
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

function getHash() {
  return window.location.hash;
}

export function navigate(view: AppView, replace = false) {
  const target = hashForView(view);
  if (window.location.hash === target) return;
  if (replace) window.history.replaceState(null, '', target);
  else window.location.hash = target;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** Current view derived from the URL (null when the hash is unknown). */
export function useHashView(): [AppView | null, (view: AppView) => void] {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  const go = useCallback((view: AppView) => navigate(view), []);
  return [viewFromHash(hash), go];
}

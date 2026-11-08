import { useSyncExternalStore } from 'react';
import { INITIAL_LOTO_PERMITS, SHIFT_HANDOVER } from './dashboardData';
import type { LotoPermitItem, ShiftHandoverItem } from './types';

export interface PlantSafetySnap {
  permits: LotoPermitItem[];
  shifts: ShiftHandoverItem[];
}

let permits: LotoPermitItem[] = INITIAL_LOTO_PERMITS.map((p) => ({
  ...p,
  checklist: p.checklist ? { ...p.checklist } : undefined,
}));
let shifts: ShiftHandoverItem[] = SHIFT_HANDOVER.map((s) => ({
  ...s,
  criticalWatchItems: s.criticalWatchItems ? [...s.criticalWatchItems] : undefined,
}));
let snap: PlantSafetySnap = { permits, shifts };
const listeners = new Set<() => void>();

function publish() {
  snap = { permits, shifts };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snap;
}

/** Permits and handover notes shared by the plant manager and the crew. */
export function usePlantSafety(): PlantSafetySnap {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function deIsolatePermit(id: string) {
  permits = permits.map((p) => (p.id === id ? { ...p, status: 'DE-ISOLATED' } : p));
  publish();
}

export function addPermit(permit: LotoPermitItem) {
  permits = [permit, ...permits];
  publish();
}

export function signShift(id: string | undefined, index: number) {
  shifts = shifts.map((s, i) => (
    (id ? s.id === id : i === index)
      ? { ...s, safetyChecklistSigned: true, status: 'completed' }
      : s
  ));
  publish();
}

export function addShift(shift: ShiftHandoverItem) {
  shifts = [shift, ...shifts];
  publish();
}

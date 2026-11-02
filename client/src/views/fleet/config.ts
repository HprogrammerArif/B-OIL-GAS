/**
 * Fleet — who sees what, and which requisitions belong to whom.
 *
 * Modes (derived from permissions, never from the role string):
 *  - dispatch:  `fleet:dispatch` — Transport cell: assign, pool, gate, fuel, drivers.
 *  - oversight: `fleet:view_all` without dispatch — read-only view of every requisition.
 *  - driver:    `fleet:drive` — own trip console only.
 *  - requester: everyone else with `fleet:request` — own requisitions only.
 */
import type { CurrentUser } from '../../auth/session';
import { t, type Lang } from '../../types';
import type { Driver, FleetNotification, Vehicle, VehicleRequisition } from '../../store/fleetStore';

export type FleetMode = 'dispatch' | 'oversight' | 'driver' | 'requester';

/** Display labels for requisition, driver and vehicle status values. */
const FLEET_STATUS_LABEL: Record<string, readonly [string, string]> = {
  pending: ['Pending', 'অপেক্ষমাণ'],
  assigned: ['Assigned', 'নির্ধারিত'],
  in_transit: ['In transit', 'যাত্রাপথে'],
  completed: ['Completed', 'সম্পন্ন'],
  rejected: ['Rejected', 'প্রত্যাখ্যাত'],
  available: ['Available', 'প্রস্তুত'],
  on_trip: ['On trip', 'ট্রিপে'],
  off_duty: ['Off duty', 'ডিউটির বাইরে'],
  rest_required: ['Resting', 'বিশ্রামে'],
  sick_leave: ['Sick leave', 'অসুস্থতাজনিত ছুটি'],
  on_leave: ['On leave', 'ছুটিতে'],
  loading: ['Loading', 'লোডিং'],
  maintenance: ['Maintenance', 'রক্ষণাবেক্ষণ'],
  grounded: ['Grounded', 'বন্ধ'],
};

export function fleetStatusLabel(status: string, lang: Lang): string {
  const label = FLEET_STATUS_LABEL[status];
  return label ? t(label[0], label[1], lang) : status.replace(/_/g, ' ');
}

export function fleetModeFor(user: CurrentUser): FleetMode {
  if (user.permissions.has('fleet:dispatch')) return 'dispatch';
  if (user.permissions.has('fleet:drive')) return 'driver';
  if (user.permissions.has('fleet:view_all')) return 'oversight';
  return 'requester';
}

export function isMyRequisition(r: VehicleRequisition, user: CurrentUser): boolean {
  return r.requesterEmpId ? r.requesterEmpId === user.empId : r.requesterName === user.name;
}

export function requisitionsVisibleTo(user: CurrentUser, mode: FleetMode, reqs: readonly VehicleRequisition[]): VehicleRequisition[] {
  if (mode === 'dispatch' || mode === 'oversight') return [...reqs];
  if (mode === 'driver') return reqs.filter((r) => r.assignedDriverName === user.name);
  return reqs.filter((r) => isMyRequisition(r, user));
}

/** Chat party the signed-in user speaks as on a trip thread. */
export type FleetParty = 'employee' | 'driver' | 'admin';

export function fleetPartyFor(mode: FleetMode): FleetParty {
  if (mode === 'requester') return 'employee';
  if (mode === 'driver') return 'driver';
  return 'admin';
}

/**
 * Transport-cell users see admin and broadcast notifications. Requesters and
 * drivers only see notifications tied to a requisition they can see.
 */
export function notificationsVisibleTo(
  mode: FleetMode,
  notifications: readonly FleetNotification[],
  visibleReqs: readonly VehicleRequisition[],
): FleetNotification[] {
  if (mode === 'dispatch' || mode === 'oversight') {
    return notifications.filter((n) => n.targetRole === 'all' || n.targetRole === 'admin');
  }
  const ids = new Set(visibleReqs.map((r) => r.id));
  return notifications.filter((n) => n.targetRole !== 'admin' && !!n.requisitionId && ids.has(n.requisitionId));
}

/** The fleet driver record for the signed-in driver persona. */
export function driverRecordFor(user: CurrentUser, drivers: readonly Driver[]): Driver | undefined {
  return drivers.find((d) => d.name === user.name);
}

export interface PoolingSuggestion {
  primary: VehicleRequisition;
  secondary: VehicleRequisition;
  vehicle: Vehicle;
  driver: Driver;
  passengers: number;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Two pending requisitions to the same destination whose combined passengers
 * fit one available vehicle with an available, breath-tested driver.
 * Returns null when no such pair exists — the card is then not shown.
 */
export function findPoolingSuggestion(
  reqs: readonly VehicleRequisition[],
  vehicles: readonly Vehicle[],
  drivers: readonly Driver[],
): PoolingSuggestion | null {
  const pending = reqs.filter((r) => r.status === 'pending' && !r.pooledWith);
  const driver = drivers.find((d) => d.status === 'available' && d.breathalyzerToday === '0.00% BAC (PASSED)');
  if (!driver) return null;

  for (let i = 0; i < pending.length; i++) {
    for (let j = i + 1; j < pending.length; j++) {
      const a = pending[i];
      const b = pending[j];
      if (norm(a.to) !== norm(b.to) || norm(a.from) !== norm(b.from)) continue;
      const passengers = a.passengersCount + b.passengersCount;
      const vehicle = vehicles
        .filter((v) => v.status === 'available' && v.type !== 'tanker' && v.capacitySeats >= passengers)
        .sort((x, y) => x.capacitySeats - y.capacitySeats)[0];
      if (vehicle) return { primary: a, secondary: b, vehicle, driver, passengers };
    }
  }
  return null;
}

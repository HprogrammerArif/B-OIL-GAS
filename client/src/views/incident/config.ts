/**
 * Incidents — who sees which reports and who investigates them.
 *
 * Modes (from permissions, never the role string):
 *  - investigate: `incident:investigate` — triage, RCA, CAPA and closure sign-off.
 *  - oversight:   `incident:view_all` — every report, read-only.
 *  - reporter:    `incident:report` only — reports they filed.
 */
import type { CurrentUser } from '../../auth/session';
import type { IncidentItem } from '../../store/operationsStore';
import { todayDate } from '../../lib/clock';

export type IncidentMode = 'investigate' | 'oversight' | 'reporter';

export function incidentModeFor(user: CurrentUser): IncidentMode {
  if (user.permissions.has('incident:investigate')) return 'investigate';
  if (user.permissions.has('incident:view_all')) return 'oversight';
  return 'reporter';
}

export const isMyReport = (inc: IncidentItem, user: CurrentUser) =>
  inc.reporterEmpId ? inc.reporterEmpId === user.empId : inc.reportedBy.startsWith(user.name);

/** Last recorded lost-time injury before the incidents held in the store. */
const LTI_BASELINE = new Date(2026, 0, 18);
const LOST_TIME_TYPES = new Set(['lost_time', 'fatality']);

export function daysSinceLostTime(incidents: readonly IncidentItem[]): number {
  let last = LTI_BASELINE;
  for (const inc of incidents) {
    if (!LOST_TIME_TYPES.has(inc.incidentType ?? '')) continue;
    const d = new Date(inc.date.split(',')[0]);
    if (!Number.isNaN(d.getTime()) && d > last) last = d;
  }
  return Math.max(0, Math.floor((todayDate().getTime() - last.getTime()) / 86_400_000));
}

export function incidentsVisibleTo(user: CurrentUser, mode: IncidentMode, incidents: readonly IncidentItem[]): IncidentItem[] {
  return mode === 'reporter' ? incidents.filter((i) => isMyReport(i, user)) : [...incidents];
}

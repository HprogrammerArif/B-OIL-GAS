/**
 * Reference-number generator matching the production convention
 * (`docs/platform/00` §5.2): `{PREFIX}-{YYYY}-{NNNN}` with a per-prefix
 * monotonic counter persisted across reloads, so demo records never collide
 * and never look random.
 */

const KEY = 'oneops.refs.v1';
const YEAR = 2026;

type Counters = Record<string, number>;

function load(): Counters {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Counters) : {};
  } catch {
    return {};
  }
}

let counters: Counters | null = null;

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(counters ?? {}));
  } catch {
    /* ignore */
  }
}

/** Seed starting points so new numbers follow the existing seed data. */
const SEED_START: Counters = {
  APR: 900,   // approvals / purchase requests
  NS: 1240,   // note-sheets
  CLM: 4120,  // claims
  REQ: 460,   // vehicle requisitions
  PCL: 2210,  // parcels
  VIS: 3310,  // visitor passes
  INC: 118,   // incidents
  LV: 2050,   // leave requests
  WO: 5270,   // work orders
  NOT: 310,   // notices
  BC: 40,     // broadcasts
  VCH: 7120,  // payment / sanction vouchers
  ARQ: 23,    // asset purchase requests
  TADA: 419,  // outstation travel claims
  CNV: 1002,  // local conveyance claims
  TOUR: 8,    // event / tour settlements
  PR: 0,      // purchase requisitions referenced from note-sheets
};

function formatRef(prefix: string, n: number, width: number): string {
  return `${prefix}-${YEAR}-${String(n).padStart(width, '0')}`;
}

/** `nextRef('APR')` → `APR-2026-0901` (allocates the number). */
export function nextRef(prefix: string, width = 4): string {
  counters ??= load();
  const current = counters[prefix] ?? SEED_START[prefix] ?? 0;
  const next = current + 1;
  counters[prefix] = next;
  save();
  return formatRef(prefix, next, width);
}

/** The number `nextRef(prefix)` would return, without allocating it (for form previews). */
export function peekRef(prefix: string, width = 4): string {
  counters ??= load();
  const current = counters[prefix] ?? SEED_START[prefix] ?? 0;
  return formatRef(prefix, current + 1, width);
}

function formatNoteSheetRef(deptCode: string, n: number): string {
  return `BOGCL/${deptCode}/${YEAR}/${String(n).padStart(4, '0')}`;
}

/** Department note-sheet numbers: `BOGCL/FIN/2026/0042` (allocates the number). */
export function nextNoteSheetRef(deptCode: string): string {
  counters ??= load();
  const key = `NS:${deptCode}`;
  const next = (counters[key] ?? 40) + 1;
  counters[key] = next;
  save();
  return formatNoteSheetRef(deptCode, next);
}

/** Preview of the next note-sheet number for a department, without allocating it. */
export function peekNoteSheetRef(deptCode: string): string {
  counters ??= load();
  return formatNoteSheetRef(deptCode, (counters[`NS:${deptCode}`] ?? 40) + 1);
}

/** Short department code used in note-sheet file numbers. */
export function deptCodeOf(dept: string): string {
  const known: Record<string, string> = {
    "Chairman's Office": 'CMD',
    'Plant Operations': 'PLANT',
    'Human Resources': 'HR',
    'Transport & Logistics': 'TRN',
    'Finance & Accounts': 'FIN',
    'Sales & Distribution': 'SLS',
  };
  return known[dept] ?? dept.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase();
}

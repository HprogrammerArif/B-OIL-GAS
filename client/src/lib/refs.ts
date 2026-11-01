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
};

/** `nextRef('APR')` → `APR-2026-0901` */
export function nextRef(prefix: string, width = 4): string {
  counters ??= load();
  const current = counters[prefix] ?? SEED_START[prefix] ?? 0;
  const next = current + 1;
  counters[prefix] = next;
  save();
  return `${prefix}-${YEAR}-${String(next).padStart(width, '0')}`;
}

/** Department note-sheet numbers: `BOGCL/FIN/2026/0042` */
export function nextNoteSheetRef(deptCode: string): string {
  counters ??= load();
  const key = `NS:${deptCode}`;
  const next = (counters[key] ?? 40) + 1;
  counters[key] = next;
  save();
  return `BOGCL/${deptCode}/${YEAR}/${String(next).padStart(4, '0')}`;
}

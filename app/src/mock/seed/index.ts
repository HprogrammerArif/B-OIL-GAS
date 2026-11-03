import { nowIso } from "../clock";
import { MOCK_DB_VERSION, type MockDb } from "../db/schema";
import { seedClaims } from "./claims";
import { seedAttendance } from "./attendance";
import { seedLeave } from "./leave";
import { seedNotices } from "./notices";
import { seedWorkflowNotifications } from "./notifications";
import { buildPeople, DEPARTMENTS, SITES } from "./org";
import { buildWorkflowSeed } from "./workflow";

/** Fresh database. Module seeds are composed here as modules are added. */
export function buildSeed(): MockDb {
  const { employees, users } = buildPeople();
  const db: MockDb = {
    version: MOCK_DB_VERSION,
    seededAt: nowIso(),
    counters: {},
    sites: SITES,
    departments: DEPARTMENTS,
    employees,
    users,
    sessions: [],
    preferences: {},
    workflow: buildWorkflowSeed(),
    otps: [],
    notifications: [],
    notices: [],
    broadcasts: [],
    geofences: [],
    shifts: [],
    shiftAssignments: {},
    punches: [],
    regularisations: [],
    leaveTypes: [],
    leaveBalances: [],
    leaveRequests: [],
    claims: [],
  };
  seedLeave(db);
  seedAttendance(db);
  seedClaims(db);
  seedWorkflowNotifications(db);
  seedNotices(db);
  return db;
}

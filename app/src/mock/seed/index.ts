import { nowIso } from "../clock";
import { MOCK_DB_VERSION, type MockDb } from "../db/schema";
import { buildPeople, DEPARTMENTS, SITES } from "./org";

/** Fresh database. Module seeds are composed here as modules are added. */
export function buildSeed(): MockDb {
  const { employees, users } = buildPeople();
  return {
    version: MOCK_DB_VERSION,
    seededAt: nowIso(),
    counters: {},
    sites: SITES,
    departments: DEPARTMENTS,
    employees,
    users,
    sessions: [],
    preferences: {},
  };
}

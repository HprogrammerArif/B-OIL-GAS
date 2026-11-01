import type { DepartmentRef, Lang, MeEmployee, RoleKey, SiteRef } from "@/types/domain/identity";

export interface MockEmployee extends MeEmployee {
  userId: string | null;
  email: string;
  sapPernr: string;
  nationalId: string;
  emergencyContact: string;
  exitDate: string | null;
  exitReason: string | null;
  clearance: {
    itAccessRevoked: boolean;
    rfidGateBadgeSurrendered: boolean;
    vehicleFuelCardReturned: boolean;
    financeAccountsSettled: boolean;
    clearedBy: string | null;
    clearedAt: string | null;
    notes: string | null;
  } | null;
}

export interface MockUser {
  id: string;
  email: string;
  phone: string;
  employeeId: string;
  roles: RoleKey[];
  passwordDigest: string;
  preferredLang: Lang;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  failedAttempts: number;
  lockedUntil: string | null;
  isActive: boolean;
}

export interface MockSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  platform: "ANDROID" | "IOS";
  refreshTokenHash: string;
  accessToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: string;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
}

export interface MockPreferences {
  lang: Lang;
  theme: "LIGHT" | "DARK" | "SYSTEM";
  notifications: { channels: ("IN_APP" | "PUSH" | "SMS" | "EMAIL")[]; quietStart: string | null; quietEnd: string | null };
}

/**
 * Whole in-app database. Module tables are added alongside their handlers;
 * bump `MOCK_DB_VERSION` whenever a table shape changes so devices reseed.
 */
export interface MockDb {
  version: number;
  seededAt: string;
  counters: Record<string, number>;
  sites: SiteRef[];
  departments: DepartmentRef[];
  employees: MockEmployee[];
  users: MockUser[];
  sessions: MockSession[];
  preferences: Record<string, MockPreferences>;
}

export const MOCK_DB_VERSION = 1;

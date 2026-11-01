/** Identity and access shapes (docs/platform/03 §2–§3, doc 00 §5.3). */

export type RoleKey =
  | "SUPER_ADMIN"
  | "CHAIRMAN"
  | "DIRECTOR"
  | "PLANT_GM"
  | "HOD"
  | "LINE_MANAGER"
  | "HR_ADMIN"
  | "FINANCE"
  | "TRANSPORT_ADMIN"
  | "COMPLIANCE_OFFICER"
  | "HSE_OFFICER"
  | "SECURITY_GATE"
  | "RECEPTION"
  | "MAILROOM"
  | "IT_ADMIN"
  | "DRIVER"
  | "EMPLOYEE"
  | "EXECUTIVE_ASSISTANT";

export type GrantScope = "SELF" | "TEAM" | "DEPARTMENT" | "SITE" | "COMPANY";

/** `module:action` keys from doc 03 Appendix A. */
export type PermissionKey = `${string}:${string}`;

export interface PermissionGrant {
  key: PermissionKey;
  scope: GrantScope;
  via: string;
  maxAmount: string | null;
}

/** Module keys used for navigation (doc 00 §7 registry). */
export type ModuleKey =
  | "dashboards"
  | "approvals"
  | "notices"
  | "note-sheets"
  | "parcels"
  | "assets"
  | "compliance"
  | "incidents"
  | "visitors"
  | "fleet"
  | "attendance"
  | "leave"
  | "claims"
  | "bus"
  | "chat"
  | "employees";

export interface MyPermissions {
  grants: PermissionGrant[];
  navigation: ModuleKey[];
}

export type Lang = "EN" | "BN";

export interface Ref {
  id: string;
  name: string;
  nameBn?: string;
}

export interface SiteRef {
  id: string;
  code: string;
  name: string;
  nameBn: string;
}

export interface DepartmentRef {
  id: string;
  code: string;
  name: string;
  nameBn: string;
}

export interface MeEmployee {
  id: string;
  empCode: string;
  fullName: string;
  fullNameBn: string;
  shortName: string;
  initials: string;
  designation: { id: string; title: string; titleBn: string };
  grade: { id: string; code: string; name: string };
  department: DepartmentRef;
  site: SiteRef;
  lineManager: { id: string; fullName: string } | null;
  joinDate: string;
  status: "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "OFFBOARDED";
  bloodGroup: string | null;
  phone: string;
  avatarColor: string;
}

export interface Me {
  id: string;
  email: string;
  phone: string;
  preferredLang: Lang;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  employee: MeEmployee;
  roles: { key: RoleKey; name: string; siteId: string | null }[];
}

export interface LoginRequest {
  identifier: string;
  password: string;
  rememberMe: boolean;
  device: { id: string; name: string; platform: "ANDROID" | "IOS"; appVersion: string };
}

export interface SessionTokens {
  accessToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  refreshToken: string;
  refreshExpiresAt: string;
}

export interface LoginResponse extends SessionTokens {
  user: { id: string; email: string; roles: RoleKey[]; preferredLang: Lang; mfaEnabled: boolean };
  mustChangePassword: boolean;
}

export interface UserSession {
  id: string;
  platform: "WEB" | "ANDROID" | "IOS";
  deviceName: string;
  ip: string | null;
  lastSeenAt: string;
  createdAt: string;
  isCurrent: boolean;
}

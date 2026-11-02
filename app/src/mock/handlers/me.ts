import { z } from "zod";
import type { Me, MyPermissions } from "@/types/domain/identity";
import { commit } from "../db";
import type { MockDb, MockPreferences, MockUser } from "../db/schema";
import { ok, validationError } from "../http";
import { register, requireAuth } from "../router";
import { navigationFor, ROLE_NAMES } from "../seed/rbac";

export function toMe(db: MockDb, user: MockUser): Me {
  const emp = db.employees.find((e) => e.id === user.employeeId);
  if (!emp) throw new Error(`employee missing for ${user.id}`);
  const { userId: _u, email: _e, sapPernr: _s, nationalId: _n, emergencyContact: _c, exitDate: _x, exitReason: _r, clearance: _cl, ...employee } = emp;
  return {
    id: user.id,
    email: user.email,
    phone: emp.phone,
    preferredLang: user.preferredLang,
    mfaEnabled: user.mfaEnabled,
    lastLoginAt: user.lastLoginAt,
    employee,
    roles: user.roles.map((key) => ({ key, name: ROLE_NAMES[key], siteId: null })),
  };
}

const defaultPrefs = (user: MockUser): MockPreferences => ({
  lang: user.preferredLang,
  theme: "SYSTEM",
  notifications: { channels: ["IN_APP", "PUSH"], quietStart: null, quietEnd: null },
});

const patchMeSchema = z.object({
  preferredLang: z.enum(["EN", "BN"]).optional(),
  employee: z
    .object({
      emergencyContact: z.string().trim().min(5).max(80).optional(),
      bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional(),
    })
    .optional(),
});

const patchPrefsSchema = z.object({
  lang: z.enum(["EN", "BN"]).optional(),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
  notifications: z
    .object({
      channels: z.array(z.enum(["IN_APP", "PUSH", "SMS", "EMAIL"])).optional(),
      quietStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      quietEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    })
    .optional(),
});

register([
  {
    method: "GET",
    path: "/me",
    handler: (ctx) => ok(toMe(ctx.db, requireAuth(ctx).user)),
  },
  {
    method: "PATCH",
    path: "/me",
    handler: (ctx) => {
      const { user, employee } = requireAuth(ctx);
      const parsed = patchMeSchema.safeParse(ctx.body);
      if (!parsed.success) throw validationError("body", "Invalid profile update");
      if (parsed.data.preferredLang) user.preferredLang = parsed.data.preferredLang;
      if (parsed.data.employee?.emergencyContact) employee.emergencyContact = parsed.data.employee.emergencyContact;
      if (parsed.data.employee?.bloodGroup) employee.bloodGroup = parsed.data.employee.bloodGroup;
      commit();
      return ok(toMe(ctx.db, user));
    },
  },
  {
    method: "GET",
    path: "/me/permissions",
    handler: (ctx) => {
      const { grants } = requireAuth(ctx);
      const body: MyPermissions = { grants, navigation: navigationFor(grants) };
      return ok(body);
    },
  },
  {
    method: "GET",
    path: "/me/preferences",
    handler: (ctx) => {
      const { user } = requireAuth(ctx);
      return ok(ctx.db.preferences[user.id] ?? defaultPrefs(user));
    },
  },
  {
    method: "PATCH",
    path: "/me/preferences",
    handler: (ctx) => {
      const { user } = requireAuth(ctx);
      const parsed = patchPrefsSchema.safeParse(ctx.body);
      if (!parsed.success) throw validationError("body", "Invalid preferences");
      const current = ctx.db.preferences[user.id] ?? defaultPrefs(user);
      const channels = parsed.data.notifications?.channels;
      const next: MockPreferences = {
        lang: parsed.data.lang ?? current.lang,
        theme: parsed.data.theme ?? current.theme,
        notifications: {
          ...current.notifications,
          ...parsed.data.notifications,
          channels: channels ? Array.from(new Set(["IN_APP" as const, ...channels])) : current.notifications.channels,
        },
      };
      ctx.db.preferences[user.id] = next;
      if (parsed.data.lang) user.preferredLang = parsed.data.lang;
      commit();
      return ok(next);
    },
  },
]);

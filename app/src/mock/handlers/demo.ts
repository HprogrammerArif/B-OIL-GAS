import { z } from "zod";
import { resetDb } from "../db";
import { ok, notFound, validationError } from "../http";
import { register } from "../router";
import { PERSONAS } from "../seed/org";
import { openSession } from "./auth";

/**
 * Presenter-only routes. They exist solely inside the in-app mock server, so a live
 * build has no such endpoints; the presenter panel is also hidden unless `isMockApi`.
 */
const personaSchema = z.object({
  empCode: z.string().regex(/^EMP-\d{4}$/),
  device: z.object({
    id: z.string().min(1),
    name: z.string().default("Mobile device"),
    platform: z.enum(["ANDROID", "IOS"]).default("ANDROID"),
  }),
});

register([
  {
    method: "GET",
    path: "/__demo/personas",
    auth: false,
    handler: ({ db }) =>
      ok(
        PERSONAS.map((p) => {
          const emp = db.employees.find((e) => e.empCode === p.code);
          return {
            empCode: p.code,
            roleLabel: p.roleLabel,
            roleLabelBn: p.roleLabelBn,
            fullName: emp?.fullName ?? p.code,
            fullNameBn: emp?.fullNameBn ?? p.code,
            initials: emp?.initials ?? "",
            avatarColor: emp?.avatarColor ?? "#64748B",
            designation: emp?.designation.title ?? "",
            designationBn: emp?.designation.titleBn ?? "",
          };
        }),
      ),
  },
  {
    method: "POST",
    path: "/__demo/session",
    auth: false,
    handler: async ({ db, body }) => {
      const parsed = personaSchema.safeParse(body);
      if (!parsed.success) throw validationError("empCode", "Unknown persona");
      const emp = db.employees.find((e) => e.empCode === parsed.data.empCode);
      const user = emp && db.users.find((u) => u.employeeId === emp.id);
      if (!user) throw notFound("Persona");
      return ok(await openSession(db, user, parsed.data.device));
    },
  },
  {
    method: "POST",
    path: "/__demo/reset",
    auth: false,
    handler: async () => {
      await resetDb();
      return ok({ reset: true });
    },
  },
]);

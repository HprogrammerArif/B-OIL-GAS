import type { RoleKey } from "@/types/domain/identity";

export type HomeVariant = "driver" | "gate" | "mailroom" | "hse" | "executive" | "approver" | "employee";

/** First match is the default landing (doc 05 §10); every match is offered in the switcher. */
const ORDER: [HomeVariant, RoleKey[]][] = [
  ["driver", ["DRIVER"]],
  ["executive", ["CHAIRMAN", "DIRECTOR"]],
  ["approver", ["PLANT_GM", "HOD", "LINE_MANAGER", "FINANCE", "HR_ADMIN", "TRANSPORT_ADMIN"]],
  ["gate", ["SECURITY_GATE", "RECEPTION"]],
  ["mailroom", ["MAILROOM"]],
  ["hse", ["HSE_OFFICER"]],
];

export function homeVariantsFor(roles: RoleKey[]): HomeVariant[] {
  const matches = ORDER.filter(([, keys]) => keys.some((k) => roles.includes(k))).map(([v]) => v);
  return matches.length ? matches : ["employee"];
}

export function resolveHomeVariant(roles: RoleKey[], preferred: string | null): HomeVariant {
  const variants = homeVariantsFor(roles);
  const pick = variants.find((v) => v === preferred);
  return pick ?? variants[0] ?? "employee";
}

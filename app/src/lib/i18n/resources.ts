import enAuth from "@/locales/en/auth.json";
import enCommon from "@/locales/en/common.json";
import enErrors from "@/locales/en/errors.json";
import enHome from "@/locales/en/home.json";
import bnAuth from "@/locales/bn/auth.json";
import bnCommon from "@/locales/bn/common.json";
import bnErrors from "@/locales/bn/errors.json";
import bnHome from "@/locales/bn/home.json";

/** Namespaces mirror feature folders; add a pair of JSON files per new namespace. */
export const resources = {
  en: { common: enCommon, auth: enAuth, errors: enErrors, home: enHome },
  bn: { common: bnCommon, auth: bnAuth, errors: bnErrors, home: bnHome },
} as const;

export type Namespace = keyof (typeof resources)["en"];
export const namespaces = Object.keys(resources.en) as Namespace[];

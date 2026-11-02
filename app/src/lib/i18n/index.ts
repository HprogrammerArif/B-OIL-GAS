import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import type { AppLanguage } from "@/redux/slices/ui.slice";
import { namespaces, resources } from "./resources";

export function deviceLanguage(): AppLanguage {
  return getLocales()[0]?.languageCode === "bn" ? "bn" : "en";
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: "en",
  ns: namespaces,
  defaultNS: "common",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function setLanguage(lang: AppLanguage): void {
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
}

export default i18n;

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  formatDate,
  formatDateTime,
  formatDayTime,
  formatDistance,
  formatMoney,
  formatNumber,
  formatTime,
  type FormatOptions,
} from "@/lib/i18n/format";
import { useAppSelector } from "@/redux/hooks";
import type { AppLanguage } from "@/redux/slices/ui.slice";

export function useLanguage(): AppLanguage {
  const { i18n } = useTranslation();
  return i18n.language === "bn" ? "bn" : "en";
}

/** Pick the right side of a bilingual server field (`title` / `titleBn`). */
export function useLocalized() {
  const lang = useLanguage();
  return useMemo(
    () =>
      (en: string | null | undefined, bn: string | null | undefined): string =>
        (lang === "bn" ? bn || en : en || bn) ?? "",
    [lang],
  );
}

/** Locale-bound formatters honouring the Bengali-numerals preference. */
export function useFormat() {
  const lang = useLanguage();
  const bengaliNumerals = useAppSelector((s) => s.ui.bengaliNumerals);
  const { t } = useTranslation();
  return useMemo(() => {
    const o: FormatOptions = { lang, bengaliNumerals };
    return {
      number: (n: number, fractionDigits = 0) => formatNumber(n, o, fractionDigits),
      money: (v: string | number, compact = false) => formatMoney(v, o, { compact }),
      date: (iso: string | Date, pattern?: string) => formatDate(iso, o, pattern),
      time: (iso: string | Date) => formatTime(iso, o),
      dateTime: (iso: string | Date) => formatDateTime(iso, o),
      dayTime: (iso: string) =>
        formatDayTime(iso, o, { today: t("time.today"), yesterday: t("time.yesterday"), tomorrow: t("time.tomorrow") }),
      ago: (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        if (diff >= 0 && diff < 60_000) return t("time.justNow");
        const d = formatDistance(iso, o);
        return diff >= 0 ? t("time.ago", { time: d }) : t("time.in", { time: d });
      },
    };
  }, [lang, bengaliNumerals, t]);
}

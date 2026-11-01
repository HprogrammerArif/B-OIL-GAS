import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday } from "date-fns";
import { bn, enUS } from "date-fns/locale";
import type { AppLanguage } from "@/redux/slices/ui.slice";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBengaliDigits(value: string): string {
  return value.replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export interface FormatOptions {
  lang: AppLanguage;
  bengaliNumerals: boolean;
}

const digits = (s: string, o: FormatOptions) => (o.lang === "bn" && o.bengaliNumerals ? toBengaliDigits(s) : s);

/** South-Asian grouping (12,34,567) used for both languages, as on BOGCL paperwork. */
function groupLakh(intPart: string): string {
  if (intPart.length <= 3) return intPart;
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

export function formatNumber(value: number, o: FormatOptions, fractionDigits = 0): string {
  const negative = value < 0;
  const [int = "0", frac] = Math.abs(value).toFixed(fractionDigits).split(".");
  const out = `${negative ? "-" : ""}${groupLakh(int)}${frac ? `.${frac}` : ""}`;
  return digits(out, o);
}

/** Money arrives as decimal strings (doc 03); shows "৳ 1,25,000" or "৳ 1,250.50". */
export function formatMoney(value: string | number, o: FormatOptions, opts: { compact?: boolean } = {}): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  if (opts.compact) {
    const abs = Math.abs(n);
    if (abs >= 10_000_000) return `৳ ${digits((n / 10_000_000).toFixed(abs >= 100_000_000 ? 0 : 1), o)} ${o.lang === "bn" ? "কোটি" : "Cr"}`;
    if (abs >= 100_000) return `৳ ${digits((n / 100_000).toFixed(abs >= 1_000_000 ? 0 : 1), o)} ${o.lang === "bn" ? "লাখ" : "L"}`;
  }
  const hasFraction = Math.round(n * 100) % 100 !== 0;
  return `৳ ${formatNumber(n, o, hasFraction ? 2 : 0)}`;
}

const localeOf = (o: FormatOptions) => (o.lang === "bn" ? bn : enUS);

export function formatDate(iso: string | Date, o: FormatOptions, pattern = "d MMM yyyy"): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return digits(format(d, pattern, { locale: localeOf(o) }), o);
}

export function formatTime(iso: string | Date, o: FormatOptions): string {
  return formatDate(iso, o, "h:mm a");
}

export function formatDateTime(iso: string | Date, o: FormatOptions): string {
  return formatDate(iso, o, "d MMM, h:mm a");
}

/** "Today, 3:40 PM" / "Yesterday, …" / "12 Oct, …" */
export function formatDayTime(
  iso: string,
  o: FormatOptions,
  words: { today: string; yesterday: string; tomorrow: string },
): string {
  const d = new Date(iso);
  const day = isToday(d) ? words.today : isYesterday(d) ? words.yesterday : isTomorrow(d) ? words.tomorrow : formatDate(d, o, "d MMM");
  return `${day}, ${formatTime(d, o)}`;
}

/** "5 minutes" — callers wrap it with `time.ago` / `time.in`. */
export function formatDistance(iso: string, o: FormatOptions): string {
  return digits(formatDistanceToNowStrict(new Date(iso), { locale: localeOf(o) }), o);
}

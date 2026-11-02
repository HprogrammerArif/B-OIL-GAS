/**
 * Design tokens — the only place colours, spacing, radii and type scale are defined.
 * Components read colours through `useTheme()` and never hardcode hex values.
 * Palette mirrors the web prototype tokens (docs/platform/05 §11.1).
 */
import { Platform } from "react-native";

export const Brand = {
  crimson: "#A51C30",
  crimsonDark: "#7F1424",
  crimsonLight: "#C8102E",
  slate900: "#0B132B",
  slate950: "#060D1F",
  slate100: "#F1F5F9",
  canvas: "#F8FAFC",
  gold: "#D4AF37",
  goldDark: "#AA820A",
  goldLight: "#F0DFA0",
} as const;

export const Colors = {
  light: {
    background: Brand.canvas,
    surface: "#FFFFFF",
    surfaceSecondary: Brand.slate100,
    surfaceInverse: Brand.slate900,
    brand: Brand.slate900,
    onBrand: "#F8FAFC",
    onBrandMuted: "#94A3B8",
    border: "#E2E8F0",
    borderStrong: "#CBD5E1",
    text: Brand.slate900,
    textSecondary: "#475569",
    textTertiary: "#94A3B8",
    textInverse: "#F8FAFC",
    onAccent: "#FFFFFF",
    accent: Brand.crimson,
    accentPressed: Brand.crimsonDark,
    accentMuted: "#FBE9EC",
    executive: Brand.goldDark,
    executiveSolid: Brand.gold,
    executiveMuted: "#FBF5E0",
    success: "#059669",
    successMuted: "#ECFDF5",
    warning: "#B45309",
    warningMuted: "#FFFBEB",
    danger: "#DC2626",
    dangerMuted: "#FEF2F2",
    info: "#0369A1",
    infoMuted: "#EFF6FF",
    purple: "#7C3AED",
    purpleMuted: "#F5F3FF",
    overlay: "rgba(11, 19, 43, 0.45)",
    shadow: "#0B132B",
  },
  dark: {
    background: Brand.slate950,
    surface: Brand.slate900,
    surfaceSecondary: "#141C33",
    surfaceInverse: "#F8FAFC",
    brand: "#111B38",
    onBrand: "#F8FAFC",
    onBrandMuted: "#94A3B8",
    border: "#1F2A44",
    borderStrong: "#2C3A5A",
    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textTertiary: "#7C8BA5",
    textInverse: Brand.slate900,
    onAccent: "#FFFFFF",
    accent: Brand.crimsonLight,
    accentPressed: Brand.crimson,
    accentMuted: "#3A1016",
    executive: Brand.goldLight,
    executiveSolid: Brand.gold,
    executiveMuted: "#2E2710",
    success: "#34D399",
    successMuted: "#0B2B22",
    warning: "#FBBF24",
    warningMuted: "#332107",
    danger: "#F87171",
    dangerMuted: "#3A1414",
    info: "#38BDF8",
    infoMuted: "#0C2A3F",
    purple: "#A78BFA",
    purpleMuted: "#231A3D",
    overlay: "rgba(0, 0, 0, 0.6)",
    shadow: "#000000",
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };
export type ColorSchemeName = keyof typeof Colors;

/** Semantic tones used by badges, pills, stat cards and banners. */
export type Tone = "accent" | "executive" | "success" | "warning" | "danger" | "info" | "purple" | "neutral";

export function toneColors(theme: ThemeColors, tone: Tone): { fg: string; bg: string } {
  switch (tone) {
    case "accent":
      return { fg: theme.accent, bg: theme.accentMuted };
    case "executive":
      return { fg: theme.executive, bg: theme.executiveMuted };
    case "success":
      return { fg: theme.success, bg: theme.successMuted };
    case "warning":
      return { fg: theme.warning, bg: theme.warningMuted };
    case "danger":
      return { fg: theme.danger, bg: theme.dangerMuted };
    case "info":
      return { fg: theme.info, bg: theme.infoMuted };
    case "purple":
      return { fg: theme.purple, bg: theme.purpleMuted };
    case "neutral":
      return { fg: theme.textSecondary, bg: theme.surfaceSecondary };
  }
}

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export type FontWeightKey = "regular" | "medium" | "semibold" | "bold" | "extrabold";

/** Font families registered in the root layout (expo-font). Bengali has no 800 weight. */
export const FontFamily: Record<"en" | "bn", Record<FontWeightKey, string>> = {
  en: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
    extrabold: "Inter_800ExtraBold",
  },
  bn: {
    regular: "NotoSansBengali_400Regular",
    medium: "NotoSansBengali_500Medium",
    semibold: "NotoSansBengali_600SemiBold",
    bold: "NotoSansBengali_700Bold",
    extrabold: "NotoSansBengali_700Bold",
  },
};

export type TypographyVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodyStrong"
  | "bodySmall"
  | "caption"
  | "overline"
  | "mono";

export const Typography: Record<TypographyVariant, { fontSize: number; lineHeight: number; weight: FontWeightKey; letterSpacing?: number }> = {
  display: { fontSize: 30, lineHeight: 36, weight: "extrabold", letterSpacing: -0.4 },
  h1: { fontSize: 24, lineHeight: 30, weight: "extrabold", letterSpacing: -0.3 },
  h2: { fontSize: 19, lineHeight: 25, weight: "bold", letterSpacing: -0.1 },
  h3: { fontSize: 16, lineHeight: 22, weight: "bold" },
  body: { fontSize: 15, lineHeight: 22, weight: "regular" },
  bodyStrong: { fontSize: 15, lineHeight: 22, weight: "semibold" },
  bodySmall: { fontSize: 13, lineHeight: 19, weight: "regular" },
  caption: { fontSize: 12, lineHeight: 16, weight: "medium" },
  overline: { fontSize: 11, lineHeight: 14, weight: "bold", letterSpacing: 0.8 },
  mono: { fontSize: 13, lineHeight: 18, weight: "semibold" },
};

/** Bengali glyphs need taller line boxes (doc 05 §11.2). */
export const BENGALI_LINE_HEIGHT_FACTOR = 1.25;

export const MonoFamily = Platform.select({ ios: "Menlo", default: "monospace" });

export const MaxContentWidth = 720;
export const MinTouchTarget = 44;

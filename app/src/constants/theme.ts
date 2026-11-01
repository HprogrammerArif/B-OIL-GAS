/**
 * Single source of truth for design tokens — colors, spacing, radius, typography.
 * Screens and components should read from `useTheme()` (colors) and the token
 * exports below (Spacing / Radius / Typography) instead of hardcoding values.
 */

import "@/global.css";

import { Platform } from "react-native";

const accent = "#2B7FFF";

export const Colors = {
  light: {
    background: "#F9FAFB",
    surface: "#FFFFFF",
    surfaceSecondary: "#F3F4F6",
    border: "#E5E7EB",
    text: "#111827",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
    onAccent: "#FFFFFF",

    accent,
    accentMuted: "#EFF6FF",

    success: "#10B981",
    successMuted: "#ECFDF5",
    warning: "#F59E0B",
    warningMuted: "#FFFBEB",
    danger: "#EF4444",
    dangerMuted: "#FEF2F2",

    // Legacy aliases kept for backward compatibility with existing call sites.
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
  },
  dark: {
    background: "#0B0D12",
    surface: "#16181D",
    surfaceSecondary: "#1F2126",
    border: "#2A2D33",
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    onAccent: "#FFFFFF",

    accent,
    accentMuted: "#152238",

    success: "#34D399",
    successMuted: "#0B2B22",
    warning: "#FBBF24",
    warningMuted: "#332107",
    danger: "#F87171",
    dangerMuted: "#3A1414",

    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const Typography = {
  display: { fontSize: 30, fontWeight: "800", letterSpacing: -0.3 },
  h1: { fontSize: 26, fontWeight: "800", letterSpacing: -0.2 },
  h2: { fontSize: 20, fontWeight: "800" },
  h3: { fontSize: 17, fontWeight: "700" },
  body: { fontSize: 15, fontWeight: "400" },
  bodyStrong: { fontSize: 15, fontWeight: "600" },
  bodySmall: { fontSize: 13, fontWeight: "400" },
  caption: { fontSize: 12, fontWeight: "600" },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

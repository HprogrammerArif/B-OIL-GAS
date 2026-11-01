import { memo } from "react";
import { Text as RNText, StyleSheet, type TextProps as RNTextProps, type TextStyle } from "react-native";
import {
  BENGALI_LINE_HEIGHT_FACTOR,
  FontFamily,
  MonoFamily,
  type FontWeightKey,
  type ThemeColors,
  Typography,
  type TypographyVariant,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/useLanguage";

export type TextColor = keyof Pick<
  ThemeColors,
  | "text"
  | "textSecondary"
  | "textTertiary"
  | "textInverse"
  | "onAccent"
  | "accent"
  | "executive"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
>;

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TextColor;
  /** Raw colour from a tone helper; prefer `color` for theme keys. */
  tint?: string;
  weight?: FontWeightKey;
  align?: TextStyle["textAlign"];
  uppercase?: boolean;
}

/**
 * The only text primitive. Picks Inter or Noto Sans Bengali per language and
 * lifts Bengali line height so conjuncts never clip.
 */
export const Text = memo(function Text({
  variant = "body",
  color = "text",
  tint,
  weight,
  align,
  uppercase,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const lang = useLanguage();
  const t = Typography[variant];
  const isMono = variant === "mono";
  const lineHeight = lang === "bn" ? Math.round(t.lineHeight * BENGALI_LINE_HEIGHT_FACTOR) : t.lineHeight;

  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        {
          fontFamily: isMono ? MonoFamily : FontFamily[lang][weight ?? t.weight],
          fontSize: t.fontSize,
          lineHeight,
          letterSpacing: lang === "bn" ? 0 : t.letterSpacing,
          color: tint ?? theme[color],
          textAlign: align,
          textTransform: uppercase && lang === "en" ? "uppercase" : undefined,
        },
        isMono && weight ? styles.monoBold : null,
        style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  monoBold: { fontWeight: "700" },
});

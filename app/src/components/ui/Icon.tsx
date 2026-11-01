import { memo } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { useTheme } from "@/hooks/use-theme";
import type { ThemeColors } from "@/constants/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

interface IconProps {
  name: IconName;
  size?: number;
  color?: keyof ThemeColors;
  tint?: string;
}

/** Ionicons through theme colours; decorative by default (screen readers skip it). */
export const Icon = memo(function Icon({ name, size = 20, color = "text", tint }: IconProps) {
  const theme = useTheme();
  return (
    <Ionicons
      name={name}
      size={size}
      color={tint ?? theme[color]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
});

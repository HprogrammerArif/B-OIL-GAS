import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Radius, type Tone, toneColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface ProgressBarProps {
  /** 0–1 */
  value: number;
  tone?: Tone;
  height?: number;
  accessibilityLabel?: string;
}

export const ProgressBar = memo(function ProgressBar({ value, tone = "accent", height = 6, accessibilityLabel }: ProgressBarProps) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      style={[styles.track, { height, backgroundColor: theme.surfaceSecondary }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
    >
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: toneColors(theme, tone).fg }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  track: { width: "100%", borderRadius: Radius.full, overflow: "hidden" },
  fill: { height: "100%", borderRadius: Radius.full },
});

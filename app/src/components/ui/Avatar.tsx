import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { Text } from "./Text";

interface AvatarProps {
  initials: string;
  /** Per-person colour from the directory record. */
  color?: string;
  size?: number;
  ring?: boolean;
}

export const Avatar = memo(function Avatar({ initials, color, size = 40, ring = false }: AvatarProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color ?? theme.accent,
          borderColor: theme.executiveSolid,
          borderWidth: ring ? 2 : 0,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text
        variant={size >= 56 ? "h2" : "caption"}
        weight="bold"
        color="onAccent"
        style={{ fontSize: Math.max(11, Math.round(size * 0.36)) }}
      >
        {initials.slice(0, 3)}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
});

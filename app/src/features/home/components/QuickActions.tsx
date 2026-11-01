import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";
import { Icon, Text, type IconName } from "@/components/ui";
import { Radius, Spacing, type Tone, toneColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { haptic } from "@/lib/haptics";

export interface QuickAction {
  key: string;
  label: string;
  icon: IconName;
  tone: Tone;
  href: string;
}

/** Four-up action grid; every tile is ≥ 44 pt and labelled for screen readers. */
export const QuickActions = memo(function QuickActions({ actions }: { actions: QuickAction[] }) {
  const theme = useTheme();
  return (
    <View style={styles.grid}>
      {actions.map((a) => {
        const c = toneColors(theme, a.tone);
        return (
          <Pressable
            key={a.key}
            onPress={() => {
              haptic.tap();
              router.push(a.href as Href);
            }}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            style={({ pressed }) => [styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}
          >
            <View style={[styles.icon, { backgroundColor: c.bg }]}>
              <Icon name={a.icon} size={22} tint={c.fg} />
            </View>
            <Text variant="caption" align="center" numberOfLines={2}>
              {a.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  tile: {
    width: "23.5%",
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.8 },
});

import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Spacing } from "@/constants/theme";
import { Text } from "./Text";

interface SectionHeaderProps {
  title: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader = memo(function SectionHeader({ title, count, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row} accessibilityRole="header">
      <Text variant="overline" color="textSecondary" uppercase>
        {count !== undefined ? `${title} · ${count}` : title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text variant="bodySmall" weight="bold" color="accent">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
});

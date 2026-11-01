import { ComponentProps, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  description?: string;
  action?: ReactNode;
}

/** EmptyState — consistent "nothing here yet" placeholder for lists/search results. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={44} color={theme.textTertiary} />
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
      )}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
  },
  title: { fontSize: 16, fontWeight: "700", marginTop: Spacing.sm },
  description: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  action: { marginTop: Spacing.md },
});

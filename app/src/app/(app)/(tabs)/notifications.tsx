import { useCallback, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Badge, EmptyState } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/constants/theme";

// Scaffold data — replace with RTK Query
type NotifType = "info" | "success" | "alert";
const NOTIFICATIONS: {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}[] = [
  {
    id: "1",
    type: "success",
    title: "Welcome aboard! 🎉",
    body: "Your account has been created successfully.",
    time: "Just now",
    read: false,
  },
  {
    id: "2",
    type: "info",
    title: "New feature available",
    body: "Check out what's new in the latest update.",
    time: "2h ago",
    read: false,
  },
  {
    id: "3",
    type: "alert",
    title: "Action required",
    body: "Please complete your profile to get started.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "4",
    type: "info",
    title: "Weekly summary",
    body: "Here's what happened this week.",
    time: "Mon",
    read: true,
  },
];

export default function NotificationsScreen() {
  const theme = useTheme();
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  const typeConfig = useMemo<
    Record<NotifType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }>
  >(
    () => ({
      info: { icon: "information-circle", color: theme.accent, bg: theme.accentMuted },
      success: { icon: "checkmark-circle", color: theme.success, bg: theme.successMuted },
      alert: { icon: "warning", color: theme.warning, bg: theme.warningMuted },
    }),
    [theme],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof NOTIFICATIONS)[number] }) => {
      const cfg = typeConfig[item.type];
      return (
        <TouchableOpacity
          style={[
            styles.item,
            { backgroundColor: theme.surface },
            !item.read && { borderLeftWidth: 3, borderLeftColor: theme.accent },
          ]}
          activeOpacity={0.75}
        >
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={22} color={cfg.color} />
          </View>
          <View style={styles.textWrap}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  {
                    color: item.read ? theme.textSecondary : theme.text,
                    fontWeight: item.read ? "600" : "700",
                  },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={[styles.time, { color: theme.textTertiary }]}>{item.time}</Text>
            </View>
            <Text style={[styles.body, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.body}
            </Text>
          </View>
          {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
        </TouchableOpacity>
      );
    },
    [theme, typeConfig],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View
        style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
      >
        <Text style={[Typography.h1, { color: theme.text }]}>Notifications</Text>
        {unreadCount > 0 && <Badge label={`${unreadCount} new`} variant="accent" />}
      </View>

      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState icon="notifications-off-outline" title="No notifications yet" />
        }
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  list: { padding: Spacing.lg },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  title: { fontSize: 14, flex: 1, marginRight: Spacing.sm },
  time: { fontSize: 11, flexShrink: 0 },
  body: { fontSize: 13, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: Radius.full, flexShrink: 0 },
});

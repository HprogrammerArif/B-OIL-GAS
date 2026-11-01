import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, EmptyState } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

const QUICK_ACTIONS = [
  { icon: "add-circle-outline", label: "New", onPress: () => router.push("/new-item") },
  { icon: "search-outline", label: "Search", onPress: undefined },
  { icon: "heart-outline", label: "Saved", onPress: undefined },
  { icon: "settings-outline", label: "Settings", onPress: undefined },
] as const;

export default function HomeScreen() {
  const theme = useTheme();
  const user = useAppSelector(selectCurrentUser);
  const firstName = user?.first_name || user?.username || "there";

  return (
    <Screen padded={false}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>Good morning 👋</Text>
            <Text style={[Typography.h2, { color: theme.text }]}>{firstName}</Text>
          </View>
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: theme.accent }]}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Text style={styles.avatarText}>
              {(user?.first_name?.[0] ?? user?.username?.[0] ?? "U").toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero card */}
        <Card style={styles.heroCard}>
          <Text style={[styles.heroLabel, { color: theme.accent }]}>Getting Started</Text>
          <Text style={[Typography.h2, { color: theme.text, marginBottom: Spacing.sm }]}>
            Build something amazing
          </Text>
          <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
            This starter is ready for your next project. Wire up the API and you&apos;re live.
          </Text>
          <TouchableOpacity style={styles.heroCta} activeOpacity={0.7}>
            <Text style={[styles.heroCtaText, { color: theme.accent }]}>Get Started</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.accent} />
          </TouchableOpacity>
        </Card>

        {/* Quick actions */}
        <Text style={[Typography.h2, styles.sectionTitle, { color: theme.text }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionCard, { backgroundColor: theme.accentMuted }]}
              activeOpacity={0.75}
              onPress={action.onPress}
              disabled={!action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Ionicons name={action.icon} size={28} color={theme.accent} />
              <Text style={[styles.actionLabel, { color: theme.accent }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent activity */}
        <View style={styles.recentHeader}>
          <Text style={[Typography.h2, { color: theme.text }]}>Recent Activity</Text>
        </View>
        <Card>
          <EmptyState
            icon="time-outline"
            title="Nothing here yet"
            description="Your recent activity will show up here once you start using the app."
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  greeting: { fontSize: 14 },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  heroCard: { marginBottom: Spacing.xxl },
  heroLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  heroSub: { fontSize: 14, lineHeight: 20, marginBottom: Spacing.md },
  heroCta: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  heroCtaText: { fontWeight: "700", fontSize: 14 },
  sectionTitle: { marginBottom: Spacing.md },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  actionCard: {
    width: "47%",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionLabel: { fontSize: 13, fontWeight: "700" },
  recentHeader: { marginBottom: Spacing.md },
});

import { ComponentProps } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Card } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout, selectCurrentUser, TUser } from "@/redux/features/auth/authSlice";

function getInitials(user: TUser | null): string {
  if (!user) return "?";
  if (user.first_name && user.last_name) {
    return (user.first_name[0] + user.last_name[0]).toUpperCase();
  }
  if (user.first_name) return user.first_name[0].toUpperCase();
  if (user.username) return user.username[0].toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return "?";
}

function getDisplayName(user: TUser | null): string {
  if (!user) return "User";
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return full || user.username || user.email?.split("@")[0] || "User";
}

interface ListItemProps {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  iconBg?: string;
  iconColor?: string;
  rightComponent?: React.ReactNode;
  danger?: boolean;
}

function ListItem({
  icon,
  label,
  onPress,
  iconBg,
  iconColor,
  rightComponent,
  danger,
}: ListItemProps) {
  const theme = useTheme();
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.listIcon, { backgroundColor: iconBg ?? theme.surfaceSecondary }]}>
        <Ionicons name={icon} size={20} color={danger ? theme.danger : (iconColor ?? theme.text)} />
      </View>
      <Text style={[styles.listLabel, { color: danger ? theme.danger : theme.text }]}>{label}</Text>
      {rightComponent ?? <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const initials = getInitials(user);
  const displayName = getDisplayName(user);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          dispatch(logout());
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[Typography.h2, { color: theme.text }]}>{displayName}</Text>
          {user?.email && (
            <Text style={[styles.email, { color: theme.textSecondary }]}>{user.email}</Text>
          )}
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: theme.border }]}
            onPress={() => router.push("/edit-profile")}
          >
            <Text style={[styles.editBtnText, { color: theme.text }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>Account</Text>
          <Card padded={false}>
            <ListItem
              icon="person-outline"
              label="Personal Information"
              onPress={() => router.push("/edit-profile")}
              iconBg={theme.accentMuted}
              iconColor={theme.accent}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ListItem icon="lock-closed-outline" label="Change Password" onPress={() => {}} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ListItem icon="mail-outline" label="Email Preferences" onPress={() => {}} />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>App</Text>
          <Card padded={false}>
            <ListItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => {}}
              iconBg={theme.warningMuted}
              iconColor={theme.warning}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ListItem
              icon="star-outline"
              label="Subscription"
              onPress={() => {}}
              iconBg={theme.warningMuted}
              iconColor={theme.warning}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ListItem
              icon="shield-checkmark-outline"
              label="Privacy & Security"
              onPress={() => {}}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>Support</Text>
          <Card padded={false}>
            <ListItem icon="help-circle-outline" label="Help Center" onPress={() => {}} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ListItem icon="document-text-outline" label="Terms & Privacy" onPress={() => {}} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ListItem icon="information-circle-outline" label="About" onPress={() => {}} />
          </Card>
        </View>

        <View style={styles.section}>
          <Card padded={false}>
            <ListItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
          </Card>
        </View>

        <Text style={[styles.version, { color: theme.textTertiary }]}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.huge - 8,
  },
  avatarSection: { alignItems: "center", marginBottom: Spacing.xxl + 4 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "800" },
  email: { fontSize: 14, marginBottom: Spacing.md },
  editBtn: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  editBtnText: { fontSize: 14, fontWeight: "600" },
  section: { marginBottom: Spacing.md + 2 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.md,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  listLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  divider: { height: 1, marginLeft: 64 },
  version: { textAlign: "center", fontSize: 12, marginTop: Spacing.sm },
});

import { Alert, Pressable, StyleSheet, View } from "react-native";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { Avatar, Card, Divider, Icon, ListRow, Screen, SectionHeader, Text } from "@/components/ui";
import { MODULES } from "@/constants/modules";
import { Radius, Spacing, toneColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLocalized } from "@/hooks/useLanguage";
import { usePermissions } from "@/hooks/usePermission";
import { haptic } from "@/lib/haptics";
import { isRouteBuilt } from "@/lib/routes";
import { useGetMeQuery } from "@/features/auth/api";
import { signOut } from "@/features/auth/session";
import { useAppDispatch } from "@/redux/hooks";

export function MoreScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const localized = useLocalized();
  const dispatch = useAppDispatch();
  const { navigation } = usePermissions();
  const { data: me } = useGetMeQuery();
  const modules = MODULES.filter((m) => navigation.includes(m.key) && m.key !== "attendance" && isRouteBuilt(m.href));

  const confirmSignOut = () =>
    Alert.alert(t("actions.signOut"), undefined, [
      { text: t("actions.cancel"), style: "cancel" },
      { text: t("actions.signOut"), style: "destructive", onPress: () => void signOut(dispatch) },
    ]);

  return (
    <Screen title={t("more.title")} back={false}>
      {me ? (
        <Card onPress={() => router.push("/profile" as Href)} accessibilityLabel={t("more.profile")}>
          <View style={styles.profile}>
            <Avatar initials={me.employee.initials} color={me.employee.avatarColor} size={52} />
            <View style={styles.flex}>
              <Text variant="h3" numberOfLines={1}>
                {localized(me.employee.fullName, me.employee.fullNameBn)}
              </Text>
              <Text variant="bodySmall" color="textSecondary" numberOfLines={1}>
                {localized(me.employee.designation.title, me.employee.designation.titleBn)}
              </Text>
              <Text variant="mono" color="textTertiary">
                {me.employee.empCode}
              </Text>
            </View>
            <Icon name="chevron-forward" color="textTertiary" />
          </View>
        </Card>
      ) : null}

      <SectionHeader title={t("more.modules")} />
      <View style={styles.grid}>
        {modules.map((m) => {
          const c = toneColors(theme, m.tone);
          return (
            <Pressable
              key={m.key}
              onPress={() => {
                haptic.tap();
                router.push(m.href as Href);
              }}
              accessibilityRole="button"
              accessibilityLabel={t(`modules.${m.key}`)}
              accessibilityHint={t(`moduleHints.${m.key}`)}
              style={({ pressed }) => [styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}
            >
              <View style={[styles.tileIcon, { backgroundColor: c.bg }]}>
                <Icon name={m.icon} size={22} tint={c.fg} />
              </View>
              <Text variant="bodySmall" weight="bold" numberOfLines={2}>
                {t(`modules.${m.key}`)}
              </Text>
              <Text variant="caption" color="textTertiary" numberOfLines={2}>
                {t(`moduleHints.${m.key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title={t("more.account")} />
      <Card padded={false}>
        <ListRow icon="person-circle-outline" title={t("more.profile")} onPress={() => router.push("/profile" as Href)} />
        <Divider inset={64} />
        <ListRow icon="settings-outline" title={t("more.settings")} onPress={() => router.push("/settings" as Href)} />
        <Divider inset={64} />
        <ListRow icon="log-out-outline" title={t("actions.signOut")} destructive chevron={false} onPress={confirmSignOut} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profile: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  tile: {
    width: "48.8%",
    minHeight: 112,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  tileIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: "center", justifyContent: "center", marginBottom: Spacing.xs },
  pressed: { opacity: 0.85 },
});

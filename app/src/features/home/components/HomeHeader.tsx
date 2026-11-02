import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { BrandMark } from "@/components/BrandMark";
import { Avatar, IconButton, Text } from "@/components/ui";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { routes } from "@/lib/routes";
import { useGetMeQuery } from "@/features/auth/api";

function greetingKey(): "greeting.morning" | "greeting.afternoon" | "greeting.evening" {
  const h = new Date().getHours();
  return h < 12 ? "greeting.morning" : h < 17 ? "greeting.afternoon" : "greeting.evening";
}

interface HomeHeaderProps {
  executive?: boolean;
  unread?: number;
}

/** Shared greeting header for every home variant (doc 05 §10). */
export const HomeHeader = memo(function HomeHeader({ executive = false, unread = 0 }: HomeHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation(["home", "common"]);
  const localized = useLocalized();
  const fmt = useFormat();
  const { data: me } = useGetMeQuery();
  const e = me?.employee;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surfaceInverse, borderBottomColor: executive ? theme.executiveSolid : "transparent" }]}>
      <View style={styles.topRow}>
        <BrandMark size={36} />
        <View style={styles.flex} />
        <IconButton
          icon="notifications-outline"
          color="textInverse"
          accessibilityLabel={t("notifications")}
          badge={unread}
          onPress={() => router.push(routes.notifications)}
        />
        <Pressable onPress={() => router.push(routes.profile)} accessibilityRole="button" accessibilityLabel={t("openProfile")} hitSlop={6}>
          {e ? <Avatar initials={e.initials} color={e.avatarColor} size={38} ring={executive} /> : null}
        </Pressable>
      </View>
      <Text variant="bodySmall" tint={executive ? theme.executiveSolid : theme.textTertiary}>
        {t(`common:${greetingKey()}`)}
      </Text>
      <Text variant="h1" color="textInverse" numberOfLines={1}>
        {e ? localized(e.shortName, e.fullNameBn.split(" ").slice(-1)[0]) : " "}
      </Text>
      <Text variant="caption" color="textTertiary" numberOfLines={1}>
        {e ? `${localized(e.designation.title, e.designation.titleBn)} · ${localized(e.site.name, e.site.nameBn)}` : " "}
      </Text>
      <Text variant="caption" color="textTertiary">
        {fmt.date(new Date(), "EEEE, d MMMM yyyy")}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: 2,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    borderBottomWidth: 3,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.md },
  flex: { flex: 1 },
});

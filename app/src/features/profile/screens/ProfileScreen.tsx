import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Card, Divider, ListRow, QueryState, Screen, SectionHeader, Text } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useFormat, useLocalized } from "@/hooks/useLanguage";
import { useGetMeQuery } from "@/features/auth/api";

export function ProfileScreen() {
  const { t } = useTranslation();
  const localized = useLocalized();
  const fmt = useFormat();
  const { data: me, isLoading, error, refetch, isFetching } = useGetMeQuery();
  const e = me?.employee;

  return (
    <Screen title={t("profile.title")} refreshing={isFetching && !isLoading} onRefresh={() => void refetch()}>
      <QueryState isLoading={isLoading} error={error} hasData={!!me} onRetry={() => void refetch()}>
        {me && e ? (
          <>
            <View style={styles.hero}>
              <Avatar initials={e.initials} color={e.avatarColor} size={84} ring />
              <Text variant="h2" align="center">
                {localized(e.fullName, e.fullNameBn)}
              </Text>
              <Text variant="body" color="textSecondary" align="center">
                {localized(e.designation.title, e.designation.titleBn)}
              </Text>
              <View style={styles.roles}>
                {me.roles.map((r) => (
                  <Badge key={r.key} label={r.name} tone="accent" />
                ))}
              </View>
            </View>

            <SectionHeader title={t("more.account")} />
            <Card padded={false}>
              <ListRow icon="id-card-outline" title={e.empCode} subtitle={t("profile.employeeId")} />
              <Divider inset={64} />
              <ListRow icon="business-outline" title={localized(e.department.name, e.department.nameBn)} subtitle={t("profile.department")} />
              <Divider inset={64} />
              <ListRow icon="location-outline" title={localized(e.site.name, e.site.nameBn)} subtitle={t("profile.site")} />
              <Divider inset={64} />
              <ListRow icon="ribbon-outline" title={`${e.grade.code} · ${e.grade.name}`} subtitle={t("profile.grade")} />
              {e.lineManager ? (
                <>
                  <Divider inset={64} />
                  <ListRow icon="git-network-outline" title={e.lineManager.fullName} subtitle={t("profile.manager")} />
                </>
              ) : null}
              <Divider inset={64} />
              <ListRow icon="calendar-outline" title={fmt.date(e.joinDate)} subtitle={t("profile.joined")} />
            </Card>

            <SectionHeader title={t("profile.phone")} />
            <Card padded={false}>
              <ListRow icon="call-outline" title={e.phone} subtitle={t("profile.phone")} />
              <Divider inset={64} />
              <ListRow icon="mail-outline" title={me.email} subtitle={t("profile.email")} />
              {e.bloodGroup ? (
                <>
                  <Divider inset={64} />
                  <ListRow icon="water-outline" iconTone="danger" title={e.bloodGroup} subtitle={t("profile.bloodGroup")} />
                </>
              ) : null}
            </Card>
          </>
        ) : null}
      </QueryState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: Spacing.xs, paddingVertical: Spacing.lg },
  roles: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: Spacing.xs, marginTop: Spacing.sm },
});

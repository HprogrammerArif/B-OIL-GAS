import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { IconButton, Screen, Segmented } from "@/components/ui";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { usePermissions } from "@/hooks/usePermission";
import { routes } from "@/lib/routes";
import { useGetUnreadCountQuery } from "@/features/notifications/api";
import { NotificationsPane } from "@/features/notifications/components/NotificationsPane";
import { useGetInboxSummaryQuery } from "../api";
import { ApprovalsPane } from "../components/ApprovalsPane";

type Segment = "approvals" | "notifications";

/** Inbox tab: approvals for anyone holding `workflow:inbox`, notifications for everyone. */
export function InboxScreen() {
  const { t } = useTranslation("approvals");
  const perms = usePermissions();
  const params = useLocalSearchParams<{ segment?: string }>();
  const isApprover = perms.can("workflow:inbox");
  const [chosen, setChosen] = useState<Segment>(params.segment === "notifications" ? "notifications" : "approvals");
  const segment: Segment = isApprover ? chosen : "notifications";
  const summary = useGetInboxSummaryQuery(undefined, { skip: !isApprover });
  const unread = useGetUnreadCountQuery();

  return (
    <Screen
      title={t("title")}
      back={false}
      scroll={false}
      padded={false}
      headerRight={
        <IconButton icon="time-outline" accessibilityLabel={t("history.title")} onPress={() => router.push(routes.approvalHistory)} />
      }
    >
      {isApprover ? (
        <View style={styles.segments}>
          <Segmented<Segment>
            options={[
              { value: "approvals", label: t("segments.approvals"), count: summary.data?.pending || undefined },
              { value: "notifications", label: t("segments.notifications"), count: unread.data?.total || undefined },
            ]}
            value={segment}
            onChange={setChosen}
          />
        </View>
      ) : null}
      {segment === "approvals" ? <ApprovalsPane /> : <NotificationsPane />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segments: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, width: "100%", maxWidth: MaxContentWidth, alignSelf: "center" },
});

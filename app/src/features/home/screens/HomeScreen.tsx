import { useCallback, useMemo, useState } from "react";
import { ScrollView, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SectionHeader, Segmented } from "@/components/ui";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { usePermissions } from "@/hooks/usePermission";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { baseApi } from "@/redux/api/baseApi";
import { homeVariantChanged } from "@/redux/slices/ui.slice";
import type { PermissionKey } from "@/types/domain/identity";
import { HomeHeader } from "../components/HomeHeader";
import { QuickActions, type QuickAction } from "../components/QuickActions";
import { homeVariantsFor, resolveHomeVariant, type HomeVariant } from "../persona-resolver";
import { HomeVariantBody } from "../components/HomeVariantBody";
import { useTabBadges } from "../useTabBadges";

type ActionDef = Omit<QuickAction, "label"> & { labelKey: string; permission: PermissionKey };

const ACTIONS: Record<string, ActionDef> = {
  punch: { key: "punch", labelKey: "actions.punch", icon: "finger-print-outline", tone: "success", href: "/attendance", permission: "attendance:punch" },
  leave: { key: "leave", labelKey: "actions.applyLeave", icon: "calendar-outline", tone: "success", href: "/leave/new", permission: "leave:request" },
  claim: { key: "claim", labelKey: "actions.newClaim", icon: "receipt-outline", tone: "warning", href: "/claims/new", permission: "claims:create" },
  vehicle: { key: "vehicle", labelKey: "actions.bookVehicle", icon: "car-outline", tone: "info", href: "/fleet/requisitions/new", permission: "fleet:request" },
  guest: { key: "guest", labelKey: "actions.inviteGuest", icon: "person-add-outline", tone: "accent", href: "/visitors/register", permission: "visitors:create" },
  incident: { key: "incident", labelKey: "actions.reportIncident", icon: "warning-outline", tone: "danger", href: "/incidents/report", permission: "incidents:report" },
  parcel: { key: "parcel", labelKey: "actions.sendParcel", icon: "cube-outline", tone: "purple", href: "/parcels/new", permission: "parcels:create" },
  scanPass: { key: "scanPass", labelKey: "actions.scanPass", icon: "qr-code-outline", tone: "accent", href: "/visitors/scan", permission: "visitors:gate" },
  scanParcel: { key: "scanParcel", labelKey: "actions.scanParcel", icon: "scan-outline", tone: "purple", href: "/parcels/scan", permission: "parcels:scan" },
  noteSheet: { key: "noteSheet", labelKey: "actions.newNoteSheet", icon: "document-text-outline", tone: "purple", href: "/note-sheets/new", permission: "note-sheets:create" },
};

const VARIANT_ACTIONS: Record<HomeVariant, string[]> = {
  employee: ["leave", "claim", "vehicle", "guest", "incident", "parcel", "punch", "noteSheet"],
  driver: ["punch", "scanParcel", "incident", "claim"],
  gate: ["scanPass", "scanParcel", "incident", "punch"],
  mailroom: ["scanParcel", "parcel", "incident", "punch"],
  hse: ["incident", "punch", "noteSheet", "leave"],
  approver: ["noteSheet", "leave", "claim", "vehicle", "guest", "incident", "punch", "parcel"],
  executive: ["noteSheet", "incident", "parcel", "claim"],
};

export function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation("home");
  const dispatch = useAppDispatch();
  const roles = useAppSelector((s) => s.auth.roles);
  const preferred = useAppSelector((s) => s.ui.homeVariant);
  const perms = usePermissions();
  const badges = useTabBadges();
  const [refreshing, setRefreshing] = useState(false);

  const variants = useMemo(() => homeVariantsFor(roles), [roles]);
  const variant = resolveHomeVariant(roles, preferred);

  const actions = useMemo(
    () =>
      VARIANT_ACTIONS[variant]
        .map((k) => ACTIONS[k])
        .filter((a): a is ActionDef => !!a && perms.can(a.permission))
        .slice(0, 8)
        .map(({ labelKey, permission: _p, ...a }) => ({ ...a, label: t(labelKey as "actions.punch") })),
    [variant, perms, t],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    dispatch(baseApi.util.invalidateTags(["Dashboard", "Inbox", "AttendanceToday", "Notice", "Notification", "Permissions"]));
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, [dispatch]);

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.surfaceInverse }]}>
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={theme.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader executive={variant === "executive"} unread={badges.unread} />
        <OfflineBanner />
        <View style={styles.body}>
          {variants.length > 1 ? (
            <View style={styles.switcher}>
              <Segmented<HomeVariant>
                options={variants.map((v) => ({ value: v, label: t(`variants.${v}`) }))}
                value={variant}
                onChange={(v) => dispatch(homeVariantChanged(v))}
              />
            </View>
          ) : null}

          <HomeVariantBody variant={variant} />

          {actions.length ? (
            <>
              <SectionHeader title={t("quickActions")} />
              <QuickActions actions={actions} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: Spacing.huge },
  body: { paddingHorizontal: Spacing.lg, width: "100%", maxWidth: MaxContentWidth, alignSelf: "center" },
  switcher: { marginTop: Spacing.lg },
});

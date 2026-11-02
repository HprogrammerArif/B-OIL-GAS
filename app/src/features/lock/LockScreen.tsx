import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { BrandMark } from "@/components/BrandMark";
import { Avatar, Button, Text } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLocalized } from "@/hooks/useLanguage";
import { authenticate } from "@/lib/biometrics";
import { haptic } from "@/lib/haptics";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { unlocked } from "@/redux/slices/auth.slice";
import { signOut } from "@/features/auth/session";

/** Full-screen gate shown over the app while `auth.locked`. */
export function LockScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const localized = useLocalized();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [busy, setBusy] = useState(false);

  const tryUnlock = useCallback(async () => {
    setBusy(true);
    try {
      if (await authenticate(t("lock.prompt"), t("actions.cancel"))) {
        haptic.success();
        dispatch(unlocked());
      }
    } finally {
      setBusy(false);
    }
  }, [dispatch, t]);

  // Prompt once on appearance; the button covers retries.
  useEffect(() => {
    void authenticate(t("lock.prompt"), t("actions.cancel")).then((ok) => {
      if (ok) {
        haptic.success();
        dispatch(unlocked());
      }
    });
  }, [dispatch, t]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: theme.brand }]} accessibilityViewIsModal>
      <StatusBar style="light" />
      <SafeAreaView style={styles.inner}>
        <BrandMark size={48} />
        <View style={styles.center}>
          {user ? <Avatar initials={user.initials} color={user.avatarColor} size={72} ring /> : null}
          {user ? (
            <Text variant="h2" color="onBrand" align="center">
              {localized(user.fullName, user.fullNameBn)}
            </Text>
          ) : null}
          <Text variant="h3" color="onBrand" align="center">
            {t("lock.title")}
          </Text>
          <Text variant="bodySmall" color="onBrandMuted" align="center">
            {t("lock.subtitle")}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button title={t("lock.unlock")} icon="finger-print" onPress={() => void tryUnlock()} loading={busy} />
          <Button title={t("lock.usePassword")} variant="ghost" onPress={() => void signOut(dispatch)} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 1000, elevation: 1000 },
  inner: { flex: 1, alignItems: "center", justifyContent: "space-between", padding: Spacing.xxl },
  center: { alignItems: "center", gap: Spacing.md },
  actions: { alignSelf: "stretch", gap: Spacing.sm },
});

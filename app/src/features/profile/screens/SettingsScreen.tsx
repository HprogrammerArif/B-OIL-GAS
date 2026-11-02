import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as Application from "expo-application";
import { useTranslation } from "react-i18next";
import { Badge, Card, Divider, IconButton, ListRow, Screen, SectionHeader, Segmented, Text, Toggle } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useFormat } from "@/hooks/useLanguage";
import { authenticate, biometricsAvailable } from "@/lib/biometrics";
import { isMockApi } from "@/lib/env";
import { toast } from "@/lib/toast";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { biometricToggled } from "@/redux/slices/auth.slice";
import { bengaliNumeralsToggled, colorSchemeChanged, languageChanged, type ColorSchemePreference } from "@/redux/slices/ui.slice";
import { useGetSessionsQuery, useRevokeSessionMutation, useUpdatePreferencesMutation } from "@/features/auth/api";

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const fmt = useFormat();
  const dispatch = useAppDispatch();
  const ui = useAppSelector((s) => s.ui);
  const biometricEnabled = useAppSelector((s) => s.auth.biometricEnabled);
  const [bioAvailable, setBioAvailable] = useState<boolean | null>(null);
  const { data: sessions } = useGetSessionsQuery();
  const [revoke] = useRevokeSessionMutation();
  const [savePrefs] = useUpdatePreferencesMutation();
  const lang = i18n.language === "bn" ? "bn" : "en";

  useEffect(() => {
    void biometricsAvailable().then(setBioAvailable);
  }, []);

  const setLang = (v: "en" | "bn") => {
    dispatch(languageChanged(v));
    void savePrefs({ lang: v === "bn" ? "BN" : "EN" });
  };

  const setScheme = (v: ColorSchemePreference) => {
    dispatch(colorSchemeChanged(v));
    void savePrefs({ theme: v === "system" ? "SYSTEM" : v === "dark" ? "DARK" : "LIGHT" });
  };

  const toggleBiometric = async (next: boolean) => {
    if (next && !(await authenticate(t("lock.prompt"), t("actions.cancel")))) return;
    dispatch(biometricToggled(next));
  };

  return (
    <Screen title={t("settings.title")}>
      <SectionHeader title={t("settings.language")} />
      <Segmented
        options={[
          { value: "en", label: t("settings.english") },
          { value: "bn", label: t("settings.bangla") },
        ]}
        value={lang}
        onChange={setLang}
      />
      {lang === "bn" ? (
        <View style={styles.toggleRow}>
          <View style={styles.flex}>
            <Text variant="bodyStrong">{t("settings.bengaliNumerals")}</Text>
            <Text variant="caption" color="textSecondary">
              {t("settings.bengaliNumeralsHint")}
            </Text>
          </View>
          <Toggle value={ui.bengaliNumerals} onChange={(v) => dispatch(bengaliNumeralsToggled(v))} accessibilityLabel={t("settings.bengaliNumerals")} />
        </View>
      ) : null}

      <SectionHeader title={t("settings.theme")} />
      <Segmented<ColorSchemePreference>
        options={[
          { value: "system", label: t("settings.themeSystem") },
          { value: "light", label: t("settings.themeLight") },
          { value: "dark", label: t("settings.themeDark") },
        ]}
        value={ui.colorScheme}
        onChange={setScheme}
      />

      <SectionHeader title={t("settings.security")} />
      <Card>
        <View style={styles.toggleRow}>
          <View style={styles.flex}>
            <Text variant="bodyStrong">{t("settings.biometric")}</Text>
            <Text variant="caption" color="textSecondary">
              {bioAvailable === false ? t("settings.biometricUnavailable") : t("settings.biometricHint")}
            </Text>
          </View>
          <Toggle
            value={biometricEnabled}
            disabled={!bioAvailable}
            onChange={(v) => void toggleBiometric(v)}
            accessibilityLabel={t("settings.biometric")}
          />
        </View>
      </Card>

      <SectionHeader title={t("settings.sessions")} count={sessions?.length} />
      <Card padded={false}>
        {(sessions ?? []).map((s, i) => (
          <View key={s.id}>
            {i > 0 ? <Divider inset={64} /> : null}
            <ListRow
              icon={s.platform === "IOS" ? "logo-apple" : s.platform === "ANDROID" ? "logo-android" : "desktop-outline"}
              title={s.deviceName}
              subtitle={fmt.ago(s.lastSeenAt)}
              trailing={
                s.isCurrent ? (
                  <Badge label={t("settings.thisDevice")} tone="success" />
                ) : (
                  <IconButton
                    icon="log-out-outline"
                    color="danger"
                    accessibilityLabel={t("settings.revoke")}
                    onPress={() =>
                      void revoke(s.id)
                        .unwrap()
                        .then(() => toast.success(t("settings.revoke")))
                    }
                  />
                )
              }
            />
          </View>
        ))}
      </Card>

      <SectionHeader title={t("settings.about")} />
      <Card padded={false}>
        <ListRow
          icon="information-circle-outline"
          title={t("appName")}
          subtitle={t("settings.version", { version: `${Application.nativeApplicationVersion ?? "dev"} (${Application.nativeBuildVersion ?? "0"})` })}
        />
        <Divider inset={64} />
        <ListRow
          icon={isMockApi ? "flask-outline" : "server-outline"}
          title={isMockApi ? t("settings.dataModeMock") : t("settings.dataModeLive")}
          subtitle={t("settings.dataMode")}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginTop: Spacing.sm },
});

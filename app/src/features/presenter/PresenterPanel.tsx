import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, ListRow, SectionHeader, Segmented, Sheet, Text, Toggle } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useLocalized } from "@/hooks/useLanguage";
import { setMockLatency } from "@/mock/server";
import { toast } from "@/lib/toast";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { baseApi } from "@/redux/api/baseApi";
import { TAG_TYPES } from "@/redux/api/tags";
import { colorSchemeChanged, languageChanged, type ColorSchemePreference } from "@/redux/slices/ui.slice";
import { authApi, useDemoPersonasQuery } from "@/features/auth/api";
import { signInAsPersona } from "@/features/auth/session";
import { toApiError } from "@/lib/api-error";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function PresenterPanel({ visible, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const localized = useLocalized();
  const currentCode = useAppSelector((s) => s.auth.user?.empCode);
  const colorScheme = useAppSelector((s) => s.ui.colorScheme);
  const { data: personas } = useDemoPersonasQuery(undefined, { skip: !visible });
  const [busy, setBusy] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);

  const switchTo = async (empCode: string, name: string) => {
    setBusy(empCode);
    try {
      await signInAsPersona(dispatch, empCode);
      toast.success(t("presenter.switched", { name }));
      onClose();
      router.replace("/");
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    Alert.alert(t("presenter.reset"), t("presenter.resetConfirm"), [
      { text: t("actions.cancel"), style: "cancel" },
      {
        text: t("actions.confirm"),
        style: "destructive",
        onPress: async () => {
          await dispatch(authApi.endpoints.demoReset.initiate()).unwrap();
          dispatch(baseApi.util.invalidateTags([...TAG_TYPES]));
          toast.success(t("presenter.resetDone"));
          onClose();
        },
      },
    ]);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t("presenter.title")} subtitle={t("presenter.subtitle")}>
      <SectionHeader title={t("presenter.persona")} />
      <View style={styles.list}>
        {(personas ?? []).map((p) => {
          const name = localized(p.fullName, p.fullNameBn);
          const active = p.empCode === currentCode;
          return (
            <ListRow
              key={p.empCode}
              title={name}
              subtitle={localized(p.designation, p.designationBn)}
              leading={<Avatar initials={p.initials} color={p.avatarColor} size={36} />}
              trailing={
                active ? (
                  <Badge label={localized(p.roleLabel, p.roleLabelBn)} tone="success" dot />
                ) : (
                  <Badge label={busy === p.empCode ? "…" : localized(p.roleLabel, p.roleLabelBn)} tone="neutral" />
                )
              }
              chevron={false}
              onPress={active || busy ? undefined : () => void switchTo(p.empCode, name)}
            />
          );
        })}
      </View>

      <SectionHeader title={t("settings.language")} />
      <Segmented
        options={[
          { value: "en", label: t("settings.english") },
          { value: "bn", label: t("settings.bangla") },
        ]}
        value={i18n.language === "bn" ? "bn" : "en"}
        onChange={(v) => dispatch(languageChanged(v))}
      />

      <SectionHeader title={t("settings.theme")} />
      <Segmented<ColorSchemePreference>
        options={[
          { value: "system", label: t("settings.themeSystem") },
          { value: "light", label: t("settings.themeLight") },
          { value: "dark", label: t("settings.themeDark") },
        ]}
        value={colorScheme}
        onChange={(v) => dispatch(colorSchemeChanged(v))}
      />

      <View style={styles.toggleRow}>
        <Text variant="bodyStrong" style={styles.flex}>
          {t("presenter.slowNetwork")}
        </Text>
        <Toggle
          value={slow}
          accessibilityLabel={t("presenter.slowNetwork")}
          onChange={(v) => {
            setSlow(v);
            if (v) setMockLatency(1200, 2400);
            else setMockLatency(120, 380);
          }}
        />
      </View>

      <ListRow title={t("presenter.reset")} icon="refresh-outline" destructive onPress={reset} chevron={false} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { marginHorizontal: -Spacing.lg },
  toggleRow: { flexDirection: "row", alignItems: "center", marginTop: Spacing.lg },
  flex: { flex: 1 },
});

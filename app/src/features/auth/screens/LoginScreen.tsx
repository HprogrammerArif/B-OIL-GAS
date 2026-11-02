import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { BrandMark } from "@/components/BrandMark";
import { Button, FormField, Icon, Segmented, Text, Toggle } from "@/components/ui";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useFormat } from "@/hooks/useLanguage";
import { errorReason, toApiError } from "@/lib/api-error";
import { isMockApi } from "@/lib/env";
import { haptic } from "@/lib/haptics";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { languageChanged } from "@/redux/slices/ui.slice";
import { loginSchema, type LoginForm } from "../schemas";
import { rememberedIdentifier, signIn } from "../session";

export function LoginScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation(["auth", "common", "errors"]);
  const fmt = useFormat();
  const dispatch = useAppDispatch();
  const endReason = useAppSelector((s) => s.auth.endReason);
  const passwordRef = useRef<TextInput>(null);
  // Keys, not strings, so the alert follows a language switch on this screen.
  const [formError, setFormError] = useState<{ key: string; time?: string } | null>(
    endReason === "expired" ? { key: "errors.expired" } : null,
  );
  const [showForgot, setShowForgot] = useState(false);

  const { control, handleSubmit, setValue, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", rememberMe: true },
  });

  useEffect(() => {
    void rememberedIdentifier().then((id) => {
      if (id) setValue("identifier", id);
    });
  }, [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn(dispatch, values);
      haptic.success();
    } catch (error) {
      haptic.error();
      const apiError = toApiError(error);
      const reason = errorReason(apiError);
      if (reason === "ACCOUNT_LOCKED") {
        const until = apiError.details.find((d) => typeof d.lockedUntil === "string")?.lockedUntil;
        setFormError({ key: "errors.locked", time: typeof until === "string" ? fmt.time(until) : "15 min" });
      } else if (reason === "ACCOUNT_DISABLED" || reason === "EMPLOYEE_OFFBOARDED") {
        setFormError({ key: "errors.disabled" });
      } else if (apiError.code === "UNAUTHENTICATED" || apiError.code === "VALIDATION_ERROR") {
        setFormError({ key: "errors.invalid" });
      } else {
        setFormError({ key: apiError.code === "NETWORK" ? "errors:network" : "errors:generic" });
      }
      setValue("password", "");
    }
  });

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.hero, { backgroundColor: theme.brand }]}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.heroTop}>
            <View style={styles.langSwitch}>
              <Segmented
                options={[
                  { value: "en", label: "EN" },
                  { value: "bn", label: "বাং" },
                ]}
                value={i18n.language === "bn" ? "bn" : "en"}
                onChange={(v) => dispatch(languageChanged(v))}
              />
            </View>
          </View>
          <View style={styles.brandRow}>
            <BrandMark size={56} />
            <View style={styles.flex}>
              <Text variant="h1" color="onBrand">
                {t("common:appName")}
              </Text>
              <Text variant="bodySmall" tint={theme.executiveSolid}>
                {t("common:company")}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView style={[styles.flex, styles.overlap]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text variant="h2">{t("welcome")}</Text>
            <Text variant="bodySmall" color="textSecondary">
              {t("subtitle")}
            </Text>

            {formError ? (
              <View style={[styles.alert, { backgroundColor: theme.dangerMuted }]} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                <Icon name="alert-circle" size={18} color="danger" />
                <Text variant="bodySmall" color="danger" style={styles.flex}>
                  {t(formError.key as "errors.invalid", { time: formError.time })}
                </Text>
              </View>
            ) : null}

            <FormField
              control={control}
              name="identifier"
              label={t("identifier")}
              placeholder={t("identifierPlaceholder")}
              icon="person-outline"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              testID="login-identifier"
            />
            <FormField
              control={control}
              name="password"
              label={t("password")}
              icon="lock-closed-outline"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void onSubmit()}
              testID="login-password"
            />

            <View style={styles.row}>
              <Controller
                control={control}
                name="rememberMe"
                render={({ field }) => (
                  <View style={styles.remember}>
                    <Toggle value={field.value} onChange={field.onChange} accessibilityLabel={t("keepSignedIn")} />
                    <Text variant="bodySmall" style={styles.flex}>{t("keepSignedIn")}</Text>
                  </View>
                )}
              />
              <Pressable onPress={() => setShowForgot((v) => !v)} hitSlop={10} accessibilityRole="button">
                <Text variant="bodySmall" weight="bold" color="accent">
                  {t("forgot")}
                </Text>
              </Pressable>
            </View>
            {showForgot ? (
              <Text variant="caption" color="textSecondary">
                {t("forgotHint")}
              </Text>
            ) : null}

            <Button title={t("signIn")} onPress={() => void onSubmit()} loading={formState.isSubmitting} icon="log-in-outline" testID="login-submit" />
          </View>

          <View style={styles.footer}>
            <Icon name="shield-checkmark-outline" size={14} color="textTertiary" />
            <Text variant="caption" color="textTertiary">
              {t("secureNote")}
            </Text>
          </View>
          {isMockApi ? (
            <Text variant="caption" color="textTertiary" align="center">
              {t("demoHint")}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.huge + Spacing.lg, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl },
  heroTop: { flexDirection: "row", justifyContent: "flex-end", paddingTop: Spacing.sm },
  langSwitch: { width: 120 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginTop: Spacing.xl },
  /** Android paints by elevation, so the form needs to sit above the hero to overlap it. */
  overlap: { marginTop: -Spacing.huge, zIndex: 1, elevation: 4 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, flexGrow: 1 },
  card: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.lg,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  alert: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  remember: { flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginRight: Spacing.md },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.xs },
});
